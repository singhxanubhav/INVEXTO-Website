import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament || tournament.status !== "completed") {
      return NextResponse.json(
        { success: false, error: "Tournament not found or not yet completed" },
        { status: 404 }
      );
    }

    const registrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId: id, finalRank: { not: null } },
      orderBy: { finalRank: "asc" },
      take: 10,
      include: { user: true },
    });

    const totalParticipants = await prisma.tournamentRegistration.count({
      where: { tournamentId: id },
    });

    const results = registrations.map((r) => ({
      rank: r.finalRank,
      name: r.user.name,
      finalValue: r.finalValue ? Number(r.finalValue) : 0,
      prizeAmount: r.prizeAmount ? Number(r.prizeAmount) : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        tournament: {
          startDate: tournament.startDate.toISOString(),
          endDate: tournament.endDate.toISOString(),
        },
        totalParticipants,
        results,
      },
    });
  } catch (error) {
    console.error("[Tournament] results error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
