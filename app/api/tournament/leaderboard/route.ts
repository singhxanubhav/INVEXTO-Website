import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { fetchQuote } from "@/src/lib/yahoo-finance";
import { SimpleCache } from "@/src/lib/simple-cache";

export async function GET() {
  try {
    const cached = SimpleCache.get<any>("tournament:leaderboard");
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const tournament = await prisma.tournament.findFirst({
      where: { status: "active" },
    });

    if (!tournament) {
      return NextResponse.json({
        success: true,
        data: { leaderboard: [], totalParticipants: 0, lastUpdated: new Date().toISOString(), tournament: null },
      });
    }

    const registrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId: tournament.id },
      include: {
        user: true,
      },
    });

    const entries = await Promise.all(
      registrations.map(async (reg) => {
        const portfolio = await prisma.portfolio.findFirst({
          where: { userId: reg.userId, mode: "tournament", tournamentId: tournament.id },
          include: { holdings: { include: { stock: true } } },
        });

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
          let price = 0;
          try {
            const quote = await fetchQuote(h.stock.symbol);
            price = quote?.regularMarketPrice ? Number(quote.regularMarketPrice) : Number(h.avgBuyPrice);
          } catch {
            price = Number(h.avgBuyPrice);
          }
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
      })
    );

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

    SimpleCache.set("tournament:leaderboard", data, 120);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Tournament] leaderboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
