"use client";

import { useState, useEffect } from "react";
import { Newspaper, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/format";
import type { StockNewsItem } from "@/src/lib/yahoo-finance";

export function StockNews({ symbol }: { symbol: string }) {
  const [news, setNews] = useState<StockNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/${encodeURIComponent(symbol)}/news`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setNews(json.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol]);

  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Newspaper className="h-4 w-4" />
        Recent News
      </h3>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg bg-emerald-800/30" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No recent news available
        </p>
      ) : (
        <div className="divide-y divide-emerald-800/20">
          {news.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 py-3 transition-colors hover:bg-emerald-800/10 rounded-lg px-2 -mx-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground/60">
                  {item.publisher} · {timeAgo(item.publishedAt)}
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground line-clamp-2">
                  {item.title}
                </p>
              </div>
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt=""
                  className="mt-1 h-12 w-12 shrink-0 rounded object-cover"
                />
              )}
              <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-muted-foreground/40" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
