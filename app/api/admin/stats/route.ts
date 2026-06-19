import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession(req);
    if (!user.isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const [totalUsers, activeParticipants, activeTournament] = await Promise.all([
      prisma.user.count(),
      prisma.tournamentRegistration.count({
        where: { tournament: { status: "active" } },
      }),
      prisma.tournament.findFirst({
        where: { status: "active" },
        select: { startDate: true, endDate: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeParticipants,
        activeTournament: activeTournament
          ? {
              startDate: activeTournament.startDate.toISOString(),
              endDate: activeTournament.endDate.toISOString(),
            }
          : null,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Admin stats error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
