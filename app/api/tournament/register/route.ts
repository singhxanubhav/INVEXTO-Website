import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession(req);
    const { phone, upiId } = await req.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Phone must be exactly 10 digits" },
        { status: 400 }
      );
    }

    if (!upiId || typeof upiId !== "string" || upiId.length < 5) {
      return NextResponse.json(
        { success: false, error: "Valid UPI ID is required" },
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
      // Update user's UPI ID for prize payouts
      await tx.user.update({
        where: { id: user.id },
        data: { upiId },
      });

      await tx.portfolio.create({
        data: {
          userId: user.id,
          cashBalance: 100000,
          inTournament: true,
          tournamentId: tournament.id,
        },
      });

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
