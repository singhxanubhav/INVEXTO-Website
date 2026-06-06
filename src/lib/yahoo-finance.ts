import YahooFinance from "yahoo-finance2";
import { TTLMap } from "@/src/lib/cache";
import { nseStocks, getStockBySymbol } from "@/src/data/nse-stocks";
import type { StockWithPrice, StockDetail, KeyStats, PricePoint } from "@/src/types";

const yahooFinance = new YahooFinance();

const quoteCache = new TTLMap<any>();
const historyCache = new TTLMap<PricePoint[]>();
const multiHistoryCache = new TTLMap<any>();
const searchCache = new TTLMap<any[]>();
const newsCache = new TTLMap<any[]>();

const QUOTE_TTL = 30_000;
const HISTORY_TTL = 300_000;
const SEARCH_TTL = 60_000;
const NEWS_TTL = 1_800_000;

function getLastTradingDay(): Date {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = ist.getDay();
  const lastTrading = new Date(ist);
  if (day === 0) lastTrading.setDate(ist.getDate() - 2);
  else if (day === 6) lastTrading.setDate(ist.getDate() - 1);
  lastTrading.setHours(0, 0, 0, 0);
  return lastTrading;
}

function isWeekend(): boolean {
  const ist = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return ist.getDay() === 0 || ist.getDay() === 6;
}

export async function fetchQuote(symbol: string) {
  const cached = quoteCache.get(symbol);
  if (cached) return cached;

  try {
    const quote = await yahooFinance.quote(symbol) as any;
    quoteCache.set(symbol, quote, QUOTE_TTL);
    return quote;
  } catch (err: any) {
    console.error(`[Yahoo] fetchQuote(${symbol}) failed:`, err?.message ?? err);
    return null;
  }
}

export async function fetchQuotes(symbols: string[]) {
  const unique = [...new Set(symbols)];
  const results: Record<string, any> = {};
  const missing: string[] = [];

  for (const sym of unique) {
    const cached = quoteCache.get(sym);
    if (cached) {
      results[sym] = cached;
    } else {
      missing.push(sym);
    }
  }

  if (missing.length > 0) {
    try {
      const quotes = await yahooFinance.quote(missing) as any;
      const arr = (Array.isArray(quotes) ? quotes : [quotes]) as any[];
      for (const q of arr) {
        if (q?.symbol) {
          quoteCache.set(q.symbol, q, QUOTE_TTL);
          results[q.symbol] = q;
        }
      }
    } catch (err: any) {
      console.error(`[Yahoo] fetchQuotes batch (${missing.length} symbols) failed:`, err?.message ?? err);
    }
  }

  return results;
}

export function mapQuoteToStockWithPrice(
  quote: any,
  stockInfo?: { name: string; sector: string }
): StockWithPrice {
  const regPrice = quote.regularMarketPrice ?? 0;
  const prevClose = quote.regularMarketPreviousClose ?? regPrice;
  const changePercent =
    prevClose > 0 ? ((regPrice - prevClose) / prevClose) * 100 : 0;
  const sharesOut = quote.sharesOutstanding ?? 0;
  const marketCap = sharesOut > 0 ? regPrice * Number(sharesOut) : (quote.marketCap ?? regPrice * 1_000_000);

  return {
    id: quote.symbol,
    symbol: quote.symbol,
    name: stockInfo?.name ?? quote.shortName ?? quote.longName ?? quote.symbol,
    sector: stockInfo?.sector ?? "",
    faceValue: 0,
    isActive: true,
    sharesOutstanding: Number(sharesOut),
    currentPrice: regPrice,
    previousClose: prevClose,
    changePercent,
    marketCap: Number(marketCap),
    volume: quote.regularMarketVolume ?? 0,
    lastUpdated: new Date().toISOString(),
  };
}

