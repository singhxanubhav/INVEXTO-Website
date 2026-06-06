"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR, formatPercent, formatMarketCap, formatVolume } from "@/lib/format";
import type { KeyStats } from "@/src/types";

interface StatItem {
  label: string;
  value: string;
  tooltip: string;
}

interface KeyStatisticsProps {
  stats?: KeyStats;
  marketCap: number;
  loading?: boolean;
}

function StatCard({ label, value, tooltip }: StatItem) {
  return (
    <div className="rounded-lg border border-emerald-800/30 bg-emerald-900/20 p-3">
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
          {label}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground">
              <Info className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

export function KeyStatisticsView({
  stats,
  marketCap,
  loading,
}: KeyStatisticsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 13 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg bg-emerald-800/30" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No statistics available
      </div>
    );
  }

  const items: StatItem[] = [
    {
      label: "Upper Circuit",
      value: formatINR(stats.upperCircuit),
      tooltip: "Maximum price gain allowed in a single trading session (20%)",
    },
    {
      label: "Lower Circuit",
      value: formatINR(stats.lowerCircuit),
      tooltip: "Maximum price drop allowed in a single trading session (20%)",
    },
    {
      label: "TTM EPS",
      value: formatINR(stats.ttmEps),
      tooltip: "Trailing Twelve Months Earnings Per Share",
    },
    {
      label: "TTM P/E",
      value: stats.ttmPe > 0 ? stats.ttmPe.toFixed(2) : "N/A",
      tooltip: "Price-to-Earnings ratio based on trailing twelve months earnings",
    },
    {
      label: "P/B Ratio",
      value: stats.pbRatio.toFixed(2),
      tooltip: "Price-to-Book ratio comparing market price to book value per share",
    },
    {
      label: "Market Cap",
      value: formatMarketCap(marketCap),
      tooltip: "Total market value = current price × outstanding shares",
    },
    {
      label: "Book Value",
      value: formatINR(stats.bookValue),
      tooltip: "Net asset value per share as per the company's balance sheet",
    },
    {
      label: "Dividend Yield",
      value: formatPercent(stats.dividendYield),
      tooltip: "Annual dividend as a percentage of current share price",
    },
    {
      label: "20D Avg Volume",
      value: formatVolume(stats.avgVolume20d),
      tooltip: "Average daily trading volume over the last 20 sessions",
    },
    {
      label: "Beta",
      value: stats.beta.toFixed(2),
      tooltip: "Volatility measure vs market (1.0 = moves with market, >1 = more volatile)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}
