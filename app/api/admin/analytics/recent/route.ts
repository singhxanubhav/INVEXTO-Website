import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession(req);
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recentVisits = await prisma.visitorEvent.findMany({
      take: 50,
      orderBy: { visitedAt: 'desc' },
      select: {
        id: true,
        visitedAt: true,
        countryCode: true,
        countryName: true,
        pagePath: true,
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

    const data = recentVisits.map(v => ({
      ...v,
      device: parseDevice(v.userAgent)
    }));

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Recent error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
