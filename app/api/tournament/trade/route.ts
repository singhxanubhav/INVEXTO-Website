import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession(req);
    const { stockSymbol, quantity, type } = await req.json();

    if (!stockSymbol || !quantity || quantity <= 0 || !["buy", "sell"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    const tournament = await prisma.tournament.findFirst({
      where: { status: "active" },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "No active tournament" },
        { status: 400 }
      );
    }

    const registration = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: tournament.id,
          userId: user.id,
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, error: "You are not registered in the tournament" },
        { status: 400 }
      );
    }

    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: user.id, inTournament: true, tournamentId: tournament.id },
    });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: "Tournament portfolio not found" },
        { status: 404 }
      );
    }

    const quote = await fetchQuote(stockSymbol);
    const currentPrice = quote?.regularMarketPrice ? Number(quote.regularMarketPrice) : null;

    if (!currentPrice) {
      return NextResponse.json(
        { success: false, error: "Unable to fetch live price. Try again." },
        { status: 503 }
      );
    }

    const stockRecord = await ensureStockRecord(stockSymbol);

    if (type === "buy") {
      const total = currentPrice * quantity;
      const cashBalance = Number(portfolio.cashBalance);

      if (cashBalance < total) {
        return NextResponse.json(
          { success: false, error: "Insufficient cash balance" },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: { cashBalance: cashBalance - total },
        });

        const existing = await tx.holding.findUnique({
          where: {
            portfolioId_stockId: {
              portfolioId: portfolio.id,
              stockId: stockRecord.id,
            },
          },
        });

        if (existing) {
          const oldQty = existing.quantity;
          const oldAvg = Number(existing.avgBuyPrice);
          const newAvg = (oldAvg * oldQty + currentPrice * quantity) / (oldQty + quantity);
          await tx.holding.update({
            where: { id: existing.id },
            data: { quantity: oldQty + quantity, avgBuyPrice: newAvg },
          });
        } else {
          await tx.holding.create({
            data: {
              portfolioId: portfolio.id,
              stockId: stockRecord.id,
              quantity,
              avgBuyPrice: currentPrice,
            },
          });
        }

        await tx.transaction.create({
          data: {
            portfolioId: portfolio.id,
            stockId: stockRecord.id,
            type: "buy",
            quantity,
            price: currentPrice,
            total,
          },
        });
      });

      SimpleCache.del("tournament:leaderboard");

      return NextResponse.json({
        success: true,
        data: {
          symbol: stockSymbol,
          quantity,
          price: currentPrice,
          total: currentPrice * quantity,
          type: "buy",
          newCashBalance: Number(portfolio.cashBalance) - currentPrice * quantity,
        },
      });
    } else {
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
          { success: false, error: "Insufficient shares" },
          { status: 400 }
        );
      }

      const proceeds = currentPrice * quantity;
      const avgBuyPrice = Number(holding.avgBuyPrice);
      const realizedGain = (currentPrice - avgBuyPrice) * quantity;

      await prisma.$transaction(async (tx) => {
        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: { cashBalance: Number(portfolio.cashBalance) + proceeds },
        });

        const remaining = holding.quantity - quantity;
        if (remaining === 0) {
          await tx.holding.delete({ where: { id: holding.id } });
        } else {
          await tx.holding.update({
            where: { id: holding.id },
            data: { quantity: remaining },
          });
        }

        await tx.transaction.create({
          data: {
            portfolioId: portfolio.id,
            stockId: stockRecord.id,
            type: "sell",
            quantity,
            price: currentPrice,
            total: proceeds,
            realizedGain,
          },
        });
      });

      SimpleCache.del("tournament:leaderboard");

      return NextResponse.json({
        success: true,
        data: {
          symbol: stockSymbol,
          quantity,
          price: currentPrice,
          total: proceeds,
          type: "sell",
          newCashBalance: Number(portfolio.cashBalance) + proceeds,
          realizedGain,
        },
      });
    }
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[Tournament] trade error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process trade" },
      { status: 500 }
    );
  }
}
