export interface User {
  id: string;
  name: string;
  email: string;
  upiId: string | null;
  createdAt: string;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  faceValue: number;
  isActive: boolean;
  sharesOutstanding: number;
}

export interface StockWithPrice extends Stock {
  currentPrice: number;
  previousClose: number;
  changePercent: number;
  marketCap: number;
  volume: number;
  lastUpdated: string;
}

export interface KeyStats {
  ttmEps: number;
  ttmPe: number;
  pbRatio: number;
  sectorPe: number;
  bookValue: number;
  dividendYield: number;
  beta: number;
  avgVolume20d: number;
  avgDeliveryPct20d: number;
  upperCircuit: number;
  lowerCircuit: number;
}

export interface StockDetail extends StockWithPrice {
  keyStats: KeyStats;
}

export interface PricePoint {
  timestamp: string;
  price: number;
  volume: number;
}

export interface StockPrice {
  id: string;
  stockId: string;
  price: number;
  volume: number;
  timestamp: string;
  priceType: "live" | "historical" | "simulated";
}

export interface Portfolio {
  id: string;
  userId: string;
  inTournament: boolean;
  tournamentId: string | null;
  cashBalance: number;
  createdAt: string;
}

export interface Holding {
  id: string;
  portfolioId: string;
  stockId: string;
  quantity: number;
  avgBuyPrice: number;
}

export interface HoldingWithPrice {
  id: string;
  stockId: string;
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  previousClose: number;
  currentValue: number;
  invested: number;
  gainLoss: number;
  gainLossPct: number;
  todayGain: number;
}

export interface PortfolioData {
  holdings: HoldingWithPrice[];
  cashBalance: number;
  totalInvested: number;
  totalCurrentValue: number;
  unrealizedGain: number;
  todayGain: number;
  realizedGainTillDate: number;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  stockId: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  realizedGain: number | null;
  createdAt: string;
}

export interface Tournament {
  id: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  prizePool: Record<string, unknown>;
}

export interface SimulationEvent {
  id: string;
  name: string;
  description: string;
  startRealDate: string;
  endRealDate: string;
  durationDays: number;
  priceMultipliers: Record<string, number[]>;
}

export interface SimEvent {
  id: string;
  name: string;
  description: string;
  startRealDate: string;
  endRealDate: string;
  durationDays: number;
  type: "crash" | "rally";
}

export interface SimTransaction {
  symbol: string;
  type: "buy" | "sell";
  qty: number;
  price: number;
  day: number;
  total: number;
}

export interface SimState {
  phase: "idle" | "running" | "paused" | "finished";
  day: number;
  totalDays: number;
  eventName: string;
  eventId: string;
  stocks: { symbol: string; name: string; sector: string }[];
  priceHistory: Record<string, number[]>;
  cashBalance: number;
  holdings: Record<string, { qty: number; avgBuyPrice: number }>;
  transactions: SimTransaction[];
  startDate: string;
  valueHistory: number[];
}

export interface SimStartData {
  event: SimEvent;
  stocks: { symbol: string; name: string; sector: string }[];
  priceHistory: Record<string, number[]>;
  startingCash: number;
}

export type SimAction =
  | { type: "START"; payload: SimStartData }
  | { type: "TICK" }
  | { type: "BUY"; payload: { symbol: string; qty: number; price: number } }
  | { type: "SELL"; payload: { symbol: string; qty: number; price: number } }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "END" };

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}
