"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { SimState, SimAction } from "@/src/types";
import {
  getCurrentPrices,
  calcSimPortfolioValue,
  STARTING_CASH,
} from "@/src/lib/simulation";
import { formatINR, formatPercent } from "@/lib/format";

interface Props {
  state: SimState;
  dispatch: React.Dispatch<SimAction>;
}

export default function SimulationEngine({ state, dispatch }: Props) {
  const [speed, setSpeed] = useState(1);
  const [search, setSearch] = useState("");
  const [buySymbol, setBuySymbol] = useState<string | null>(null);
  const [sellSymbol, setSellSymbol] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const prices = useMemo(() => getCurrentPrices(state), [state]);
  const portfolioValue = useMemo(() => calcSimPortfolioValue(state), [state]);
  const gainLoss = portfolioValue - STARTING_CASH;

  const currentDate = useMemo(() => {
    const d = new Date(state.startDate);
    d.setDate(d.getDate() + state.day);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [state.startDate, state.day]);

  const progressPct =
    state.totalDays > 0 ? ((state.day + 1) / state.totalDays) * 100 : 0;

  useEffect(() => {
    if (state.phase !== "running") return;
    const interval = setInterval(() => {
      dispatch({ type: "TICK" });
    }, Math.round(1000 / speed));
    return () => clearInterval(interval);
  }, [state.phase, speed, dispatch]);

  const filteredStocks = useMemo(() => {
    if (!search) return state.stocks;
    const q = search.toLowerCase();
    return state.stocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    );
  }, [state.stocks, search]);

  const handleBuy = useCallback(() => {
    if (!buySymbol) return;
    const price = prices[buySymbol];
    if (!price) return;
    dispatch({ type: "BUY", payload: { symbol: buySymbol, qty, price } });
    setBuySymbol(null);
    setQty(1);
  }, [buySymbol, qty, prices, dispatch]);

  const handleSell = useCallback(() => {
    if (!sellSymbol) return;
    const price = prices[sellSymbol];
    if (!price) return;
    dispatch({ type: "SELL", payload: { symbol: sellSymbol, qty, price } });
    setSellSymbol(null);
    setQty(1);
  }, [sellSymbol, qty, prices, dispatch]);

  const holdingQty = (sym: string) => state.holdings[sym]?.qty ?? 0;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{state.eventName}</h2>
            <p className="text-sm text-gray-400">{currentDate}</p>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`rounded px-3 py-1 text-xs font-medium transition ${
                  speed === s
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
            <span>
              Day {state.day + 1} of {state.totalDays}
            </span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Portfolio summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-gray-800 p-3 text-center">
            <p className="text-xs text-gray-400">Portfolio Value</p>
            <p className="text-lg font-bold text-white">
              {formatINR(portfolioValue)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-800 p-3 text-center">
            <p className="text-xs text-gray-400">Cash</p>
            <p className="text-lg font-bold text-emerald-400">
              {formatINR(state.cashBalance)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-800 p-3 text-center">
            <p className="text-xs text-gray-400">Gain/Loss</p>
            <p
              className={`text-lg font-bold ${
                gainLoss >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {gainLoss >= 0 ? "+" : ""}
              {formatINR(gainLoss)}
              <span className="text-xs">
                {" "}
                ({formatPercent((gainLoss / STARTING_CASH) * 100)})
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {state.phase === "running" ? (
          <button
            onClick={() => dispatch({ type: "PAUSE" })}
            className="rounded-lg bg-amber-600 px-6 py-2 font-medium text-white hover:bg-amber-500"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={() => dispatch({ type: "RESUME" })}
            className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-500"
          >
            Resume
          </button>
        )}
        <button
          onClick={() => dispatch({ type: "END" })}
          className="rounded-lg bg-red-600 px-6 py-2 font-medium text-white hover:bg-red-500"
        >
          End Simulation
        </button>
      </div>

      {/* Stock table */}
      <div className="rounded-xl border border-gray-700 bg-gray-900">
        <div className="border-b border-gray-700 p-3">
          <input
            type="text"
            placeholder="Search stocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-800 text-xs text-gray-400">
              <tr>
                <th className="px-3 py-2 text-left">Symbol</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2 text-right">Hold</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => {
                const price = prices[stock.symbol] ?? 0;
                const hold = holdingQty(stock.symbol);
                return (
                  <tr
                    key={stock.symbol}
                    className="border-t border-gray-800 transition hover:bg-gray-800/50"
                  >
                    <td className="px-3 py-2 font-medium text-white">
                      {stock.symbol}
                    </td>
                    <td className="max-w-32 truncate px-3 py-2 text-gray-400">
                      {stock.name}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-white">
                      {formatINR(price)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">
                      {hold > 0 ? hold : "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setBuySymbol(stock.symbol);
                            setQty(1);
                            setSellSymbol(null);
                          }}
                          disabled={state.cashBalance < price}
                          className="rounded bg-emerald-700 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-40"
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => {
                            setSellSymbol(stock.symbol);
                            setQty(1);
                            setBuySymbol(null);
                          }}
                          disabled={hold === 0}
                          className="rounded bg-red-700 px-2 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-40"
                        >
                          Sell
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStocks.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    No stocks match your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buy Dialog */}
      {buySymbol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-6">
            <h3 className="mb-1 text-lg font-bold text-white">Buy {buySymbol}</h3>
            <p className="mb-4 text-sm text-gray-400">
              Price: {formatINR(prices[buySymbol] ?? 0)} | Cash:{" "}
              {formatINR(state.cashBalance)}
            </p>
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="flex size-8 items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700"
              >
                −
              </button>
              <span className="min-w-12 text-center text-xl font-bold text-white">
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                className="flex size-8 items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700"
              >
                +
              </button>
            </div>
            <p className="mb-4 text-center text-sm text-gray-400">
              Total:{" "}
              <span className="font-semibold text-white">
                {formatINR(qty * (prices[buySymbol] ?? 0))}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleBuy}
                disabled={qty * (prices[buySymbol] ?? 0) > state.cashBalance}
                className="flex-1 rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
              >
                Confirm Buy
              </button>
              <button
                onClick={() => setBuySymbol(null)}
                className="flex-1 rounded-lg border border-gray-600 py-2 font-medium text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Dialog */}
      {sellSymbol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-6">
            <h3 className="mb-1 text-lg font-bold text-white">
              Sell {sellSymbol}
            </h3>
            <p className="mb-4 text-sm text-gray-400">
              Price: {formatINR(prices[sellSymbol] ?? 0)} | Hold:{" "}
              {holdingQty(sellSymbol)}
            </p>
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="flex size-8 items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700"
              >
                −
              </button>
              <span className="min-w-12 text-center text-xl font-bold text-white">
                {qty}
              </span>
              <button
                onClick={() =>
                  setQty(Math.min(holdingQty(sellSymbol), qty + 1))
                }
                className="flex size-8 items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700"
              >
                +
              </button>
            </div>
            <p className="mb-4 text-center text-sm text-gray-400">
              Proceeds:{" "}
              <span className="font-semibold text-white">
                {formatINR(qty * (prices[sellSymbol] ?? 0))}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSell}
                disabled={qty > holdingQty(sellSymbol)}
                className="flex-1 rounded-lg bg-red-600 py-2 font-medium text-white hover:bg-red-500 disabled:opacity-40"
              >
                Confirm Sell
              </button>
              <button
                onClick={() => setSellSymbol(null)}
                className="flex-1 rounded-lg border border-gray-600 py-2 font-medium text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
