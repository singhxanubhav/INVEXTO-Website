"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  Users,
  Activity,
  Clock,
  Download,
  Flame,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { formatINR } from "@/lib/format";

interface MonitorData {
  marketStatus: {
    isOpen: boolean;
    currentTimeIST: string;
    message: string;
  };
  activeTournament: {
    id: string;
    startDate: string;
    endDate: string;
    prizePool: Record<string, number>;
    totalRegistered: number;
    activeTradersCount: number;
    tournamentVolume: number;
  } | null;
  stats: {
    totalUsers: number;
    allTransactionsCount: number;
    buyCount: number;
    sellCount: number;
  };
  hotStocks: {
    stockId: string;
    symbol: string;
    name: string;
    tradeCount: number;
    totalQuantity: number;
    totalVolume: number;
  }[];
  duplicateUpiAlerts: {
    upiId: string;
    count: number;
    users: { name: string; email: string }[];
  }[];
}

export function TournamentLiveMonitor() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMonitorData = () => {
    fetch(`/api/admin/monitor?t=${Date.now()}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMonitorData();
    const interval = setInterval(fetchMonitorData, 20000); // 20s auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-emerald-950/20 border border-emerald-800/20" />
        ))}
      </div>
    );
  }

  const isOpen = data?.marketStatus.isOpen;

  return (
    <div className="space-y-6">
      {/* Market Status & Time Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-800/30 bg-emerald-950/20 p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-xl ${
              isOpen ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            }`}
          >
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  isOpen ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                <span className={`size-1.5 rounded-full ${isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
                {data?.marketStatus.message}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{data?.marketStatus.currentTimeIST}</p>
          </div>
        </div>

        {/* Quick CSV Export Buttons */}
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/tournament/export?type=participants"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/30 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/40 transition"
          >
            <Download className="h-3 w-3" />
            Participants CSV
          </a>
          <a
            href="/api/admin/tournament/export?type=winners"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-800/40 bg-amber-950/30 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-900/40 transition"
          >
            <Trophy className="h-3 w-3" />
            Winners CSV
          </a>
        </div>
      </div>

      {/* Real-time KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-800/30 bg-emerald-950/20 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Invexto Users</span>
            <Users className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{data?.stats.totalUsers.toLocaleString() || 0}</p>
          <p className="mt-1 text-[11px] text-emerald-500 font-medium">100% tournament auto-enrolled</p>
        </div>

        <div className="rounded-2xl border border-amber-800/30 bg-amber-950/20 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Traders</span>
            <Activity className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-300">
            {data?.activeTournament?.activeTradersCount || 0}
            <span className="text-xs font-normal text-muted-foreground ml-2">
              / {data?.activeTournament?.totalRegistered || 0} registered
            </span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Placed ≥ 1 tournament order
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-800/30 bg-emerald-950/20 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tournament Volume</span>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatINR(data?.activeTournament?.tournamentVolume || 0)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {data?.stats.allTransactionsCount || 0} total trades executed
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-800/30 bg-emerald-950/20 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Order Flow Bias</span>
            <ArrowUpRight className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-400">{data?.stats.buyCount || 0} Buy</span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xl font-bold text-red-400">{data?.stats.sellCount || 0} Sell</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {(data?.stats.buyCount || 0) >= (data?.stats.sellCount || 0) ? "Bullish Trader Sentiment" : "Bearish Trader Sentiment"}
          </p>
        </div>
      </div>

      {/* Most Traded Stocks Preview */}
      {data?.hotStocks && data.hotStocks.length > 0 && (
        <div className="rounded-2xl border border-emerald-800/30 bg-emerald-950/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Most Traded Stocks in Tournament</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-5">
            {data.hotStocks.map((stock) => (
              <div key={stock.stockId} className="rounded-xl border border-emerald-800/20 bg-emerald-950/40 p-3 text-xs">
                <p className="font-bold text-white text-sm">{stock.symbol}</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{stock.name}</p>
                <div className="mt-2 pt-2 border-t border-emerald-800/20 flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{stock.tradeCount} trades</span>
                  <span className="font-semibold text-emerald-400">{formatINR(stock.totalVolume)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
