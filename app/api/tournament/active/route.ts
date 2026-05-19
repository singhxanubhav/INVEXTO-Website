import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";
import { fetchQuote } from "@/src/lib/yahoo-finance";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession(req);

    const tournament = await prisma.tournament.findFirst({
      where: { status: "active" },
    });

    if (!tournament) {
      return NextResponse.json({ success: true, data: null });
    }

    const registration = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: tournament.id,
          userId: user.id,
        },
      },
    });

    const totalParticipants = await prisma.tournamentRegistration.count({
      where: { tournamentId: tournament.id },
    });

    let portfolio: Record<string, unknown> | null = null;
    let rank: number | null = null;

    if (registration) {
      const dbPortfolio = await prisma.portfolio.findFirst({
        where: { userId: user.id, mode: "tournament", tournamentId: tournament.id },
        include: { holdings: { include: { stock: true } } },
      });

      if (dbPortfolio) {
        let stockValue = 0;
        const holdings = await Promise.all(
          (dbPortfolio.holdings ?? [])
            .filter((h) => h.quantity > 0)
            .map(async (h) => {
              let price = 0;
              try {
                const quote = await fetchQuote(h.stock.symbol);
                price = quote?.regularMarketPrice ? Number(quote.regularMarketPrice) : 0;
              } catch {
                price = 0;
              }
              stockValue += h.quantity * price;
              return {
                symbol: h.stock.symbol,
                name: h.stock.name,
                quantity: h.quantity,
                avgBuyPrice: Number(h.avgBuyPrice),
                currentPrice: price,
                value: h.quantity * price,
                gainLoss: h.quantity * (price - Number(h.avgBuyPrice)),
              };
            })
        );

        const totalValue = stockValue + Number(dbPortfolio.cashBalance);

        const higherCount = await prisma.tournamentRegistration.count({
          where: { tournamentId: tournament.id, finalValue: { gt: totalValue } },
        });
        rank = higherCount + 1;

        portfolio = {
          cashBalance: Number(dbPortfolio.cashBalance),
          holdings,
          totalValue,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        tournament: {
          id: tournament.id,
          startDate: tournament.startDate.toISOString(),
          endDate: tournament.endDate.toISOString(),
          prizePool: tournament.prizePool,
        },
        isRegistered: !!registration,
        portfolio,
        rank,
        totalParticipants,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[Tournament] active error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tournament status" },
      { status: 500 }
    );
  }
}
