import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { enrollAllUsersInTournament } from "@/src/lib/tournament";

export async function POST(request: NextRequest) {
  try {
    const user = await requireSession(request);
    if (!(user as any).isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    let tournamentId = body.tournamentId;

    if (!tournamentId) {
      const activeTournament = await prisma.tournament.findFirst({
        where: { status: "active" },
      });
      if (!activeTournament) {
        return NextResponse.json(
          { success: false, error: "No active tournament found to sync" },
          { status: 404 }
        );
      }
      tournamentId = activeTournament.id;
    }

    const result = await enrollAllUsersInTournament(tournamentId);

    return NextResponse.json({
      success: true,
      data: {
        tournamentId,
        enrolledCount: result.enrolledCount,
        totalParticipants: result.totalParticipants,
      },
      message: `Successfully synced! ${result.enrolledCount} users enrolled. Total participants: ${result.totalParticipants}.`,
    });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    console.error("[Tournament Sync Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to sync tournament participants", details: err.message },
      { status: 500 }
    );
  }
}
