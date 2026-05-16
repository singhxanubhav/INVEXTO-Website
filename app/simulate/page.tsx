"use client";

import { useReducer, useCallback } from "react";
import type { SimState, SimAction, SimStartData } from "@/src/types";
import { initialState } from "@/src/lib/simulation";
import { apiPost } from "@/src/lib/api";
import EventSelector from "@/src/components/simulate/EventSelector";
import SimulationEngine from "@/src/components/simulate/SimulationEngine";
import ResultsModal from "@/src/components/simulate/ResultsModal";

function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "START": {
      const p = action.payload;
      return {
        ...initialState,
        phase: "running",
        day: 0,
        totalDays: p.event.durationDays,
        eventName: p.event.name,
        eventId: p.event.id,
        stocks: p.stocks,
        basePrices: p.basePrices,
        multipliers: p.multipliers,
        cashBalance: p.startingCash,
        startDate: p.event.startRealDate,
      };
    }
    case "TICK": {
      if (state.phase !== "running") return state;
      if (state.day + 1 >= state.totalDays) {
        return { ...state, phase: "finished" };
      }
      return { ...state, day: state.day + 1 };
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

  const handleSelectEvent = useCallback(
    async (eventId: string) => {
      const res = await apiPost<SimStartData>(`/api/simulations/${eventId}/start`, {});
      if (res.success && res.data) {
        dispatch({ type: "START", payload: res.data });
      }
    },
    []
  );

  if (state.phase === "finished") {
    return (
      <ResultsModal
        state={state}
        onTryAnother={() => dispatch({ type: "END" })}
      />
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {state.phase === "idle" ? (
        <EventSelector onSelect={handleSelectEvent} />
      ) : (
        <SimulationEngine state={state} dispatch={dispatch} />
      )}
    </main>
  );
}
