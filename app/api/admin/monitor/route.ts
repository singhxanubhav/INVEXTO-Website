import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";

function getNseMarketStatus() {
  const now = new Date();
  // Convert to IST
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);

  const day = istDate.getUTCDay(); // 0 is Sun, 6 is Sat
  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  const isWeekday = day >= 1 && day <= 5;
  // NSE trading hours: 9:15 AM (555 mins) to 3:30 PM (930 mins)
  const isMarketHours = totalMinutes >= 555 && totalMinutes <= 930;
  const isOpen = isWeekday && isMarketHours;

  const timeString = istDate.toLocaleTimeString("en-IN", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return {
    isOpen,
    currentTimeIST: `${timeString} IST`,
    message: isOpen ? "NSE Market is OPEN" : "NSE Market is CLOSED (9:15 AM - 3:30 PM IST)",
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSession(request);
    if (!(user as any).isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const marketStatus = getNseMarketStatus();

    const activeTournament = await prisma.tournament.findFirst({
      where: { status: "active" },
      include: {
        _count: { select: { registrations: true, portfolios: true } },
      },
    });

    const [totalUsers, recentTransactions, allTransactionsCount, buyCount, sellCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.transaction.findMany({
          take: 25,
          orderBy: { createdAt: "desc" },
          include: {
            stock: { select: { symbol: true, name: true } },
            portfolio: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        }),
        prisma.transaction.count(),
        prisma.transaction.count({ where: { type: "buy" } }),
        prisma.transaction.count({ where: { type: "sell" } }),
      ]);

    // Calculate active traders count in active tournament
    let activeTradersCount = 0;
    let tournamentVolume = 0;

    if (activeTournament) {
      const activeTournamentPortfoliosWithTrades = await prisma.portfolio.findMany({
        where: {
          tournamentId: activeTournament.id,
          transactions: { some: {} },
        },
        select: { id: true },
      });
      activeTradersCount = activeTournamentPortfoliosWithTrades.length;

      const volumeAgg = await prisma.transaction.aggregate({
        where: {
          portfolio: {
            tournamentId: activeTournament.id,
          },
        },
        _sum: { total: true },
      });
      tournamentVolume = Number(volumeAgg._sum.total || 0);
    }

    // Hot stocks by transaction frequency
    const stockStats = await prisma.transaction.groupBy({
      by: ["stockId"],
      _count: { id: true },
      _sum: { quantity: true, total: true },
      orderBy: {
        _count: { id: "desc" },
      },
      take: 5,
    });

    const stockDetails = await prisma.stock.findMany({
      where: {
        id: { in: stockStats.map((s) => s.stockId) },
      },
      select: { id: true, symbol: true, name: true },
    });
    const stockMap = new Map(stockDetails.map((s) => [s.id, s]));

    const hotStocks = stockStats.map((s) => {
      const info = stockMap.get(s.stockId);
      return {
        stockId: s.stockId,
        symbol: info?.symbol || "UNKNOWN",
        name: info?.name || "Unknown Stock",
        tradeCount: s._count.id,
        totalQuantity: s._sum.quantity || 0,
        totalVolume: Number(s._sum.total || 0),
      };
    });

    // Detect duplicate UPI accounts for anti-cheat
    const duplicateUpis = await prisma.user.groupBy({
      by: ["upiId"],
      where: { upiId: { not: null } },
      _count: { upiId: true },
      having: { upiId: { _count: { gt: 1 } } },
    });

    const duplicateUpiList = duplicateUpis
      .filter((d) => d.upiId && d.upiId.trim() !== "")
      .map((d) => d.upiId as string);

    let duplicateAccounts: { upiId: string; count: number; users: { name: string; email: string }[] }[] = [];
    if (duplicateUpiList.length > 0) {
      const flaggedUsers = await prisma.user.findMany({
        where: { upiId: { in: duplicateUpiList } },
        select: { name: true, email: true, upiId: true },
      });

      const grouped = new Map<string, { name: string; email: string }[]>();
      for (const u of flaggedUsers) {
        if (!u.upiId) continue;
        const arr = grouped.get(u.upiId) || [];
        arr.push({ name: u.name, email: u.email });
        grouped.set(u.upiId, arr);
      }

      duplicateAccounts = Array.from(grouped.entries()).map(([upiId, users]) => ({
        upiId,
        count: users.length,
        users,
      }));
    }

    const trades = recentTransactions.map((tx) => ({
      id: tx.id,
      userName: tx.portfolio?.user?.name || "Unknown",
      userEmail: tx.portfolio?.user?.email || "",
      stockSymbol: tx.stock.symbol,
      stockName: tx.stock.name,
      type: tx.type,
      quantity: tx.quantity,
      price: Number(tx.price),
      total: Number(tx.total),
      inTournament: tx.portfolio.inTournament,
      createdAt: tx.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        marketStatus,
        activeTournament: activeTournament
          ? {
              id: activeTournament.id,
              startDate: activeTournament.startDate.toISOString(),
              endDate: activeTournament.endDate.toISOString(),
              prizePool: activeTournament.prizePool,
              totalRegistered: activeTournament._count.registrations,
              activeTradersCount,
              tournamentVolume,
            }
          : null,
        stats: {
          totalUsers,
          allTransactionsCount,
          buyCount,
          sellCount,
        },
        recentTrades: trades,
        hotStocks,
        duplicateUpiAlerts: duplicateAccounts,
      },
    });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    console.error("[Admin Monitor Error]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch monitor data" }, { status: 500 });
  }
}
