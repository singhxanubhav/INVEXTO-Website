"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Search, RefreshCw, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StockCard } from "@/components/stocks/StockCard";
import type { StockWithPrice } from "@/src/types";

const sectors = [
  "All", "IT", "Banking", "FMCG", "Auto", "Pharma",
  "Energy", "Telecom", "Infrastructure", "Metals", "Consumer",
];

const sortOptions = [
  { value: "symbol", label: "Symbol" },
  { value: "price", label: "Price ↓" },
  { value: "change", label: "% Change ↓" },
  { value: "marketCap", label: "Market Cap ↓" },
];

interface StockListProps {
  initialStocks: StockWithPrice[];
}

export function StockList({ initialStocks }: StockListProps) {
  const [stocks, setStocks] = useState<StockWithPrice[]>(initialStocks);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sector, setSector] = useState("All");
  const [sort, setSort] = useState("symbol");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setIsSearchResult(false);
    setSearchQuery("");
    try {
      const res = await fetch("/api/stocks");
      const json = await res.json();
      if (json.success) setStocks(json.data);
      setLastUpdated(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) return refresh();
    setSearching(true);
    setIsSearchResult(true);
    try {
      const res = await fetch(`/api/stocks?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) setStocks(json.data);
      setLastUpdated(new Date());
    } catch {
      // silent
    } finally {
      setSearching(false);
    }
  }, [refresh]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      doSearch(searchQuery);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchResult(false);
    refresh();
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialStocks.length === 0 && !isSearchResult) {
      refresh();
    }
  }, [initialStocks.length === 0]);

  const filtered = useMemo(() => {
    if (isSearchResult) return stocks;
    let result = [...stocks];
    if (sector !== "All") {
      result = result.filter((s) => s.sector === sector);
    }
    switch (sort) {
      case "price":
        result.sort((a, b) => b.currentPrice - a.currentPrice);
        break;
      case "change":
        result.sort((a, b) => b.changePercent - a.changePercent);
        break;
      case "marketCap":
        result.sort((a, b) => b.marketCap - a.marketCap);
        break;
      default:
        result.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }
    return result;
  }, [stocks, sector, sort, isSearchResult]);

  const isLoading = loading || searching;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search any stock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-emerald-900/30 pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          onClick={() => doSearch(searchQuery)}
          disabled={!searchQuery.trim() || searching}
          className="h-9 bg-emerald-600 text-white hover:bg-emerald-500"
        >
          {searching ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center gap-2">
          {!isSearchResult && (
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-800/30 bg-emerald-900/30 px-3 text-sm text-foreground hover:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition-colors"
              >
                {sortOptions.find((o) => o.value === sort)?.label}
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 overflow-hidden rounded-lg border border-emerald-800/30 bg-emerald-950 shadow-xl shadow-black/40 z-50">
                  {sortOptions.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => { setSort(o.value); setDropdownOpen(false); }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        sort === o.value
                          ? "bg-amber-500 text-emerald-950 font-medium"
                          : "text-gray-300 hover:bg-amber-500/20 hover:text-amber-300"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            disabled={isLoading}
            className="border-emerald-800/30"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {!isSearchResult && (
        <div className="flex flex-wrap gap-2">
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => setSector(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                sector === s
                  ? "bg-amber-500 text-emerald-950"
                  : "bg-emerald-800/30 text-emerald-300/80 hover:bg-emerald-800/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {isSearchResult ? "Search results" : `${filtered.length} stock${filtered.length !== 1 ? "s" : ""} shown`}
        </span>
          {mounted && lastUpdated && (
            <span>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-4"
            >
              <Skeleton className="mb-2 h-4 w-3/4 bg-emerald-800/40" />
              <Skeleton className="mb-3 h-3 w-1/4 bg-emerald-800/40" />
              <Skeleton className="h-6 w-1/2 bg-emerald-800/40" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 && mounted ? (
        <div className="py-16 text-center text-muted-foreground">
          No stocks match your {isSearchResult ? "search" : "filters"}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((stock) => (
            <StockCard key={stock.id} stock={stock} />
          ))}
        </div>
      )}
    </div>
  );
}
