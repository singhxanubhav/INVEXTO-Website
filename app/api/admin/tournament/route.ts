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

    const tournaments = await prisma.tournament.findMany({
      orderBy: { startDate: "desc" },
      include: {
        _count: { select: { registrations: true } },
        registrations: {
          include: {
            user: { select: { name: true, email: true, upiId: true } },
          },
          orderBy: { finalRank: "asc" },
        },
      },
    });

    const data = tournaments.map((t) => ({
      id: t.id,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate.toISOString(),
      status: t.status,
      prizePool: t.prizePool,
      registrationCount: t._count.registrations,
      winners: t.registrations
        .filter((r) => r.finalRank !== null && r.finalRank <= 5)
        .map((r) => ({
          name: r.user.name,
          email: r.user.email,
          upiId: r.user.upiId,
          finalRank: r.finalRank,
          prizeAmount: r.prizeAmount ? Number(r.prizeAmount) : null,
        })),
    }));

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ success: false, error: "Failed to fetch tournaments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSession(request);
    if (!(user as any).isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    const endDate = body.endDate
      ? new Date(body.endDate)
      : new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const tournament = await prisma.tournament.create({
      data: {
        startDate,
        endDate,
        status: "active",
        prizePool: {
          "1": 500,
          "2": 300,
          "3": 150,
          "4": 50,
          "5": 25,
        },
      },
    });

    return NextResponse.json({ success: true, data: tournament }, { status: 201 });
  } catch (err: any) {
    console.error("[Create Tournament Error]", err);
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ success: false, error: "Failed to create tournament", details: err.message }, { status: 500 });
  }
}
