"use client";

import { useReducer, useCallback, useState, useEffect } from "react";
import type { SimState, SimAction, SimStartData } from "@/src/types";
import { initialState, calcSimPortfolioValue } from "@/src/lib/simulation";
import { apiPost, apiGet } from "@/src/lib/api";
import EventSelector from "@/src/components/simulate/EventSelector";
import SimDashboard from "@/src/components/simulate/SimDashboard";
import SimResults from "@/src/components/simulate/SimResults";
import { Gamepad2, X } from "lucide-react";

function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "START": {
      const p = action.payload;
      const s: SimState = {
        ...initialState,
        phase: "running",
        day: 0,
        totalDays: p.event.durationDays,
        eventName: p.event.name,
        eventId: p.event.id,
        stocks: p.stocks,
        priceHistory: p.priceHistory,
        cashBalance: p.startingCash,
        startDate: p.event.startRealDate,
        valueHistory: [],
      };
      s.valueHistory.push(p.startingCash);
      return s;
    }
    case "TICK": {
      if (state.phase !== "running") return state;
      const nextDay = state.day + 1;
      const nextState = { ...state, day: nextDay };
      nextState.valueHistory = [...state.valueHistory, calcSimPortfolioValue(nextState)];
      return nextState;
    }
    case "BUY": {
      if (state.phase !== "running" && state.phase !== "paused")
        return state;
      const { symbol, qty, price } = action.payload;
      const cost = qty * price;
      if (cost > state.cashBalance) return state;
      const existing = state.holdings[symbol];
      const newQty = existing ? existing.qty + qty : qty;
      const newAvg = existing
        ? (existing.avgBuyPrice * existing.qty + cost) / newQty
        : price;
      return {
        ...state,
        cashBalance: Number((state.cashBalance - cost).toFixed(2)),
        holdings: {
          ...state.holdings,
          [symbol]: { qty: newQty, avgBuyPrice: Number(newAvg.toFixed(2)) },
        },
        transactions: [
          ...state.transactions,
          { symbol, type: "buy", qty, price, day: state.day, total: cost },
        ],
      };
    }
    case "SELL": {
      if (state.phase !== "running" && state.phase !== "paused")
        return state;
      const { symbol: sSym, qty: sQty, price: sPrice } = action.payload;
      const holding = state.holdings[sSym];
      if (!holding || holding.qty < sQty) return state;
      const proceeds = sQty * sPrice;
      const remaining = holding.qty - sQty;
      const newHoldings = { ...state.holdings };
      if (remaining === 0) {
        delete newHoldings[sSym];
      } else {
        newHoldings[sSym] = { qty: remaining, avgBuyPrice: holding.avgBuyPrice };
      }
      return {
        ...state,
        cashBalance: Number((state.cashBalance + proceeds).toFixed(2)),
        holdings: newHoldings,
        transactions: [
          ...state.transactions,
          {
            symbol: sSym,
            type: "sell",
            qty: sQty,
            price: sPrice,
            day: state.day,
            total: proceeds,
          },
        ],
      };
    }
    case "PAUSE":
      return state.phase === "running"
        ? { ...state, phase: "paused" }
        : state;
    case "RESUME":
      return state.phase === "paused"
        ? { ...state, phase: "running" }
        : state;
    case "END":
      return state.phase === "running" || state.phase === "paused"
        ? { ...state, phase: "finished" }
        : { ...initialState };
    default:
      return state;
  }
}

export default function SimulatePage() {
  const [state, dispatch] = useReducer(simReducer, initialState);
  const [tournamentActive, setTournamentActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeSim, setActiveSim] = useState<{ eventId: string; startedAt: string } | null>(null);

  useEffect(() => {
    fetch("/api/tournament/active")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data && json.data.isRegistered) {
          setTournamentActive(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    apiGet<{ hasActiveSimulation: boolean; eventId?: string; startedAt?: string }>("/api/simulations/active")
      .then((res) => {
        if (res.success && res.data?.hasActiveSimulation) {
          setActiveSim({ eventId: res.data.eventId!, startedAt: res.data.startedAt! });
        }
      })
      .catch(() => {});
  }, []);

  const showBanner = tournamentActive && !dismissed;

  const handleSelectEvent = useCallback(
    async (eventId: string) => {
      if (tournamentActive) return;
      const res = await apiPost<SimStartData>(`/api/simulations/${eventId}/start`, {});
      if (res.success && res.data) {
        dispatch({ type: "START", payload: res.data });
      } else {
        if (res.error?.includes("already in progress")) {
          setActiveSim({ eventId, startedAt: new Date().toISOString() });
        }
      }
    },
    [tournamentActive]
  );

  if (state.phase === "finished") {
    return <SimResults state={state} onTryAnother={() => dispatch({ type: "END" })} />;
  }

  return (
    <main className="min-h-screen bg-gray-950">
      {showBanner && (
        <div className="bg-amber-900/30 border-b border-amber-700/30 px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-amber-300">
              <Gamepad2 className="h-4 w-4 shrink-0" />
              <span>
                Simulations are disabled during the tournament month. Focus on your
                tournament portfolio!
              </span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 rounded-lg p-1 text-amber-400/60 hover:bg-amber-800/30 hover:text-amber-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {activeSim && state.phase === "idle" && (
        <div className="bg-red-900/30 border-b border-red-700/30 px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-red-300">
              <Gamepad2 className="h-4 w-4 shrink-0" />
              <span>
                You have a simulation in progress. Resume or end it to start a new one.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const endRes = await apiPost(`/api/simulations/${activeSim.eventId}/end`, {});
                  if (endRes.success) {
                    setActiveSim(null);
                    const startRes = await apiPost<SimStartData>(`/api/simulations/${activeSim.eventId}/start`, {});
                    if (startRes.success && startRes.data) {
                      dispatch({ type: "START", payload: startRes.data });
                    }
                  }
                }}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Resume Simulation
              </button>
              <button
                onClick={async () => {
                  const res = await apiPost(`/api/simulations/${activeSim.eventId}/end`, {});
                  if (res.success) {
                    setActiveSim(null);
                  }
                }}
                className="rounded-lg border border-red-700/50 px-4 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-800/30"
              >
                End & Restore Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
      {state.phase === "idle" ? (
        <EventSelector onSelect={handleSelectEvent} />
      ) : (
        <SimDashboard state={state} dispatch={dispatch} />
      )}
    </main>
  );
}
