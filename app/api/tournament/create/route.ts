import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";

export async function POST(request: NextRequest) {
  try {
    const user = await requireSession(request);
    if (!(user as any).isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const existing = await prisma.tournament.findFirst({
      where: { status: "active" },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An active tournament already exists" },
        { status: 400 }
      );
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const tournament = await prisma.tournament.create({
      data: {
        startDate: start,
        endDate: end,
        status: "active",
        prizePool: { "1st": 50000, "2nd": 25000, "3rd": 10000 },
      },
    });

    return NextResponse.json({ success: true, data: tournament });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Create tournament error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
