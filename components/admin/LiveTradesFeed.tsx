"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatINR } from "@/lib/format";

interface Trade {
  id: string;
  userName: string;
  userEmail: string;
  stockSymbol: string;
  stockName: string;
  type: string;
  quantity: number;
  price: number;
  total: number;
  inTournament: boolean;
  createdAt: string;
}

interface Props {
  initialTrades?: Trade[];
}

export function LiveTradesFeed({ initialTrades = [] }: Props) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchRecentTrades = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/monitor?t=${Date.now()}`);
      const json = await res.json();
      if (json.success && json.data?.recentTrades) {
        setTrades(json.data.recentTrades);
        setLastRefreshed(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentTrades();
    const interval = setInterval(fetchRecentTrades, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, [fetchRecentTrades]);

  return (
    <div className="rounded-2xl border border-emerald-800/30 bg-gradient-to-br from-emerald-950/20 to-gray-950 p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between border-b border-emerald-800/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-900/40 text-emerald-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Live Trading Stream
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            {lastRefreshed && (
              <p className="text-[10px] text-gray-500">Updated {lastRefreshed}</p>
            )}
          </div>
        </div>

        <button
          onClick={fetchRecentTrades}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-800/30 bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-900/40 hover:text-emerald-300 transition"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {trades.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-500">No trades recorded yet.</div>
      ) : (
        <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-emerald-800/20 text-[10px] uppercase tracking-wider text-gray-500 text-left bg-emerald-950/30">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Stock</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-800/10 font-mono">
              {trades.slice(0, 15).map((t) => {
                const isBuy = t.type === "buy";
                const timeStr = new Date(t.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

                return (
                  <tr key={t.id} className="hover:bg-emerald-900/10 transition font-sans">
                    <td className="py-2 px-3 text-gray-400 text-[11px] whitespace-nowrap">{timeStr}</td>
                    <td className="py-2 px-3 font-medium text-white truncate max-w-[120px]">{t.userName}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          isBuy ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {isBuy ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-semibold text-white">{t.stockSymbol}</td>
                    <td className="py-2 px-3 text-right text-gray-300 font-mono">{t.quantity}</td>
                    <td className="py-2 px-3 text-right text-gray-300 font-mono">{formatINR(t.price)}</td>
                    <td className="py-2 px-3 text-right font-medium text-white font-mono">{formatINR(t.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
