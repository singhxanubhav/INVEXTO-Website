"use client";

import { useState, useEffect, useRef } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PiggyBank,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/Navbar";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { GainLossSummary } from "@/components/portfolio/GainLossSummary";
import { BuySellModal } from "@/components/stocks/BuySellModal";
import { useAuth } from "@/src/hooks/useAuth";
import { formatINR, formatPercent } from "@/lib/format";
import type { PortfolioData } from "@/src/types";

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"buy" | "sell">("buy");
  const [modalStock, setModalStock] = useState<{
    symbol: string;
    name: string;
  }>({ symbol: "", name: "" });
  const [mode, setMode] = useState<"normal" | "tournament">("normal");
  const [hasTournament, setHasTournament] = useState(false);
  const [tournamentEndDate, setTournamentEndDate] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = "/";
      return;
    }

    fetch(`/api/tournament/active?t=${Date.now()}`)
      .then((r) => r.json())
      .then((json) => {
        const isRegistered = json.success && json.data?.isRegistered;
        if (isRegistered) {
          setHasTournament(true);
          setMode("tournament");
          if (json.data?.tournament?.endDate) {
            setTournamentEndDate(json.data.tournament.endDate);
          }
        }
        setInitialized(true);
      })
      .catch(() => setInitialized(true));
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || !initialized) return;
    setLoading(true);
    fetch(`/api/portfolio?mode=${mode}&t=${Date.now()}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        } else setData(null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user, initialized, mode, refreshKey]);

  const prevModalOpen = useRef(false);
  useEffect(() => {
    if (prevModalOpen.current && !modalOpen) {
      setRefreshKey((k) => k + 1);
    }
    prevModalOpen.current = modalOpen;
  }, [modalOpen]);

  if (authLoading || (!user && loading)) {
    return (
      <>
        <Navbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <Skeleton className="mb-6 h-8 w-48 bg-emerald-800/30" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl bg-emerald-800/30" />
            ))}
          </div>
        </main>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Portfolio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {user.name}
          </p>
        </div>



        {mode === "tournament" && tournamentEndDate && (
          <div className="mb-6 rounded-xl border border-amber-800/20 bg-amber-950/20 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <Trophy className="h-4 w-4 shrink-0" />
              <span>
                Tournament ends on{" "}
                {new Date(tournamentEndDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                . Keep trading to climb the leaderboard!
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl bg-emerald-800/30" />
            ))}
          </div>
        ) : data ? (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                title="Total Value"
                value={formatINR(data.totalCurrentValue)}
                icon={Wallet}
                className="border-amber-500/30 bg-amber-500/5"
                iconClass="text-amber-400"
              />
              <SummaryCard
                title="Today's Gain/Loss"
                value={formatINR(data.todayGain)}
                subtitle={`${formatPercent(
                  data.totalInvested > 0
                    ? (data.todayGain / data.totalInvested) * 100
                    : 0
                )}`}
                icon={data.todayGain >= 0 ? TrendingUp : TrendingDown}
                className={
                  data.todayGain >= 0
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }
                iconClass={
                  data.todayGain >= 0 ? "text-emerald-400" : "text-red-400"
                }
              />
              <SummaryCard
                title="Unrealized Gain"
                value={formatINR(data.unrealizedGain)}
                icon={BarChart3}
                className={
                  data.unrealizedGain >= 0
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }
                iconClass={
                  data.unrealizedGain >= 0 ? "text-emerald-400" : "text-red-400"
                }
              />
              <SummaryCard
                title="Realized Gain"
                value={formatINR(data.realizedGainTillDate)}
                icon={PiggyBank}
                className={
                  data.realizedGainTillDate >= 0
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }
                iconClass={
                  data.realizedGainTillDate >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              />
            </div>

            <div className="mb-6">
              <div className="rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Cash Balance
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    {formatINR(data.cashBalance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Holdings
                </h2>
                <HoldingsTable
                  holdings={data.holdings}
                  loading={false}
                  onBuy={(symbol, name) => {
                    setModalStock({ symbol, name });
                    setModalMode("buy");
                    setModalOpen(true);
                  }}
                  onSell={(symbol, name) => {
                    setModalStock({ symbol, name });
                    setModalMode("sell");
                    setModalOpen(true);
                  }}
                />
              </div>
              <div>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Allocation
                </h2>
                <GainLossSummary holdings={data.holdings} loading={false} />
              </div>
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            Could not load portfolio data
          </div>
        )}
      </main>

      <BuySellModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        symbol={modalStock.symbol}
        name={modalStock.name}
        currentPrice={
          data?.holdings.find((h) => h.symbol === modalStock.symbol)
            ?.currentPrice || 0
        }
        cashBalance={data?.cashBalance || 0}
        heldQuantity={
          data?.holdings.find((h) => h.symbol === modalStock.symbol)
            ?.quantity || 0
        }
        apiEndpoint={mode === "tournament" ? "/api/tournament/trade" : undefined}
      />
    </>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
  iconClass,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  className?: string;
  iconClass?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors hover:brightness-110 ${className || "border-emerald-800/30 bg-emerald-900/20"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
        <Icon className={`h-4 w-4 ${iconClass || "text-muted-foreground"}`} />
      </div>
      <div className="mt-2">
        <span className="text-xl font-bold text-foreground">{value}</span>
        {subtitle && (
          <span
            className={`ml-2 text-xs ${
              subtitle.startsWith("+") || subtitle.startsWith("-")
                ? subtitle.startsWith("+")
                  ? "text-emerald-400"
                  : "text-red-400"
                : "text-muted-foreground"
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
