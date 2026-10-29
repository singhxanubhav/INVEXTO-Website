import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSession(request);
    if (!(user as any).isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(200, Math.max(10, parseInt(url.searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;
    const search = url.searchParams.get("search")?.trim() || "";
    const filter = url.searchParams.get("filter") || "all";

    // Detect duplicate UPI IDs across the platform
    const duplicateUpis = await prisma.user.groupBy({
      by: ["upiId"],
      where: {
        upiId: { not: null },
      },
      _count: { upiId: true },
      having: {
        upiId: {
          _count: { gt: 1 },
        },
      },
    });

    const duplicateUpiSet = new Set<string>();
    for (const d of duplicateUpis) {
      if (d.upiId && d.upiId.trim() !== "") {
        duplicateUpiSet.add(d.upiId);
      }
    }

    const where: any = {};

    // Apply Filter
    if (filter === "admin") {
      where.isAdmin = true;
    } else if (filter === "missing_upi") {
      where.OR = [{ upiId: null }, { upiId: "" }];
    } else if (filter === "duplicate_upi") {
      where.upiId = { in: Array.from(duplicateUpiSet) };
    } else if (filter === "active") {
      where.portfolios = {
        some: {
          inTournament: true,
          OR: [
            { holdings: { some: { quantity: { gt: 0 } } } },
            { transactions: { some: {} } },
          ],
        },
      };
    }

    // Apply Search
    if (search) {
      const searchConditions = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { upiId: { contains: search, mode: "insensitive" } },
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          portfolios: {
            include: {
              _count: { select: { holdings: true, transactions: true } },
            },
          },
          registrations: {
            include: { tournament: true },
            orderBy: { registeredAt: "desc" },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const data = users.map((u) => {
      const activePortfolio = u.portfolios.find((p) => p.inTournament) || u.portfolios[0];
      const isDuplicate = u.upiId ? duplicateUpiSet.has(u.upiId) : false;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        upiId: u.upiId,
        isAdmin: u.isAdmin,
        isDuplicateUpi: isDuplicate,
        createdAt: u.createdAt.toISOString(),
        portfolio: activePortfolio
          ? {
              cashBalance: Number(activePortfolio.cashBalance),
              totalHoldings: activePortfolio._count?.holdings || 0,
              totalTrades: activePortfolio._count?.transactions || 0,
              inTournament: activePortfolio.inTournament,
            }
          : null,
        tournamentRegistrations: u.registrations.map((r) => ({
          tournamentId: r.tournamentId,
          registeredAt: r.registeredAt.toISOString(),
          finalRank: r.finalRank,
          prizeAmount: r.prizeAmount ? Number(r.prizeAmount) : null,
        })),
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      data: {
        users: data,
        total,
        page,
        limit,
        totalPages,
        duplicateUpiCount: duplicateUpiSet.size,
      },
    });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    console.error("[Admin Users Error]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}
