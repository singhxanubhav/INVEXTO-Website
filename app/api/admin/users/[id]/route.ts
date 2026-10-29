import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { fetchQuotes } from "@/src/lib/yahoo-finance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireSession(request);
    if (!(sessionUser as any).isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id: targetUserId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        portfolios: {
          include: {
            holdings: {
              include: {
                stock: true,
              },
            },
            transactions: {
              orderBy: { createdAt: "desc" },
              take: 50,
              include: {
                stock: true,
              },
            },
            tournament: true,
          },
        },
        registrations: {
          include: {
            tournament: true,
          },
          orderBy: { registeredAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Check if UPI ID is shared with any other accounts
    let isDuplicateUpi = false;
    let sharedAccounts: { name: string; email: string }[] = [];
    if (user.upiId && user.upiId.trim() !== "") {
      const otherAccounts = await prisma.user.findMany({
        where: {
          upiId: user.upiId,
          id: { not: user.id },
        },
        select: { name: true, email: true },
      });
      if (otherAccounts.length > 0) {
        isDuplicateUpi = true;
        sharedAccounts = otherAccounts;
      }
    }

    // Collect all stocks held across user's portfolios to fetch live prices
    const symbols = new Set<string>();
    for (const p of user.portfolios) {
      for (const h of p.holdings) {
        if (h.stock?.symbol) symbols.add(h.stock.symbol);
      }
    }

    const quotes = symbols.size > 0 ? await fetchQuotes(Array.from(symbols)) : {};

    const portfolios = user.portfolios.map((p) => {
      let stockValue = 0;
      const holdings = p.holdings.map((h) => {
        const q = quotes[h.stock.symbol];
        const currentPrice = q?.regularMarketPrice ? Number(q.regularMarketPrice) : Number(h.avgBuyPrice);
        const currentValue = h.quantity * currentPrice;
        const investedValue = h.quantity * Number(h.avgBuyPrice);
        const gainLoss = currentValue - investedValue;
        const gainLossPct = investedValue > 0 ? (gainLoss / investedValue) * 100 : 0;
        stockValue += currentValue;

        return {
          id: h.id,
          symbol: h.stock.symbol,
          name: h.stock.name,
          quantity: h.quantity,
          avgBuyPrice: Number(h.avgBuyPrice),
          currentPrice,
          currentValue,
          investedValue,
          gainLoss,
          gainLossPct,
        };
      });

      const cashBalance = Number(p.cashBalance);
      const totalValue = cashBalance + stockValue;

      const transactions = p.transactions.map((tx) => ({
        id: tx.id,
        symbol: tx.stock.symbol,
        name: tx.stock.name,
        type: tx.type,
        quantity: tx.quantity,
        price: Number(tx.price),
        total: Number(tx.total),
        realizedGain: tx.realizedGain ? Number(tx.realizedGain) : null,
        createdAt: tx.createdAt.toISOString(),
      }));

      return {
        id: p.id,
        inTournament: p.inTournament,
        tournamentId: p.tournamentId,
        tournamentName: p.tournament
          ? `${new Date(p.tournament.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} Tournament`
          : null,
        cashBalance,
        stockValue,
        totalValue,
        holdings,
        transactions,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        upiId: user.upiId,
        isAdmin: user.isAdmin,
        isDuplicateUpi,
        sharedAccounts,
        createdAt: user.createdAt.toISOString(),
        portfolios,
        tournamentRegistrations: user.registrations.map((r) => ({
          id: r.id,
          tournamentId: r.tournamentId,
          registeredAt: r.registeredAt.toISOString(),
          finalRank: r.finalRank,
          finalValue: r.finalValue ? Number(r.finalValue) : null,
          prizeAmount: r.prizeAmount ? Number(r.prizeAmount) : null,
          phone: r.phone,
        })),
      },
    });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    console.error("[Admin User Detail Error]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch user details" }, { status: 500 });
  }
}
