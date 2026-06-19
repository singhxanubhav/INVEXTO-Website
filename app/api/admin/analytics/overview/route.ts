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
    
    const now = new Date();
    const startDate = subDays(now, range);
    const prevStartDate = subDays(startDate, range);

    const currentVisits = await prisma.visitorEvent.count({
      where: { visitedAt: { gte: startDate } }
    });
    
    const currentUniqueVisits = await prisma.visitorEvent.groupBy({
      by: ['visitorId'],
      where: { visitedAt: { gte: startDate } },
    });
    
    const currentCountries = await prisma.visitorEvent.groupBy({
      by: ['countryCode'],
      where: { visitedAt: { gte: startDate }, countryCode: { notIn: ["XX"] } },
    });

    const prevVisits = await prisma.visitorEvent.count({
      where: { visitedAt: { gte: prevStartDate, lt: startDate } }
    });
    
    const prevUniqueVisits = await prisma.visitorEvent.groupBy({
      by: ['visitorId'],
      where: { visitedAt: { gte: prevStartDate, lt: startDate } },
    });
    
    const prevCountries = await prisma.visitorEvent.groupBy({
      by: ['countryCode'],
      where: { visitedAt: { gte: prevStartDate, lt: startDate }, countryCode: { notIn: ["XX"] } },
    });

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    return NextResponse.json({
      totalVisitors: {
        value: currentVisits,
        change: calculateChange(currentVisits, prevVisits)
      },
      uniqueVisitors: {
        value: currentUniqueVisits.length,
        change: calculateChange(currentUniqueVisits.length, prevUniqueVisits.length)
      },
      countriesReached: {
        value: currentCountries.length,
        change: calculateChange(currentCountries.length, prevCountries.length)
      }
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Overview error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
