import type { SimState, SimTransaction } from "@/src/types";

export function getCurrentPrices(state: SimState): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const sym of Object.keys(state.basePrices)) {
    const base = state.basePrices[sym];
    const mults = state.multipliers[sym];
    if (mults && mults.length > state.day) {
      prices[sym] = Number((base * mults[state.day]).toFixed(2));
    } else {
      prices[sym] = base;
    }
  }
  return prices;
}

export function simBuy(
  state: SimState,
  symbol: string,
  qty: number,
  price: number
): SimState {
  const cost = qty * price;
  if (cost > state.cashBalance) return state;
  const existing = state.holdings[symbol];
  const newQty = existing ? existing.qty + qty : qty;
  const newAvg = existing
    ? (existing.avgBuyPrice * existing.qty + cost) / newQty
    : price;
  const tx: SimTransaction = {
    symbol,
    type: "buy",
    qty,
    price,
    day: state.day,
    total: cost,
  };
  return {
    ...state,
    cashBalance: Number((state.cashBalance - cost).toFixed(2)),
    holdings: {
      ...state.holdings,
      [symbol]: { qty: newQty, avgBuyPrice: Number(newAvg.toFixed(2)) },
    },
    transactions: [...state.transactions, tx],
  };
}

export function simSell(
  state: SimState,
  symbol: string,
  qty: number,
  price: number
): SimState {
  const holding = state.holdings[symbol];
  if (!holding || holding.qty < qty) return state;
  const proceeds = qty * price;
  const remaining = holding.qty - qty;
  const tx: SimTransaction = {
    symbol,
    type: "sell",
    qty,
    price,
    day: state.day,
    total: proceeds,
  };
  const newHoldings = { ...state.holdings };
  if (remaining === 0) {
    delete newHoldings[symbol];
  } else {
    newHoldings[symbol] = { qty: remaining, avgBuyPrice: holding.avgBuyPrice };
  }
  return {
    ...state,
    cashBalance: Number((state.cashBalance + proceeds).toFixed(2)),
    holdings: newHoldings,
    transactions: [...state.transactions, tx],
  };
}

export function calcSimPortfolioValue(state: SimState): number {
  const prices = getCurrentPrices(state);
  let stockValue = 0;
  for (const [sym, h] of Object.entries(state.holdings)) {
    stockValue += h.qty * (prices[sym] || 0);
  }
  return Number((stockValue + state.cashBalance).toFixed(2));
}

export const STARTING_CASH = 100000;

export const initialState: SimState = {
  phase: "idle",
  day: 0,
  totalDays: 0,
  eventName: "",
  eventId: "",
  basePrices: {},
  stocks: [],
  multipliers: {},
  cashBalance: STARTING_CASH,
  holdings: {},
  transactions: [],
  startDate: "",
};
