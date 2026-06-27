"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { PricePoint } from "@/src/types";

interface StockChartProps {
  symbol: string;
  initialColor?: "emerald" | "red";
}

export function StockChart({
  symbol,
  initialColor = "emerald",
}: StockChartProps) {
  const [range, setRange] = useState("1d");
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWeekend, setIsWeekend] = useState(false);
  const [chartDate, setChartDate] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/${encodeURIComponent(symbol)}/prices?range=${range}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setData(json.data || []);
          setIsWeekend(json.isWeekend || false);
          setChartDate(json.chartDate || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol, range]);

  const isUp =
    data.length >= 2
      ? data[data.length - 1].price >= data[0].price
      : initialColor === "emerald";
  const lineColor = isUp ? "#34D399" : "#F87171";

  const formatXAxis = (ts: string) => {
    const d = new Date(ts);
    if (range === "1d") {
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatYAxis = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return v.toString();
  };

  const renderStatusText = () => {
    if (range !== "1d" || !chartDate) return null;

    const now = new Date();
    
    // Get YYYY-MM-DD strings directly in IST to avoid Vercel UTC parsing issues
    const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const cDateObj = new Date(chartDate);
    const cDateStr = cDateObj.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    
    // Get current IST hour/minute directly
    const istTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour12: false });
    const istDate = new Date(istTimeStr); // This is hacky but ok for hour/minute extraction
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    const day = istDate.getDay();
    const isWeekendNow = day === 0 || day === 6;
    
    const isMarketOpen = 
      !isWeekendNow && 
      ((hours > 9 || (hours === 9 && minutes >= 15)) && 
       (hours < 15 || (hours === 15 && minutes <= 30)));

    if (todayStr === cDateStr) {
      if (isMarketOpen) {
        return (
          <p className="mt-3 flex items-center justify-center text-[11px] font-medium text-emerald-400">
            <span className="relative mr-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Live (Today)
          </p>
        );
      } else {
        return (
          <p className="mt-3 text-center text-[11px] font-medium text-muted-foreground">
            Today (Market Closed)
          </p>
        );
      }
    } else {
      const formattedDate = cDateObj.toLocaleDateString("en-IN", { 
        timeZone: "Asia/Kolkata",
        weekday: "short", 
        month: "short", 
        day: "numeric" 
      });
      return (
        <p className="mt-3 text-center text-[11px] font-medium text-muted-foreground">
          Showing data for {formattedDate} — Market Closed
        </p>
      );
    }
  };

  return (
    <div className="rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-4">
      <div className="mb-4 flex items-center gap-1">
        {["1d", "1m", "1y"].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              range === r
                ? "bg-amber-500 text-emerald-950"
                : "bg-emerald-800/30 text-emerald-300/80 hover:bg-emerald-800/50"
            }`}
          >
            {r.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-72 w-full bg-emerald-800/30" />
      ) : data.length === 0 ? (
        <div className="flex h-72 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No chart data available for this period
          </p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.3 0.02 160 / 0.3)"
              />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke="oklch(0.6 0.01 160)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={formatYAxis}
                stroke="oklch(0.6 0.01 160)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.17 0.025 160)",
                  border: "1px solid oklch(0.3 0.02 160 / 50%)",
                  borderRadius: "0.5rem",
                  fontSize: "0.8rem",
                }}
                labelFormatter={(ts) => new Date(ts).toLocaleString("en-IN")}
                formatter={(value) => [
                  `₹${Number(value).toFixed(2)}`,
                  "Price",
                ]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: lineColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {renderStatusText()}
    </div>
  );
}
