import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/portfolio", "/stocks", "/simulate", "/tournament"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("invexto_token")?.value;
  const { pathname } = request.nextUrl;

  if (
    protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))
  ) {
    if (!token) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    
    // Note: Vercel Edge Runtime does not support jsonwebtoken or bcrypt.
    // We decode the JWT payload manually here just for routing UX.
    // The actual security verification is done by API routes in Node.js runtime.
    try {
      const payloadBase64 = token.split('.')[1];
      // atob works in edge runtime
      const payloadString = atob(payloadBase64);
      const payload = JSON.parse(payloadString);
      
      if (!payload || !payload.isAdmin) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portfolio/:path*", "/stocks/:path*", "/simulate/:path*", "/tournament/:path*", "/admin/:path*"],
};
