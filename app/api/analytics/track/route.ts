import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { cookies } from "next/headers";

const BOT_AGENTS = [
  "bot", "crawler", "spider", "ping", "googlebot", "bingbot", "yandexbot", "duckduckbot", "slurp"
];

function isBot(userAgent: string) {
  const ua = userAgent.toLowerCase();
  return BOT_AGENTS.some(bot => ua.includes(bot));
}

export async function POST(req: Request) {
  try {
    const { pagePath, referrer } = await req.json();
    
    const userAgent = req.headers.get("user-agent") || "";
    if (isBot(userAgent)) {
      return NextResponse.json({ message: "Ignored bot" }, { status: 200 });
    }

    const cookieStore = await cookies();
    let visitorId = cookieStore.get("invexto_visitor_id")?.value;
    let sessionId = cookieStore.get("invexto_session_id")?.value;
    
    const responseCookies: { name: string, value: string, maxAge: number }[] = [];

    if (!visitorId) {
      visitorId = crypto.randomUUID();
      responseCookies.push({ name: "invexto_visitor_id", value: visitorId, maxAge: 60 * 60 * 24 * 365 }); 
    }

    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }
    
    responseCookies.push({ name: "invexto_session_id", value: sessionId, maxAge: 60 * 30 }); 

    let countryCode = req.headers.get("x-vercel-ip-country");
    let countryName = null;

    if (!countryCode) {
      const forwardedFor = req.headers.get("x-forwarded-for");
      const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : null;
      if (ip && ip !== "::1" && ip !== "127.0.0.1") {
        try {
          const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode`, {
            next: { revalidate: 3600 }
          });
          if (geoRes.ok) {
            const geo = await geoRes.json();
            if (geo.countryCode) {
              countryCode = geo.countryCode;
              countryName = geo.country;
            }
          }
        } catch (e) {
          console.error("GeoIP error", e);
        }
      }
    }

    if (!countryCode) {
      countryCode = "XX";
      countryName = "Unknown";
    }

    await prisma.visitorEvent.create({
      data: {
        visitorId,
        sessionId,
        pagePath,
        countryCode,
        countryName,
        userAgent,
        referrer: referrer || null,
      }
    });

    const response = NextResponse.json({ success: true });
    
    responseCookies.forEach(c => {
      response.cookies.set(c.name, c.value, { 
        maxAge: c.maxAge, 
        httpOnly: true, 
        path: "/",
        secure: process.env.NODE_ENV === "production" 
      });
    });

    return response;

  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
