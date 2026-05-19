import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession(req);
    const { name, phone, email } = await req.json();

    if (!name || name.length < 2) {
      return NextResponse.json(
        { success: false, error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Phone must be exactly 10 digits" },
        { status: 400 }
      );
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
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

    const registration = await prisma.$transaction(async (tx) => {
      const reg = await tx.tournamentRegistration.create({
        data: {
          tournamentId: tournament.id,
          userId: user.id,
          phone,
        },
      });

      await tx.portfolio.create({
        data: {
          userId: user.id,
          mode: "tournament",
          tournamentId: tournament.id,
          cashBalance: 100000,
        },
      });

      return reg;
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
        registration: {
          id: registration.id,
          phone: registration.phone,
        },
        message: "Successfully registered!",
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
