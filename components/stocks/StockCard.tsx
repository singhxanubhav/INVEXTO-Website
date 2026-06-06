"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { StockWithPrice } from "@/src/types";
import { formatINR, formatPercent, formatMarketCap, formatVolume } from "@/lib/format";

const sectorColors: Record<string, string> = {
  IT: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Banking: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  FMCG: "bg-green-500/10 text-green-400 border-green-500/30",
  Auto: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Pharma: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Energy: "bg-red-500/10 text-red-400 border-red-500/30",
  Telecom: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  Infrastructure: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  Metals: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Consumer: "bg-pink-500/10 text-pink-400 border-pink-500/30",
};

export function StockCard({ stock, isHot = false }: { stock: StockWithPrice; isHot?: boolean }) {
  const isUp = stock.changePercent > 0;
  const isDown = stock.changePercent < 0;
  const colorClass = isUp
    ? "text-emerald-400"
    : isDown
      ? "text-red-400"
      : "text-muted-foreground";
  const bgClass = isUp
    ? "bg-emerald-500/10"
    : isDown
      ? "bg-red-500/10"
      : "bg-muted";

  return (
    <Link
      href={`/stocks/${stock.symbol}`}
      className="group block rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/30 hover:border-emerald-700/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground group-hover:text-amber-400 transition-colors">
              {stock.name}
            </span>
            <Badge
              variant="outline"
              className={`shrink-0 border px-1.5 py-0 text-[10px] font-mono uppercase ${sectorColors[stock.sector] || "bg-muted text-muted-foreground"}`}
            >
              {stock.symbol.replace(".NS", "")}
            </Badge>
            {isHot && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-0.5 rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white cursor-help shrink-0">
                    <Flame className="h-2.5 w-2.5" />
                    Hot
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-foreground text-background text-xs">
                  This stock is being purchased by numerous users in the tournament
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <Badge
            variant="outline"
            className="mt-1.5 border-emerald-800/30 bg-emerald-800/20 px-2 py-0 text-[10px] text-emerald-300/80"
          >
            {stock.sector}
          </Badge>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-xl font-bold text-foreground">
          {formatINR(stock.currentPrice)}
        </span>
        <div className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium ${bgClass} ${colorClass}`}>
          {isUp ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : isDown ? (
            <TrendingDown className="h-3.5 w-3.5" />
          ) : (
            <Minus className="h-3.5 w-3.5" />
          )}
          <span>{formatPercent(stock.changePercent)}</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>MCap {formatMarketCap(stock.marketCap)}</span>
        <span>Vol {formatVolume(stock.volume)}</span>
      </div>
    </Link>
  );
}