export async function fetchStockDetail(symbol: string): Promise<StockDetail | null> {
  const stockInfo = getStockBySymbol(symbol);
  if (!stockInfo) return null;

  const quote = await fetchQuote(symbol);
  if (!quote || !quote.regularMarketPrice) {
    return {
      id: symbol,
      symbol,
      name: stockInfo.name,
      sector: stockInfo.sector,
      faceValue: 0,
      isActive: true,
      sharesOutstanding: 0,
      currentPrice: 0,
      previousClose: 0,
      changePercent: 0,
      marketCap: 0,
      volume: 0,
      lastUpdated: new Date().toISOString(),
      keyStats: {
        ttmEps: 0, ttmPe: 0, pbRatio: 0, sectorPe: 0, bookValue: 0,
        dividendYield: 0, beta: 0, avgVolume20d: 0, avgDeliveryPct20d: 0,
        upperCircuit: 0, lowerCircuit: 0,
      },
    };
  }

  const base = mapQuoteToStockWithPrice(quote, stockInfo);
  const stats = quoteSummaryToKeyStats(quote);
  stats.upperCircuit = Number((base.currentPrice * 1.2).toFixed(2));
  stats.lowerCircuit = Number((base.currentPrice * 0.8).toFixed(2));

  try {
    const statData = await yahooFinance.quoteSummary(symbol, { modules: ["defaultKeyStatistics"] }) as any;
    if (statData?.defaultKeyStatistics) {
      const ks = statData.defaultKeyStatistics;
      if (ks.trailingPE ?? ks.forwardPE) {
        stats.ttmPe = Number(ks.trailingPE ?? ks.forwardPE);
      }
      if (ks.priceToBook) stats.pbRatio = Number(ks.priceToBook);
      if (ks.dividendYield) {
        const raw = Number(ks.dividendYield);
        stats.dividendYield = raw > 100 ? raw / 100 : raw;
      }
      if (ks.beta) stats.beta = Number(ks.beta);
      if (ks.earningsPerShare) stats.ttmEps = Number(ks.earningsPerShare);
    }
  } catch {}

  if (stats.ttmPe === 0 && stats.ttmEps > 0 && base.currentPrice > 0) {
    stats.ttmPe = Number((base.currentPrice / stats.ttmEps).toFixed(2));
  }
  if (stats.beta === 0) stats.beta = 1.0;
  if (!stats.sectorPe || stats.sectorPe === 0) stats.sectorPe = 0;

  return { ...base, keyStats: stats };
}

export async function fetchHistoricalPrices(
  symbol: string,
  range: "1d" | "1m" | "1y" | "5d" = "1d"
): Promise<{ prices: PricePoint[]; isWeekend: boolean; chartDate: string }> {
  const cacheKey = `${symbol}:${range}`;
  const cached = historyCache.get(cacheKey);
  if (cached) {
    return { prices: cached, isWeekend: isWeekend(), chartDate: new Date().toISOString() };
  }

  const ist = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  let period1: Date;
  let interval: string;

  switch (range) {
    case "1d":
      period1 = getLastTradingDay();
      interval = "5m";
      break;
    case "5d":
      period1 = new Date(ist.getTime() - 5 * 24 * 60 * 60 * 1000);
      interval = "15m";
      break;
    case "1m":
      period1 = new Date(ist.getTime() - 30 * 24 * 60 * 60 * 1000);
      interval = "1d";
      break;
    case "1y":
    default:
      period1 = new Date(ist.getTime() - 365 * 24 * 60 * 60 * 1000);
      interval = "1d";
      break;
  }

  try {
    let raw: any[] = [];

    if (range === "1d" || range === "5d") {
      const result = await yahooFinance.chart(symbol, {
        period1,
        interval: interval as any,
      });
      raw = result.quotes ?? [];
    } else {
      const result = await yahooFinance.historical(symbol, {
        period1,
        interval: interval as any,
      }) as any[];
      raw = Array.isArray(result) ? result : [];
    }

    const prices: PricePoint[] = raw
      .filter((r: any) => r && r.close != null)
      .map((r: any) => ({
        timestamp: new Date(r.date).toISOString(),
        price: Number(r.close),
        volume: Number(r.volume ?? 0),
      }));

    historyCache.set(cacheKey, prices, HISTORY_TTL);

    return {
      prices,
      isWeekend: isWeekend(),
      chartDate: period1.toISOString(),
    };
  } catch {
    return { prices: [], isWeekend: isWeekend(), chartDate: new Date().toISOString() };
  }
}

export interface StockNewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: number;
  thumbnail?: string;
}

export async function getStockNews(symbol: string): Promise<StockNewsItem[]> {
  const cacheKey = `news:${symbol}`;
  const cached = newsCache.get(cacheKey);
  if (cached) return cached as StockNewsItem[];

  const baseSymbol = symbol.replace(".NS", "");
  const stockInfo = getStockBySymbol(symbol);
  const query = stockInfo
    ? `${stockInfo.name} ${baseSymbol} NSE share`
    : `${baseSymbol} NSE stock`;

  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    const xml = await res.text();

    const items: StockNewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      if (items.length >= 5) break;
      const c = match[1];
      const titleRaw = c.match(/<title>(.*?)<\/title>/)?.[1]?.trim();
      if (!titleRaw) continue;
      const title = titleRaw.replace(/^<!\[CDATA\[|\]\]>$/g, "");
      const link = c.match(/<link>([^<]*)<\/link>/)?.[1] ?? "";
      const pubDate = c.match(/<pubDate>([^<]*)<\/pubDate>/)?.[1] ?? "";
      const source = c.match(/<source[^>]*>([^<]*)<\/source>/)?.[1] ?? "Google News";

      items.push({
        title,
        publisher: source,
        link,
        publishedAt: pubDate ? new Date(pubDate).getTime() : Date.now(),
        thumbnail: undefined,
      });
    }

    newsCache.set(cacheKey, items, NEWS_TTL);
    return items;
  } catch {
    return [];
  }
}

