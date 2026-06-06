"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { HoldingWithPrice } from "@/src/types";

const SECTOR_COLORS: Record<string, string> = {
  IT: "#60A5FA",
  Banking: "#FBBF24",
  FMCG: "#34D399",
  Auto: "#FB923C",
  Pharma: "#A78BFA",
  Energy: "#F87171",
  Telecom: "#22D3EE",
  Infrastructure: "#94A3B8",
  Metals: "#FCD34D",
  Consumer: "#F472B6",
};

interface GainLossSummaryProps {
  holdings: HoldingWithPrice[];
  loading: boolean;
}

export function GainLossSummary({ holdings, loading }: GainLossSummaryProps) {
  const sectorAllocation = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of holdings) {
      map[h.sector] = (map[h.sector] || 0) + h.currentValue;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl bg-emerald-800/30" />;
  }

  if (holdings.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-emerald-800/30 text-sm text-muted-foreground">
        No holdings to chart
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Portfolio by Sector
      </h3>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sectorAllocation}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {sectorAllocation.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={SECTOR_COLORS[entry.name] || "#666"}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "oklch(0.17 0.025 160)",
                  border: "1px solid oklch(0.3 0.02 160 / 50%)",
                  borderRadius: "0.5rem",
                  fontSize: "0.8rem",
                }}
                formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          {sectorAllocation.map((entry) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: SECTOR_COLORS[entry.name] || "#666" }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
