import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { fetchQuotes } from "@/src/lib/yahoo-finance";
import { SimpleCache } from "@/src/lib/simple-cache";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tournamentId } = await params;
    const cacheKey = `tournament:leaderboard:${tournamentId}`;
    const cached = SimpleCache.get<any>(cacheKey);
    
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json({
        success: false,
        error: "Tournament not found",
      }, { status: 404 });
    }

    if (tournament.status === "completed") {
      return NextResponse.json({
        success: false,
        redirect: `/tournament/results/${tournament.id}`,
      });
    }

    const [registrations, portfolios] = await Promise.all([
      prisma.tournamentRegistration.findMany({
        where: { tournamentId: tournament.id },
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.portfolio.findMany({
        where: { tournamentId: tournament.id, inTournament: true },
        include: {
          holdings: {
            where: { quantity: { gt: 0 } },
            include: { stock: { select: { symbol: true } } },
          },
        },
      }),
    ]);

    const portfolioMap = new Map(portfolios.map((p) => [p.userId, p]));

    const symbolsSet = new Set<string>();
    for (const p of portfolios) {
      for (const h of p.holdings) {
        if (h.stock?.symbol) {
          symbolsSet.add(h.stock.symbol);
        }
      }
    }

    const quotes = symbolsSet.size > 0 ? await fetchQuotes(Array.from(symbolsSet)) : {};

    const entries = registrations.map((reg) => {
      const portfolio = portfolioMap.get(reg.userId);

      if (!portfolio) {
        return {
          userId: reg.userId,
          name: reg.user.name,
          totalValue: 100000,
          unrealizedGain: 0,
          unrealizedGainPct: 0,
          prizeAmount: 0,
        };
      }

      let stockValue = 0;
      for (const h of portfolio.holdings) {
        if (h.quantity <= 0) continue;
        const q = quotes[h.stock.symbol];
        const price = q?.regularMarketPrice ? Number(q.regularMarketPrice) : Number(h.avgBuyPrice);
        stockValue += h.quantity * price;
      }

      const totalValue = stockValue + Number(portfolio.cashBalance);
      const unrealizedGain = totalValue - 100000;
      const unrealizedGainPct = (unrealizedGain / 100000) * 100;

      return {
        userId: reg.userId,
        name: reg.user.name,
        totalValue: Math.round(totalValue * 100) / 100,
        unrealizedGain: Math.round(unrealizedGain * 100) / 100,
        unrealizedGainPct: Math.round(unrealizedGainPct * 100) / 100,
        prizeAmount: 0,
      };
    });

    entries.sort((a, b) => b.totalValue - a.totalValue);

    const prizePool = (tournament.prizePool as Record<string, number>) || {};
    const prizeMap: Record<number, number> = {
      1: prizePool.first ?? 0,
      2: prizePool.second ?? 0,
      3: prizePool.third ?? 0,
      4: prizePool.fourth ?? 0,
      5: prizePool.fifth ?? 0,
    };

    const leaderboard = entries.map((entry, i) => ({
      rank: i + 1,
      ...entry,
      prizeAmount: i < 5 ? (prizeMap[i + 1] ?? 0) : 0,
    }));

    const data = {
      leaderboard,
      totalParticipants: entries.length,
      lastUpdated: new Date().toISOString(),
      tournament: {
        startDate: tournament.startDate.toISOString(),
        endDate: tournament.endDate.toISOString(),
        prizePool: tournament.prizePool,
      },
    };

    SimpleCache.set(cacheKey, data, 120);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Tournament] leaderboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
