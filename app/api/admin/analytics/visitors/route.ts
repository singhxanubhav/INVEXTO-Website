import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";
import { subDays, format, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession(req);
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = parseInt(searchParams.get("range") || "30", 10);
    
    const now = new Date();
    const startDate = subDays(now, range);

    const visits = await prisma.visitorEvent.findMany({
      where: { visitedAt: { gte: startDate } },
      select: { visitorId: true, visitedAt: true }
    });

    // Group by day
    const dailyData: Record<string, { total: number; unique: Set<string> }> = {};
    
    // Initialize days
    for (let i = range; i >= 0; i--) {
      const date = format(subDays(now, i), "MMM dd");
      dailyData[date] = { total: 0, unique: new Set() };
    }

    visits.forEach((v: { visitorId: string; visitedAt: Date }) => {
      const date = format(v.visitedAt, "MMM dd");
      if (dailyData[date]) {
        dailyData[date].total++;
        dailyData[date].unique.add(v.visitorId);
      }
    });

    const chartData = Object.keys(dailyData).map(date => ({
      date,
      visitors: dailyData[date].total,
      uniqueVisitors: dailyData[date].unique.size
    }));

    return NextResponse.json(chartData);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Visitors error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
