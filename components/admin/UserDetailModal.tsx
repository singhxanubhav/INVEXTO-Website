"use client";

import { useState, useEffect } from "react";
import { X, Trophy, AlertTriangle, Shield, TrendingUp, TrendingDown, Clock, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  investedValue: number;
  gainLoss: number;
  gainLossPct: number;
}

interface Transaction {
  id: string;
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  price: number;
  total: number;
  realizedGain: number | null;
  createdAt: string;
}

interface UserPortfolio {
  id: string;
  inTournament: boolean;
  tournamentId: string | null;
  tournamentName: string | null;
  cashBalance: number;
  stockValue: number;
  totalValue: number;
  holdings: Holding[];
  transactions: Transaction[];
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  upiId: string | null;
  isAdmin: boolean;
  isDuplicateUpi: boolean;
  sharedAccounts: { name: string; email: string }[];
  createdAt: string;
  portfolios: UserPortfolio[];
  tournamentRegistrations: {
    id: string;
    tournamentId: string;
    registeredAt: string;
    finalRank: number | null;
    finalValue: number | null;
    prizeAmount: number | null;
    phone: string | null;
  }[];
}

interface Props {
  userId: string | null;
  onClose: () => void;
}

export function UserDetailModal({ userId, onClose }: Props) {
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"portfolio" | "trades" | "tournaments">("portfolio");

  useEffect(() => {
    if (!userId) {
      setData(null);
      return;
    }

    setLoading(true);
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  const tournamentPortfolio = data?.portfolios?.find((p) => p.inTournament) || data?.portfolios?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-emerald-800/40 bg-gray-950 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-emerald-800/30 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-900/40 text-emerald-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{data?.name || "Loading..."}</h2>
                {data?.isAdmin && (
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                    Admin
                  </span>
                )}
                {data?.isDuplicateUpi && (
                  <span className="flex items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    Duplicate UPI
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">{data?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-emerald-950/40 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-sm text-gray-500">Failed to load user details</div>
          ) : (
            <>
              {/* Duplicate UPI Warning Alert */}
              {data.isDuplicateUpi && data.sharedAccounts.length > 0 && (
                <div className="rounded-xl border border-red-800/40 bg-red-950/30 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-red-300">
                        Multi-Account Alert: Same UPI ID ({data.upiId}) is shared with {data.sharedAccounts.length} other account(s):
                      </p>
                      <ul className="mt-1 list-disc list-inside text-red-200/80">
                        {data.sharedAccounts.map((acc, i) => (
                          <li key={i}>
                            {acc.name} ({acc.email})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Summary Cards */}
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-emerald-800/20 bg-emerald-950/20 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">UPI ID</span>
                  <p className="mt-1 text-sm font-semibold text-white truncate">{data.upiId || "Not added"}</p>
                </div>
                <div className="rounded-xl border border-emerald-800/20 bg-emerald-950/20 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Cash Balance</span>
                  <p className="mt-1 text-sm font-semibold text-emerald-400">
                    {tournamentPortfolio ? formatINR(tournamentPortfolio.cashBalance) : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-800/20 bg-emerald-950/20 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Total Portfolio</span>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {tournamentPortfolio ? formatINR(tournamentPortfolio.totalValue) : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-800/20 bg-emerald-950/20 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Joined</span>
                  <p className="mt-1 text-sm font-semibold text-gray-300">
                    {new Date(data.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Tabs Bar */}
              <div className="flex border-b border-emerald-800/30 gap-6 text-sm">
                <button
                  onClick={() => setActiveTab("portfolio")}
                  className={`pb-2 font-medium transition ${
                    activeTab === "portfolio"
                      ? "border-b-2 border-emerald-500 text-emerald-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Holdings ({tournamentPortfolio?.holdings.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("trades")}
                  className={`pb-2 font-medium transition ${
                    activeTab === "trades"
                      ? "border-b-2 border-emerald-500 text-emerald-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Trade History ({tournamentPortfolio?.transactions.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("tournaments")}
                  className={`pb-2 font-medium transition ${
                    activeTab === "tournaments"
                      ? "border-b-2 border-emerald-500 text-emerald-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Tournaments ({data.tournamentRegistrations.length})
                </button>
              </div>

              {/* Tab: Holdings */}
              {activeTab === "portfolio" && (
                <div>
                  {!tournamentPortfolio || tournamentPortfolio.holdings.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500">No stock holdings in portfolio.</div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-emerald-800/30">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-emerald-800/30 bg-emerald-950/40 text-gray-400 text-left">
                            <th className="px-3 py-2.5">Stock</th>
                            <th className="px-3 py-2.5 text-right">Qty</th>
                            <th className="px-3 py-2.5 text-right">Avg Price</th>
                            <th className="px-3 py-2.5 text-right">Current Price</th>
                            <th className="px-3 py-2.5 text-right">Current Value</th>
                            <th className="px-3 py-2.5 text-right">P&L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tournamentPortfolio.holdings.map((h) => {
                            const isProfit = h.gainLoss >= 0;
                            return (
                              <tr key={h.id} className="border-b border-emerald-800/10 hover:bg-emerald-900/10">
                                <td className="px-3 py-2.5">
                                  <span className="font-semibold text-white">{h.symbol}</span>
                                  <span className="block text-[10px] text-gray-500 truncate max-w-[140px]">{h.name}</span>
                                </td>
                                <td className="px-3 py-2.5 text-right font-medium text-white">{h.quantity}</td>
                                <td className="px-3 py-2.5 text-right text-gray-300">{formatINR(h.avgBuyPrice)}</td>
                                <td className="px-3 py-2.5 text-right text-gray-300">{formatINR(h.currentPrice)}</td>
                                <td className="px-3 py-2.5 text-right font-medium text-white">{formatINR(h.currentValue)}</td>
                                <td className={`px-3 py-2.5 text-right font-semibold ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                                  {isProfit ? "+" : ""}{formatINR(h.gainLoss)} ({h.gainLossPct.toFixed(1)}%)
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Trade History */}
              {activeTab === "trades" && (
                <div>
                  {!tournamentPortfolio || tournamentPortfolio.transactions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500">No trades executed yet.</div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-emerald-800/30">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-emerald-800/30 bg-emerald-950/40 text-gray-400 text-left">
                            <th className="px-3 py-2.5">Time</th>
                            <th className="px-3 py-2.5">Type</th>
                            <th className="px-3 py-2.5">Stock</th>
                            <th className="px-3 py-2.5 text-right">Qty</th>
                            <th className="px-3 py-2.5 text-right">Price</th>
                            <th className="px-3 py-2.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tournamentPortfolio.transactions.map((tx) => (
                            <tr key={tx.id} className="border-b border-emerald-800/10 hover:bg-emerald-900/10">
                              <td className="px-3 py-2 text-gray-400">
                                {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                                {new Date(tx.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                    tx.type === "buy" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                                  }`}
                                >
                                  {tx.type}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-medium text-white">{tx.symbol}</td>
                              <td className="px-3 py-2 text-right text-gray-300">{tx.quantity}</td>
                              <td className="px-3 py-2 text-right text-gray-300">{formatINR(tx.price)}</td>
                              <td className="px-3 py-2 text-right font-medium text-white">{formatINR(tx.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Tournaments */}
              {activeTab === "tournaments" && (
                <div className="space-y-2">
                  {data.tournamentRegistrations.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500">No tournament participation.</div>
                  ) : (
                    data.tournamentRegistrations.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-xl border border-emerald-800/20 bg-emerald-950/20 p-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <Trophy className="h-4 w-4 text-amber-400" />
                          <div>
                            <span className="font-semibold text-white">Registered on {new Date(r.registeredAt).toLocaleDateString("en-IN")}</span>
                            {r.phone && <p className="text-[10px] text-gray-400">Phone: {r.phone}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          {r.finalRank !== null ? (
                            <span className="rounded bg-amber-500/20 px-2 py-0.5 font-bold text-amber-400">Rank #{r.finalRank}</span>
                          ) : (
                            <span className="text-gray-400">Ongoing</span>
                          )}
                          {r.prizeAmount !== null && (
                            <p className="mt-1 font-semibold text-emerald-400">Won: {formatINR(r.prizeAmount)}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-emerald-800/30 p-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="border-emerald-800/40 text-gray-300 hover:text-white">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
