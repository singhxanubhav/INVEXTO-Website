import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";
import { fetchQuotes } from "@/src/lib/yahoo-finance";
import { getStockBySymbol } from "@/src/data/nse-stocks";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSession(request);

    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: user.id },
      include: {
        holdings: {
          include: {
            stock: {
              select: { symbol: true, name: true, sector: true },
            },
          },
        },
        transactions: {
          where: { type: "sell" },
          select: { realizedGain: true },
        },
      },
    });

    if (!portfolio) {
      const newPortfolio = await prisma.portfolio.create({
        data: { userId: user.id, cashBalance: 100000 },
      });
      return NextResponse.json({
        success: true,
        data: {
          holdings: [],
          cashBalance: Number(newPortfolio.cashBalance),
          totalInvested: 0,
          totalCurrentValue: Number(newPortfolio.cashBalance),
          unrealizedGain: 0,
          todayGain: 0,
          realizedGainTillDate: 0,
          inTournament: false,
          tournamentId: null,
        },
      });
    }

    const symbols = portfolio.holdings.map((h) => h.stock.symbol);
    const quotes = symbols.length > 0 ? await fetchQuotes(symbols) : {};

    const holdings = portfolio.holdings.map((h) => {
      const q = quotes[h.stock.symbol];
      const currentPrice = q?.regularMarketPrice
        ? Number(q.regularMarketPrice)
        : 0;
      const previousClose = q?.regularMarketPreviousClose
        ? Number(q.regularMarketPreviousClose)
        : currentPrice;
      const avgBuyPrice = Number(h.avgBuyPrice);
      const quantity = h.quantity;
      const currentValue = quantity * currentPrice;
      const invested = quantity * avgBuyPrice;
      const gainLoss = currentValue - invested;
      const gainLossPct =
        avgBuyPrice > 0
          ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100
          : 0;
      const todayGain = quantity * (currentPrice - previousClose);

      return {
        id: h.id,
        stockId: h.stockId,
        symbol: h.stock.symbol,
        name: h.stock.name,
        sector: h.stock.sector,
        quantity,
        avgBuyPrice,
        currentPrice,
        previousClose,
        currentValue,
        invested,
        gainLoss,
        gainLossPct,
        todayGain,
      };
    });

    const cashBalance = Number(portfolio.cashBalance);
    const totalInvested = holdings.reduce((s, h) => s + h.invested, 0);
    const totalCurrentValue = holdings.reduce((s, h) => s + h.currentValue, 0);
    const unrealizedGain = totalCurrentValue - totalInvested;
    const todayGain = holdings.reduce((s, h) => s + h.todayGain, 0);
    const realizedGainTillDate = portfolio.transactions.reduce(
      (s, t) => s + Number(t.realizedGain || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        holdings,
        cashBalance,
        totalInvested,
        totalCurrentValue: cashBalance + totalCurrentValue,
        unrealizedGain,
        todayGain,
        realizedGainTillDate,
        inTournament: portfolio.inTournament,
        tournamentId: portfolio.tournamentId,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Portfolio API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}
