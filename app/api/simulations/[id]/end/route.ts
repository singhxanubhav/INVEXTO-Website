import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";
import { getStockBySymbol } from "@/src/data/nse-stocks";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession(req);
    const { id } = await params;

    const snapshot = await prisma.simulationSnapshot.findUnique({
      where: { userId: user.id },
    });

    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: "No active simulation found" },
        { status: 400 }
      );
    }

    const snapshotData = snapshot.snapshot as {
      cashBalance: number;
      holdings: { symbol: string; quantity: number; avgBuyPrice: number }[];
    };

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: snapshot.portfolioId },
      include: { holdings: true },
    });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: "Portfolio not found" },
        { status: 404 }
      );
    }

    const currentValue = Number(portfolio.cashBalance);
    const gainLoss = currentValue - 100000;

    await prisma.$transaction(async (tx) => {
      await tx.holding.deleteMany({
        where: { portfolioId: portfolio.id },
      });

      for (const h of snapshotData.holdings) {
        const stockInfo = getStockBySymbol(h.symbol);
        let stock = await tx.stock.findUnique({ where: { symbol: h.symbol } });
        if (!stock) {
          stock = await tx.stock.create({
            data: {
              symbol: h.symbol,
              name: stockInfo?.name ?? h.symbol,
              sector: stockInfo?.sector ?? "Other",
              faceValue: 1,
              sharesOutstanding: BigInt(0),
              keyStats: {},
            },
          });
        }

        await tx.holding.create({
          data: {
            portfolioId: portfolio.id,
            stockId: stock.id,
            quantity: h.quantity,
            avgBuyPrice: h.avgBuyPrice,
          },
        });
      }

      await tx.portfolio.update({
        where: { id: portfolio.id },
        data: { cashBalance: snapshotData.cashBalance },
      });

      await tx.simulationSnapshot.delete({
        where: { id: snapshot.id },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        finalSimValue: currentValue,
        gainLoss,
        restoredPortfolio: true,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[Simulations] end error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to end simulation" },
      { status: 500 }
    );
  }
}
