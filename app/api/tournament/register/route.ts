import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession(req);
    const { phone } = await req.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Phone must be exactly 10 digits" },
        { status: 400 }
      );
    }

    const tournament = await prisma.tournament.findFirst({
      where: { status: "active" },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "No active tournament right now" },
        { status: 400 }
      );
    }

    const existing = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: tournament.id,
          userId: user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Already registered" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const portfolio = await tx.portfolio.findFirst({
        where: { userId: user.id },
      });

      if (portfolio) {
        await tx.holding.deleteMany({
          where: { portfolioId: portfolio.id },
        });

        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: {
            cashBalance: 100000,
            inTournament: true,
            tournamentId: tournament.id,
          },
        });
      }

      await tx.tournamentRegistration.create({
        data: {
          tournamentId: tournament.id,
          userId: user.id,
          phone,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        tournament: {
          id: tournament.id,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          prizePool: tournament.prizePool,
        },
        message: "Portfolio reset. Tournament started! You have ₹1,00,000 to invest.",
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[Tournament] register error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register for tournament" },
      { status: 500 }
    );
  }
}