export async function searchStocks(query: string) {
  if (!query || query.length < 1) return [];
  const cached = searchCache.get(query);
  if (cached) return cached;

  const localResults = query
    ? nseStocks.filter(
        (s) =>
          s.symbol.toLowerCase().includes(query.toLowerCase()) ||
          s.name.toLowerCase().includes(query.toLowerCase())
      ).map((s) => ({
        symbol: s.symbol,
        name: s.name,
        sector: s.sector,
        exchange: "NSI",
        type: "EQUITY",
      }))
    : [];

  try {
    const results = await yahooFinance.search(query, {
      quotesCount: 10,
      newsCount: 0,
    }) as any;

    const yahooQuotes = (results.quotes ?? [])
      .filter((q: any) => q.symbol && q.quoteType === "EQUITY")
      .map((q: any) => {
        const stockInfo = getStockBySymbol(q.symbol);
        return {
          symbol: q.symbol,
          name: stockInfo?.name ?? q.shortname ?? q.longname ?? q.symbol,
          sector: stockInfo?.sector ?? "",
          exchange: q.exchange ?? "",
          type: q.quoteType,
        };
      });

    const seen = new Set<string>();
    const merged = [...localResults, ...yahooQuotes].filter((q) => {
      if (seen.has(q.symbol)) return false;
      seen.add(q.symbol);
      return true;
    });

    searchCache.set(query, merged, SEARCH_TTL);
    return merged;
  } catch {
    searchCache.set(query, localResults, SEARCH_TTL);
    return localResults;
  }
}

export async function fetchMarketMovers() {
  const symbols = nseStocks.map((s) => s.symbol);
  const quotes = await fetchQuotes(symbols);

  const stocks = symbols
    .map((sym) => {
      const q = quotes[sym];
      if (!q || q.regularMarketPrice == null) return null;
      const info = getStockBySymbol(sym);
      return mapQuoteToStockWithPrice(q, info ?? undefined);
    })
    .filter((s): s is StockWithPrice => s !== null);

  const gainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 10);
  const losers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 10);
  const mostActive = [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 10);

  return { gainers, losers, mostActive, totalStocks: stocks };
}

function quoteSummaryToKeyStats(quote: any): KeyStats {
  return {
    ttmEps: quote.epsTrailingTwelveMonths ?? 0,
    ttmPe: quote.trailingPE ?? 0,
    pbRatio: quote.priceToBook ?? 0,
    sectorPe: 0,
    bookValue: quote.bookValue ?? 0,
    dividendYield: quote.dividendYield ?? 0,
    beta: quote.beta ?? 0,
    avgVolume20d: quote.averageDailyVolume10Day ?? quote.averageVolume ?? 0,
    avgDeliveryPct20d: 0,
    upperCircuit: 0,
    lowerCircuit: 0,
  };
}

export async function fetchHistoricalMulti(
  symbols: string[],
  period1: Date,
  period2: Date
): Promise<Record<string, number[]>> {
  const cacheKey = `hist_multi_${period1.toISOString()}_${period2.toISOString()}`;
  const cached = multiHistoryCache.get(cacheKey);
  if (cached) return cached;

  const results: Record<string, number[]> = {};
  let minLen = Infinity;

  for (let i = 0; i < symbols.length; i += 5) {
    const batch = symbols.slice(i, i + 5);
    const promises = batch.map(async (sym) => {
      try {
        const data = await yahooFinance.chart(sym, {
          period1,
          period2,
          interval: "1d",
        });
        const prices = (data.quotes ?? [])
          .filter((q: any) => q && q.close != null)
          .map((q: any) => Number(q.close));
        return { symbol: sym, prices };
      } catch (err: any) {
        console.error(`[Yahoo] fetchHistoricalMulti(${sym}) failed:`, err?.message ?? err);
        return { symbol: sym, prices: [] };
      }
    });
    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      if (r.prices.length > 0 && r.prices.length < minLen) minLen = r.prices.length;
      results[r.symbol] = r.prices;
    }
  }

  if (minLen === Infinity || minLen === 0) {
    console.error("[Yahoo] fetchHistoricalMulti: no data returned for any symbol");
    return {};
  }

  for (const sym of symbols) {
    if (!results[sym] || results[sym].length === 0) {
      results[sym] = new Array(minLen).fill(100);
    } else if (results[sym].length > minLen) {
      results[sym] = results[sym].slice(0, minLen);
    }
  }

  multiHistoryCache.set(cacheKey, results, HISTORY_TTL);
  return results;
}
