import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession(req);
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recentEvents = await prisma.visitorEvent.findMany({
      take: 300,
      orderBy: { visitedAt: 'desc' },
      select: {
        id: true,
        visitorId: true,
        visitedAt: true,
        countryCode: true,
        countryName: true,
        userAgent: true,
        referrer: true,
      }
    });

    const parseDevice = (ua: string | null) => {
      if (!ua) return "Unknown";
      if (ua.includes("Mobile")) return "Mobile";
      if (ua.includes("Tablet") || ua.includes("iPad")) return "Tablet";
      return "Desktop";
    };

    const uniqueVisitorsMap = new Map();
    
    for (const event of recentEvents) {
      if (!uniqueVisitorsMap.has(event.visitorId)) {
        uniqueVisitorsMap.set(event.visitorId, {
          id: event.id,
          visitedAt: event.visitedAt,
          countryCode: event.countryCode,
          countryName: event.countryName,
          device: parseDevice(event.userAgent),
          referrer: event.referrer
        });
      }
      
      if (uniqueVisitorsMap.size >= 50) break;
    }

    const data = Array.from(uniqueVisitorsMap.values());

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Recent error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
