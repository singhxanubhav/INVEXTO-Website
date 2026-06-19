import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession(req);
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = parseInt(searchParams.get("range") || "30", 10);
    
    const startDate = subDays(new Date(), range);

    const visits = await prisma.visitorEvent.findMany({
      where: { visitedAt: { gte: startDate }, countryCode: { notIn: ["XX"] } },
      select: { countryCode: true, countryName: true }
    });

    const countryCounts: Record<string, { name: string, count: number }> = {};
    
    visits.forEach((v: { countryCode: string | null; countryName: string | null }) => {
      const code = v.countryCode as string;
      if (!countryCounts[code]) {
        countryCounts[code] = { name: v.countryName || code, count: 0 };
      }
      countryCounts[code].count++;
    });

    const chartData = Object.keys(countryCounts)
      .map(code => ({
        country: countryCounts[code].name,
        code,
        visitors: countryCounts[code].count
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10); // Top 10

    return NextResponse.json(chartData);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Countries error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
