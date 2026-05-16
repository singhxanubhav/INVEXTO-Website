import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(req);
    const { id } = await params;

    const event = await prisma.simulationEvent.findUnique({
      where: { id },
    });
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    const stocks = await prisma.stock.findMany({
      where: { isActive: true },
      select: { symbol: true, name: true, sector: true },
      orderBy: { symbol: "asc" },
    });

    const stockPrices = await prisma.stockPrice.findMany({
      where: {
        stock: { isActive: true },
        priceType: "simulated",
      },
      select: {
        stock: { select: { symbol: true } },
        price: true,
      },
    });

    const basePrices: Record<string, number> = {};
    for (const sp of stockPrices) {
      basePrices[sp.stock.symbol] = Number(sp.price);
    }

    for (const s of stocks) {
      if (!basePrices[s.symbol]) {
        basePrices[s.symbol] = 100;
      }
    }

    const multipliers = event.priceMultipliers as Record<string, number[]>;
    const type =
      event.name.toLowerCase().includes("crash") ||
      event.name.toLowerCase().includes("selloff") ||
      event.name.toLowerCase().includes("crisis") ||
      event.name.toLowerCase().includes("demonetisation")
        ? "crash"
        : "rally";

    return NextResponse.json({
      success: true,
      data: {
        event: {
          id: event.id,
          name: event.name,
          description: event.description,
          startRealDate: event.startRealDate.toISOString(),
          endRealDate: event.endRealDate.toISOString(),
          durationDays: event.durationDays,
          type,
        },
        stocks,
        basePrices,
        multipliers,
        startingCash: 100000,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    return NextResponse.json(
      { success: false, error: "Failed to start simulation" },
      { status: 500 }
    );
  }
}
