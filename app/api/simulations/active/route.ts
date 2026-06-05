import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession(req);

    const snapshot = await prisma.simulationSnapshot.findUnique({
      where: { userId: user.id },
    });

    if (!snapshot) {
      return NextResponse.json({
        success: true,
        data: { hasActiveSimulation: false },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        hasActiveSimulation: true,
        eventId: snapshot.eventId,
        startedAt: snapshot.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[Simulations] active error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check simulation status" },
      { status: 500 }
    );
  }
}
