"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/Navbar";
import { StockChart } from "@/components/stocks/StockChart";
import { KeyStatisticsView } from "@/components/stocks/KeyStatistics";
import { BuySellModal } from "@/components/stocks/BuySellModal";
import { useAuth } from "@/src/hooks/useAuth";
import { formatINR, formatPercent, formatCompact } from "@/lib/format";
import type { StockDetail } from "@/src/types";

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const [symbol, setSymbol] = useState("");
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"buy" | "sell">("buy");
  const [cashBalance, setCashBalance] = useState(0);
  const [tourCashBalance, setTourCashBalance] = useState(0);
  const [heldQuantity, setHeldQuantity] = useState(0);
  const [tourHeldQuantity, setTourHeldQuantity] = useState(0);
  const [tournamentMode, setTournamentMode] = useState(false);
  const [inTournament, setInTournament] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    params.then((p) => setSymbol(p.symbol));
  }, [params]);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    fetch(`/api/stocks/${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStock(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol]);

  useEffect(() => {
    if (!user || !symbol) return;
    fetch("/api/portfolio")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setCashBalance(json.data.cashBalance);
          const holding = json.data.holdings.find(
            (h: { symbol: string }) => h.symbol === symbol
          );
          if (holding) setHeldQuantity(holding.quantity);
        }
      })
      .catch(() => {});

    fetch("/api/tournament/active")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data && json.data.isRegistered) {
          setInTournament(true);
          if (json.data.portfolio) {
            setTourCashBalance(json.data.portfolio.cashBalance);
            const th = json.data.portfolio.holdings?.find(
              (h: { symbol: string }) => h.symbol === symbol
            );
            if (th) setTourHeldQuantity(th.quantity);
          }
        }
      })
      .catch(() => {});
  }, [user, symbol]);

  const balance = tournamentMode ? tourCashBalance : cashBalance;
  const held = tournamentMode ? tourHeldQuantity : heldQuantity;

  if (loading || !symbol) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="mb-4 h-8 w-64 bg-emerald-800/30" />
          <Skeleton className="mb-6 h-12 w-48 bg-emerald-800/30" />
          <Skeleton className="h-72 w-full bg-emerald-800/30" />
        </main>
      </>
    );
  }

  if (!stock) {
    return (
      <>
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Stock not found</p>
        </main>
      </>
    );
  }

  const isUp = stock.changePercent > 0;
  const isDown = stock.changePercent < 0;

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

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                {stock.name}
              </h1>
              <Badge
                variant="outline"
                className={`font-mono uppercase ${
                  sectorColors[stock.sector] ||
                  "bg-muted text-muted-foreground"
                }`}
              >
                {symbol.replace(".NS", "")}
              </Badge>
            </div>
            <Badge
              variant="outline"
              className="mt-1.5 border-emerald-800/30 bg-emerald-800/20 text-[10px] text-emerald-300/80"
            >
              {stock.sector}
            </Badge>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setModalMode("buy");
                  setModalOpen(true);
                }}
                className="bg-emerald-500 text-white hover:bg-emerald-400"
              >
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                Buy
              </Button>
              <Button
                onClick={() => {
                  setModalMode("sell");
                  setModalOpen(true);
                }}
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-900/30"
              >
                Sell
              </Button>
            </div>
          )}
        </div>

        {inTournament && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-800/25 bg-emerald-900/20 p-2">
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Trading in:
            </span>
            <button
              onClick={() => setTournamentMode(false)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                !tournamentMode
                  ? "bg-emerald-600 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Regular Portfolio
            </button>
            <button
              onClick={() => setTournamentMode(true)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                tournamentMode
                  ? "bg-amber-500 text-emerald-950"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Tournament Portfolio
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-4xl font-bold text-foreground">
            {formatINR(stock.currentPrice)}
          </span>
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium ${
              isUp
                ? "bg-emerald-500/10 text-emerald-400"
                : isDown
                  ? "bg-red-500/10 text-red-400"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {isUp ? (
              <TrendingUp className="h-4 w-4" />
            ) : isDown ? (
              <TrendingDown className="h-4 w-4" />
            ) : (
              <Minus className="h-4 w-4" />
            )}
            {formatPercent(stock.changePercent)}
          </span>
          <span className="text-sm text-muted-foreground">
            Prev close: {formatINR(stock.previousClose)}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StockChart symbol={symbol} initialColor={isUp ? "emerald" : "red"} />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Market Snapshot
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Cap</span>
                  <span className="font-medium text-foreground">
                    {formatCompact(stock.marketCap)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium text-foreground">
                    {stock.volume.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Quick Actions
              </h3>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setModalMode("buy");
                    setModalOpen(true);
                  }}
                  className="w-full bg-emerald-500 text-white hover:bg-emerald-400"
                  disabled={!user}
                >
                  <ShoppingCart className="mr-1.5 h-4 w-4" />
                  Buy {symbol.replace(".NS", "")}
                </Button>
                <Button
                  onClick={() => {
                    setModalMode("sell");
                    setModalOpen(true);
                  }}
                  variant="outline"
                  className="w-full border-red-500/40 text-red-400 hover:bg-red-900/30"
                  disabled={!user}
                >
                  Sell {symbol.replace(".NS", "")}
                </Button>
                {!user && (
                  <p className="text-center text-xs text-muted-foreground">
                    Login to start trading
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Key Statistics
          </h2>
          <KeyStatisticsView
            stats={stock.keyStats}
            marketCap={stock.marketCap}
          />
        </div>
      </main>

      <BuySellModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        symbol={symbol}
        name={stock.name}
        currentPrice={stock.currentPrice}
        cashBalance={balance}
        heldQuantity={held}
        apiEndpoint={
          tournamentMode ? "/api/tournament/trade" : undefined
        }
      />
    </>
  );
}
