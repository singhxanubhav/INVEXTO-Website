"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SimState, SimAction } from "@/src/types";
import {
  getCurrentPrices,
  calcSimPortfolioValue,
  STARTING_CASH,
} from "@/src/lib/simulation";
import { formatINR, formatPercent } from "@/lib/format";
import { Navbar } from "@/components/layout/Navbar";
import {
  TrendingUp, TrendingDown, Pause, Play, Square,
  Search, X, Plus, Minus, Wallet, BarChart3,
  Timer, Gauge, Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  state: SimState;
  dispatch: React.Dispatch<SimAction>;
}

export default function SimDashboard({ state, dispatch }: Props) {
  const router = useRouter();
  const [speed, setSpeed] = useState(1);
  const [search, setSearch] = useState("");
  const [orderSymbol, setOrderSymbol] = useState<string | null>(null);
  const [orderMode, setOrderMode] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"holdings" | "trades">("holdings");
  const feedRef = useRef<HTMLDivElement>(null);
  const [ending, setEnding] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<{ finalValue: number; gainLoss: number } | null>(null);
  const endingRef = useRef(false);

  const prices = useMemo(() => getCurrentPrices(state), [state]);
  const portfolioValue = useMemo(() => calcSimPortfolioValue(state), [state]);
  const gainLoss = portfolioValue - STARTING_CASH;
  const gainLossPct = (gainLoss / STARTING_CASH) * 100;
  const invested = useMemo(() => {
    let total = 0;
    for (const h of Object.values(state.holdings)) {
      total += h.qty * h.avgBuyPrice;
    }
    return total;
  }, [state.holdings]);

  const currentDate = useMemo(() => {
    const d = new Date(state.startDate);
    d.setDate(d.getDate() + state.day);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [state.startDate, state.day]);

  const progressPct =
    state.totalDays > 0 ? ((state.day + 1) / state.totalDays) * 100 : 0;

  const latestValue = state.valueHistory[state.valueHistory.length - 1] ?? STARTING_CASH;
  const startValue = state.valueHistory[0] ?? STARTING_CASH;
  const returnPct = startValue > 0 ? ((latestValue - startValue) / startValue) * 100 : 0;

  const handleEndSimulation = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    setEnding(true);

    try {
      const finalValue = calcSimPortfolioValue(state);
      const simGainLoss = finalValue - STARTING_CASH;

      await fetch(`/api/simulations/${state.eventId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      setResultData({ finalValue, gainLoss: simGainLoss });
      setShowResult(true);
    } catch {
      toast.error("Failed to end simulation");
    } finally {
      setEnding(false);
    }
  }, [state]);

  useEffect(() => {
    if (state.day >= state.totalDays - 1 && state.phase === "running" && state.totalDays > 0) {
      handleEndSimulation();
    }
  }, [state.day, state.totalDays, state.phase, handleEndSimulation]);

  useEffect(() => {
    if (state.phase !== "running") return;
    if (state.day >= state.totalDays - 1) return;
    const interval = setInterval(() => {
      dispatch({ type: "TICK" });
    }, Math.round(1000 / speed));
    return () => clearInterval(interval);
  }, [state.phase, speed, dispatch, state.day, state.totalDays]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [state.transactions.length]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.phase === "running" || state.phase === "paused") {
        e.preventDefault();
        e.returnValue = "Simulation is in progress. Your portfolio will be restored when you end the simulation properly.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.phase]);

  const filteredStocks = useMemo(() => {
    if (!search) return state.stocks;
    const q = search.toLowerCase();
    return state.stocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    );
  }, [state.stocks, search]);

  const holdingList = useMemo(
    () =>
      Object.entries(state.holdings).map(([symbol, h]) => {
        const price = prices[symbol] ?? 0;
        const value = h.qty * price;
        const cost = h.qty * h.avgBuyPrice;
        const pl = value - cost;
        const plPct = cost > 0 ? (pl / cost) * 100 : 0;
        const dayPL = h.qty * (price - (prices[symbol] ?? price));
        return { symbol, ...h, currentPrice: price, value, cost, pl, plPct, dayPL };
      }),
    [state.holdings, prices]
  );

  const openOrder = useCallback(
    (symbol: string, mode: "buy" | "sell") => {
      setOrderSymbol(symbol);
      setOrderMode(mode);
      setQty(1);
    },
    []
  );

  const executeOrder = useCallback(async () => {
    if (!orderSymbol) return;
    const price = prices[orderSymbol];
    if (!price) return;

    try {
      const res = await fetch(`/api/portfolio/${orderMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: orderSymbol,
          quantity: qty,
          simulatedPrice: price,
        }),
      });
      const json = await res.json();
      if (json.success) {
        dispatch({
          type: orderMode === "buy" ? "BUY" : "SELL",
          payload: { symbol: orderSymbol, qty, price },
        });
        const label = orderMode === "buy" ? "Bought" : "Sold";
        toast.success(`${label} ${qty} ${orderSymbol.replace(".NS", "")}`);
      } else {
        toast.error(json.error || "Transaction failed");
      }
    } catch {
      toast.error("Network error");
    }
    setOrderSymbol(null);
    setQty(1);
  }, [orderSymbol, orderMode, qty, prices, dispatch]);

  const holdingsValue = portfolioValue - state.cashBalance;
  const holdingCount = Object.keys(state.holdings).length;

  const tradeStats = useMemo(() => {
    const buys = state.transactions.filter((t) => t.type === "buy");
    const sells = state.transactions.filter((t) => t.type === "sell");
    return { totalTrades: state.transactions.length, buys: buys.length, sells: sells.length };
  }, [state.transactions]);

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        {/* ===== HEADER ===== */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-white sm:text-xl">{state.eventName}</h1>
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <Timer className="h-3 w-3" />
                {currentDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-gray-800 bg-gray-900 p-1">
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    speed === s
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/30"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {state.phase === "running" ? (
                <button
                  onClick={() => dispatch({ type: "PAUSE" })}
                  className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-500"
                >
                  <Pause className="mr-1 inline-block h-3.5 w-3.5" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={() => dispatch({ type: "RESUME" })}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
                >
                  <Play className="mr-1 inline-block h-3.5 w-3.5" />
                  Resume
                </button>
              )}
              <button
                onClick={handleEndSimulation}
                disabled={ending}
                className="rounded-xl border border-red-800/40 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-950/30 disabled:opacity-50"
              >
                <Square className="mr-1 inline-block h-3.5 w-3.5" />
                {ending ? "Ending..." : "End"}
              </button>
            </div>
          </div>
        </div>

        {/* ===== PROGRESS BAR ===== */}
        <div className="mb-5">
          <div className="mb-1.5 flex items-center justify-between text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              Day {state.day + 1} / {state.totalDays}
            </span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* ===== STATS ROW ===== */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3 sm:p-4">
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">
              Portfolio
            </p>
            <p className="text-lg font-bold text-white sm:text-xl">{formatINR(portfolioValue)}</p>
            <div className="mt-1 flex items-center gap-1">
              <span className={`text-xs font-medium ${returnPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {returnPct >= 0 ? "+" : ""}{formatPercent(returnPct)}
              </span>
              <span className="text-[10px] text-gray-600">all time</span>
            </div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3 sm:p-4">
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">Cash</p>
            <p className="text-lg font-bold text-emerald-400 sm:text-xl">{formatINR(state.cashBalance)}</p>
            <p className="mt-1 text-[10px] text-gray-600">
              {formatPercent(portfolioValue > 0 ? (state.cashBalance / portfolioValue) * 100 : 0)} of portfolio
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3 sm:p-4">
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">Invested</p>
            <p className="text-lg font-bold text-white sm:text-xl">{formatINR(invested)}</p>
            <p className="mt-1 text-[10px] text-gray-600">{holdingCount} position{holdingCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3 sm:p-4">
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">P&amp;L</p>
            <p className={`text-lg font-bold sm:text-xl ${gainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {gainLoss >= 0 ? "+" : ""}{formatINR(gainLoss)}
            </p>
            <p className={`mt-1 text-xs font-medium ${gainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {gainLossPct >= 0 ? "+" : ""}{formatPercent(gainLossPct)}
            </p>
          </div>
        </div>

        {/* ===== CHART ===== */}
        <div className="mb-5 overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60">
          <div className="border-b border-gray-800 px-4 py-2.5">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <BarChart3 className="h-3.5 w-3.5" />
              Portfolio Value
            </h3>
          </div>
          <div className="p-0 sm:p-0">
            {state.valueHistory.length > 1 ? (
              <div className="relative h-48 w-full sm:h-56">
                <svg
                  viewBox={`0 0 ${state.valueHistory.length - 1} 100`}
                  preserveAspectRatio="none"
                  className="h-full w-full"
                >
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={(() => {
                      const vals = state.valueHistory;
                      const min = Math.min(...vals);
                      const max = Math.max(...vals);
                      const range = max - min || 1;
                      return vals
                        .map((v, i) => {
                          const x = i;
                          const y = 100 - ((v - min) / range) * 90 - 5;
                          return `${i === 0 ? "M" : "L"}${x},${y}`;
                        })
                        .join(" ");
                    })()}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={(() => {
                      const vals = state.valueHistory;
                      const min = Math.min(...vals);
                      const max = Math.max(...vals);
                      const range = max - min || 1;
                      const points = vals.map((v, i) => {
                        const x = i;
                        const y = 100 - ((v - min) / range) * 90 - 5;
                        return `${x},${y}`;
                      });
                      return `M${points[0]} L${points.slice(1).join(" L")} L${vals.length - 1},100 L0,100 Z`;
                    })()}
                    fill="url(#portfolioGradient)"
                  />
                  {(() => {
                    const vals = state.valueHistory;
                    const last = vals[vals.length - 1];
                    const min = Math.min(...vals);
                    const max = Math.max(...vals);
                    const range = max - min || 1;
                    const lastX = vals.length - 1;
                    const lastY = 100 - ((last - min) / range) * 90 - 5;
                    return (
                      <circle cx={lastX} cy={lastY} r="3" fill="#10b981" />
                    );
                  })()}
                </svg>
                <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] text-gray-600">
                  <span>Day 1</span>
                  <span>Day {state.valueHistory.length}</span>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center sm:h-56">
                <p className="text-xs text-gray-600">Collecting data...</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== MAIN GRID: Market + Holdings/Trades ===== */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* LEFT: Market Watch */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60">
              <div className="border-b border-gray-800 p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    placeholder="Search stocks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700/30"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-[480px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-900/95 text-[10px] font-medium uppercase tracking-wider text-gray-500 backdrop-blur-sm">
                    <tr>
                      <th className="px-3 py-2.5 text-left">Symbol</th>
                      <th className="px-3 py-2.5 text-right">Price</th>
                      <th className="px-3 py-2.5 text-right">Hold</th>
                      <th className="px-3 py-2.5 text-right">Value</th>
                      <th className="px-3 py-2.5 text-center">Trade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.map((stock) => {
                      const price = prices[stock.symbol] ?? 0;
                      const hold = state.holdings[stock.symbol];
                      const holdQty = hold?.qty ?? 0;
                      const holdVal = holdQty * price;
                      return (
                        <tr
                          key={stock.symbol}
                          className="border-t border-gray-800/50 transition hover:bg-gray-800/30"
                        >
                          <td className="px-3 py-2.5">
                            <div>
                              <p className="font-medium text-white">{stock.symbol.replace(".NS", "")}</p>
                              <p className="truncate text-[11px] text-gray-600 max-w-[130px]">{stock.name}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm font-medium text-white">
                            {formatINR(price)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm text-gray-400">
                            {holdQty > 0 ? holdQty : <span className="text-gray-700">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm text-gray-300">
                            {holdQty > 0 ? formatINR(holdVal) : <span className="text-gray-700">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openOrder(stock.symbol, "sell")}
                                disabled={holdQty === 0}
                                className="rounded-lg border border-red-800/30 px-2.5 py-1 text-[10px] font-semibold text-red-400 transition hover:bg-red-950/30 disabled:opacity-20 disabled:cursor-not-allowed"
                              >
                                Sell
                              </button>
                              <button
                                onClick={() => openOrder(stock.symbol, "buy")}
                                disabled={state.cashBalance < price}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                Buy
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredStocks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-12 text-center text-sm text-gray-600">
                          No stocks match your search
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT: Holdings + Trades */}
          <div className="space-y-4">
            {/* Tab switcher */}
            <div className="flex rounded-xl border border-gray-800 bg-gray-900/60 p-1">
              <button
                onClick={() => setActiveTab("holdings")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  activeTab === "holdings"
                    ? "bg-emerald-600/20 text-emerald-300"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Holdings ({holdingCount})
              </button>
              <button
                onClick={() => setActiveTab("trades")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  activeTab === "trades"
                    ? "bg-emerald-600/20 text-emerald-300"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Trades ({tradeStats.totalTrades})
              </button>
            </div>

            {/* Holdings Panel */}
            {activeTab === "holdings" && (
              <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60">
                {holdingList.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                    <Wallet className="h-8 w-8 text-gray-700" />
                    <p className="text-sm text-gray-600">No holdings yet</p>
                    <p className="text-[11px] text-gray-700">Buy stocks from the market watch panel</p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-900/95 text-[10px] font-medium uppercase tracking-wider text-gray-500 backdrop-blur-sm">
                        <tr>
                          <th className="px-3 py-2 text-left">Symbol</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-right">Avg</th>
                          <th className="px-3 py-2 text-right">P&amp;L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdingList.map((h) => (
                          <tr key={h.symbol} className="border-t border-gray-800/50">
                            <td className="px-3 py-2">
                              <p className="font-medium text-white">{h.symbol.replace(".NS", "")}</p>
                              <p className={`text-xs ${h.pl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {formatINR(h.currentPrice)}
                              </p>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-sm text-gray-300">
                              {h.qty}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-sm text-gray-400">
                              {formatINR(h.avgBuyPrice)}
                            </td>
                            <td className={`px-3 py-2 text-right font-mono text-sm font-semibold ${
                              h.pl >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}>
                              <div>{h.pl >= 0 ? "+" : ""}{formatINR(h.pl)}</div>
                              <div className="text-[10px] opacity-70">
                                {h.plPct >= 0 ? "+" : ""}{formatPercent(h.plPct)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Trades Panel */}
            {activeTab === "trades" && (
              <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60">
                {state.transactions.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                    <BarChart3 className="h-8 w-8 text-gray-700" />
                    <p className="text-sm text-gray-600">No trades yet</p>
                    <p className="text-[11px] text-gray-700">Your trade history will appear here</p>
                  </div>
                ) : (
                  <div ref={feedRef} className="max-h-[400px] space-y-0.5 overflow-y-auto p-2">
                    {[...state.transactions].reverse().map((tx, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-xs transition hover:bg-gray-800/30"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex size-6 items-center justify-center rounded-md text-[10px] font-bold ${
                              tx.type === "buy"
                                ? "bg-emerald-900/30 text-emerald-400"
                                : "bg-red-900/30 text-red-400"
                            }`}
                          >
                            {tx.type === "buy" ? "B" : "S"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-300">
                              {tx.symbol.replace(".NS", "")}
                            </p>
                            <p className="text-gray-600">Day {tx.day + 1}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-300">
                            {tx.qty} @ {formatINR(tx.price)}
                          </p>
                          <p className="text-gray-600">{formatINR(tx.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Trades</p>
                <p className="text-lg font-bold text-white">{tradeStats.totalTrades}</p>
                <p className="text-[10px] text-gray-600">
                  {tradeStats.buys} B / {tradeStats.sells} S
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Day</p>
                <p className="text-lg font-bold text-white">{state.day + 1}</p>
                <p className="text-[10px] text-gray-600">of {state.totalDays}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ORDER MODAL ===== */}
      {orderSymbol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm animate-slide-up rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{orderSymbol.replace(".NS", "")}</h3>
                <p className="text-xs text-gray-500">
                  {orderMode === "buy" ? "Buy" : "Sell"} · {formatINR(prices[orderSymbol] ?? 0)} per share
                </p>
              </div>
              <button
                onClick={() => setOrderSymbol(null)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Order type toggle */}
            <div className="mb-4 flex rounded-xl border border-gray-800 p-1">
              <button
                onClick={() => setOrderMode("buy")}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                  orderMode === "buy"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setOrderMode("sell")}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                  orderMode === "sell"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Sell
              </button>
            </div>

            {/* Quantity with quick presets */}
            <div className="mb-3">
              <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                <span>Quantity</span>
                <span className="text-gray-600">Cash: {formatINR(state.cashBalance)}</span>
              </div>
              <div className="mb-2 flex items-center gap-3">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="flex size-10 items-center justify-center rounded-xl border border-gray-800 text-gray-400 transition hover:border-gray-700 hover:text-white"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={orderMode === "sell" ? (state.holdings[orderSymbol]?.qty ?? 999) : 9999}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 rounded-xl border border-gray-800 bg-gray-950 py-2 text-center text-lg font-bold text-white outline-none transition focus:border-emerald-700"
                />
                <button
                  onClick={() => setQty(qty + 1)}
                  className="flex size-10 items-center justify-center rounded-xl border border-gray-800 text-gray-400 transition hover:border-gray-700 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {/* Quick quantity buttons */}
              <div className="flex gap-1.5">
                {[25, 50, 75, 100].map((pct) => {
                  const max =
                    orderMode === "buy"
                      ? Math.floor(state.cashBalance / (prices[orderSymbol] ?? 1))
                      : state.holdings[orderSymbol]?.qty ?? 0;
                  const val = Math.max(1, Math.floor(max * (pct / 100)));
                  return (
                    <button
                      key={pct}
                      onClick={() => setQty(val)}
                      className="flex-1 rounded-lg border border-gray-800 py-1.5 text-[10px] font-medium text-gray-500 transition hover:border-gray-700 hover:text-gray-300"
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="mb-5 rounded-xl bg-gray-950 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="text-lg font-bold text-white">
                  {formatINR(qty * (prices[orderSymbol] ?? 0))}
                </span>
              </div>
              {orderMode === "sell" && state.holdings[orderSymbol] && (
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-gray-600">Avg Cost</span>
                  <span className="text-gray-400">
                    {formatINR(state.holdings[orderSymbol].avgBuyPrice)} / share
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={executeOrder}
                disabled={
                  orderMode === "buy"
                    ? qty * (prices[orderSymbol] ?? 0) > state.cashBalance
                    : qty > (state.holdings[orderSymbol]?.qty ?? 0)
                }
                className={`flex-1 rounded-xl py-3 font-semibold text-white transition disabled:opacity-30 disabled:cursor-not-allowed ${
                  orderMode === "buy"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {orderMode === "buy" ? "Buy" : "Sell"} {qty} shares
              </button>
              <button
                onClick={() => setOrderSymbol(null)}
                className="flex-1 rounded-xl border border-gray-800 py-3 font-semibold text-gray-400 transition hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== RESULT MODAL ===== */}
      <Dialog open={showResult} onOpenChange={(open) => {
        if (!open) {
          router.push("/portfolio");
        }
      }}>
        <DialogContent className="border-emerald-800/40 bg-gray-950 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-white">
              Simulation Complete
            </DialogTitle>
            <DialogDescription className="text-center">
              {resultData && (
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Final Portfolio Value</p>
                    <p className="text-3xl font-bold text-white">
                      {formatINR(resultData.finalValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gain / Loss</p>
                    <p className={`text-xl font-bold ${
                      resultData.gainLoss >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {resultData.gainLoss >= 0 ? "+" : ""}{formatINR(resultData.gainLoss)}
                      <span className="text-sm ml-1">
                        ({resultData.gainLoss >= 0 ? "+" : ""}
                        {formatPercent((resultData.gainLoss / STARTING_CASH) * 100)})
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => router.push("/portfolio")}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
            >
              View Restored Portfolio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
