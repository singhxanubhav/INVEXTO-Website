"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<{ path: string; time: number } | null>(null);

  useEffect(() => {
    // Ignore if pathname is missing or if we are in admin routes
    if (!pathname || pathname.startsWith("/admin")) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    const now = Date.now();
    
    // Prevent duplicate counts caused by page refreshes within 30 seconds
    if (
      lastTracked.current &&
      lastTracked.current.path === url &&
      now - lastTracked.current.time < 30000
    ) {
      return;
    }

    lastTracked.current = { path: url, time: now };

    // Send tracking data silently
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pagePath: url,
        referrer: document.referrer,
      }),
    }).catch((e) => {
      // Silently catch errors in production so we don't spam console
      // console.error("Analytics tracking failed", e);
    });
    
  }, [pathname, searchParams]);

  return null;
}
