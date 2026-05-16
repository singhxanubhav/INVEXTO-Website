import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const events = await prisma.simulationEvent.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        startRealDate: true,
        endRealDate: true,
        durationDays: true,
      },
      orderBy: { startRealDate: "desc" },
    });
    const mapped = events.map((e) => ({
      ...e,
      startRealDate: e.startRealDate.toISOString(),
      endRealDate: e.endRealDate.toISOString(),
      type: (e.name.toLowerCase().includes("crash") ||
      e.name.toLowerCase().includes("selloff") ||
      e.name.toLowerCase().includes("crisis") ||
      e.name.toLowerCase().includes("demonetisation")
        ? "crash"
        : "rally") as "crash" | "rally",
    }));
    return NextResponse.json({ success: true, data: mapped });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch simulations" },
      { status: 500 }
    );
  }
}
