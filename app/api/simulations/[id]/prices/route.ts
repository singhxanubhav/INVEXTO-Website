import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await prisma.simulationEvent.findUnique({
      where: { id },
      select: { priceMultipliers: true, durationDays: true },
    });
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }
    const multipliers = event.priceMultipliers as Record<string, number[]>;
    return NextResponse.json({
      success: true,
      data: { multipliers, durationDays: event.durationDays },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch price data" },
      { status: 500 }
    );
  }
}
