import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";
import { fetchHistoricalMulti } from "@/src/lib/yahoo-finance";
import { nseStocks } from "@/src/data/nse-stocks";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession(req);
    const { id } = await params;

    const existing = await prisma.simulationSnapshot.findUnique({
      where: { userId: user.id },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A simulation is already in progress. End it first." },
        { status: 400 }
      );
    }

    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: user.id },
      include: { holdings: { include: { stock: true } } },
    });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: "Portfolio not found" },
        { status: 404 }
      );
    }

    if (portfolio.inTournament) {
      return NextResponse.json(
        { success: false, error: "Simulations are disabled during tournament mode." },
        { status: 400 }
      );
    }

    const snapshot = {
      cashBalance: Number(portfolio.cashBalance),
      holdings: portfolio.holdings.map((h) => ({
        symbol: h.stock.symbol,
        quantity: h.quantity,
        avgBuyPrice: Number(h.avgBuyPrice),
      })),
    };

    const event = await prisma.simulationEvent.findUnique({
      where: { id },
    });
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.simulationSnapshot.create({
        data: {
          userId: user.id,
          portfolioId: portfolio.id,
          snapshot,
          eventId: id,
        },
      });

      await tx.holding.deleteMany({
        where: { portfolioId: portfolio.id },
      });

      await tx.portfolio.update({
        where: { id: portfolio.id },
        data: { cashBalance: 100000 },
      });
    });

    const stocks = nseStocks;
    const symbols = stocks.map((s) => s.symbol);

    const priceHistory = await fetchHistoricalMulti(
      symbols,
      event.startRealDate,
      event.endRealDate
    );

    if (Object.keys(priceHistory).length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch historical data for this event" },
        { status: 502 }
      );
    }

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
        priceHistory,
        startingCash: 100000,
        snapshotCreated: true,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Simulation start error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to start simulation" },
      { status: 500 }
    );
  }
}
