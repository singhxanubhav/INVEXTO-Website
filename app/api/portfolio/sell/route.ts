import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";
import { fetchQuote } from "@/src/lib/yahoo-finance";
import { getStockBySymbol } from "@/src/data/nse-stocks";
import { SimpleCache } from "@/src/lib/simple-cache";

async function ensureStockRecord(symbol: string) {
  const existing = await prisma.stock.findUnique({ where: { symbol } });
  if (existing) return existing;

  const info = getStockBySymbol(symbol);
  return prisma.stock.create({
    data: {
      symbol,
      name: info?.name ?? symbol,
      sector: info?.sector ?? "Other",
      faceValue: 1,
      sharesOutstanding: BigInt(0),
      keyStats: {},
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSession(request);
    const { symbol, quantity } = await request.json();

    if (!symbol || !quantity || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid symbol or quantity" },
        { status: 400 }
      );
    }

    const quote = await fetchQuote(symbol);
    const currentPrice = quote?.regularMarketPrice
      ? Number(quote.regularMarketPrice)
      : null;

    if (!currentPrice) {
      return NextResponse.json(
        { success: false, error: "Could not fetch current price" },
        { status: 400 }
      );
    }

    const stockRecord = await ensureStockRecord(symbol);

    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: user.id },
    });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: "Portfolio not found" },
        { status: 404 }
      );
    }

    const holding = await prisma.holding.findUnique({
      where: {
        portfolioId_stockId: {
          portfolioId: portfolio.id,
          stockId: stockRecord.id,
        },
      },
    });

    if (!holding || holding.quantity < quantity) {
      return NextResponse.json(
        { success: false, error: "Insufficient shares to sell" },
        { status: 400 }
      );
    }

    const avgBuyPrice = Number(holding.avgBuyPrice);
    const total = currentPrice * quantity;
    const realizedGain = (currentPrice - avgBuyPrice) * quantity;
    const newQuantity = holding.quantity - quantity;
    const cashBalance = Number(portfolio.cashBalance);

    const result = await prisma.$transaction(async (tx) => {
      await tx.portfolio.update({
        where: { id: portfolio.id },
        data: { cashBalance: cashBalance + total },
      });

      if (newQuantity === 0) {
        await tx.holding.delete({ where: { id: holding.id } });
      } else {
        await tx.holding.update({
          where: { id: holding.id },
          data: { quantity: newQuantity },
        });
      }

      const txn = await tx.transaction.create({
        data: {
          portfolioId: portfolio.id,
          stockId: stockRecord.id,
          type: "sell",
          quantity,
          price: currentPrice,
          total,
          realizedGain,
        },
      });

      return txn;
    });

    if (portfolio.inTournament) {
      SimpleCache.del("tournament:leaderboard");
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionId: result.id,
        quantity,
        price: currentPrice,
        total,
        realizedGain,
        cashBalance: cashBalance + total,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Sell API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process sell" },
      { status: 500 }
    );
  }
}

