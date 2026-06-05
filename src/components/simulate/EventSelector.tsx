"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock, Gauge, AlertTriangle } from "lucide-react";
import type { SimEvent } from "@/src/types";
import { apiGet } from "@/src/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  onSelect: (eventId: string) => void;
}

const difficultyConfig: Record<string, { label: string; color: string; dots: number }> = {
  easy: { label: "Easy", color: "text-green-400", dots: 1 },
  medium: { label: "Medium", color: "text-amber-400", dots: 2 },
  hard: { label: "Hard", color: "text-red-400", dots: 3 },
};

function getDifficulty(days: number): string {
  if (days <= 10) return "easy";
  if (days <= 30) return "medium";
  return "hard";
}

export default function EventSelector({ onSelect }: Props) {
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    apiGet<SimEvent[]>("/api/simulations")
      .then((res) => {
        if (res.success && res.data) setEvents(res.data);
        else setError(res.error || "Failed to load events");
      })
      .catch(() => setError("Failed to load events"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="size-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading scenarios...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[80vh] items-center justify-center px-4">
          <div className="max-w-md rounded-2xl border border-red-800/40 bg-red-950/30 p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-800/40 bg-emerald-950/30 px-4 py-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">SIMULATION MODE</span>
          </div>
          <h1 className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
            Market Simulator
          </h1>
          <p className="mt-3 text-base text-gray-500">
            Pick a historical event and trade through it with virtual cash. Your decisions, your P&amp;L.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const diff = getDifficulty(event.durationDays);
            const cfg = difficultyConfig[diff];
            const isCrash = event.type === "crash";
            return (
              <button
                key={event.id}
                onClick={() => setConfirmId(event.id)}
                className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                  isCrash
                    ? "border-red-800/30 bg-gradient-to-br from-red-950/40 to-gray-900 hover:border-red-500/50 hover:shadow-red-900/20"
                    : "border-emerald-800/30 bg-gradient-to-br from-emerald-950/40 to-gray-900 hover:border-emerald-500/50 hover:shadow-emerald-900/20"
                }`}
              >
                <div className="absolute right-0 top-0 opacity-[0.03]">
                  {isCrash ? (
                    <TrendingDown className="h-32 w-32 text-red-500" />
                  ) : (
                    <TrendingUp className="h-32 w-32 text-emerald-500" />
                  )}
                </div>

                <div className="relative">
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        isCrash
                          ? "bg-red-900/40 text-red-300"
                          : "bg-emerald-900/40 text-emerald-300"
                      }`}
                    >
                      {isCrash ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {isCrash ? "MARKET CRASH" : "BULL RALLY"}
                    </span>

                    <div className="flex items-center gap-0.5" title={`${cfg.label} difficulty`}>
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full ${
                            i <= cfg.dots ? cfg.color : "bg-gray-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="mb-1.5 text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {event.name}
                  </h3>

                  <p className="mb-4 text-sm leading-relaxed text-gray-400 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.durationDays} days
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="h-3 w-3" />
                      {cfg.label}
                    </span>
                    <span>
                      {new Date(event.startRealDate).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={!!confirmId} onOpenChange={(open) => { if (!open) setConfirmId(null); }}>
        <DialogContent className="border-red-800/40 bg-gray-950 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Your portfolio will be temporarily wiped
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Starting this simulation will clear your current holdings and give you
              ₹1,00,000 to trade. When you end the simulation, your original portfolio
              will be fully restored. Do not close the browser mid-simulation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmId(null)}
              className="border-gray-700 text-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmId) {
                  onSelect(confirmId);
                  setConfirmId(null);
                }
              }}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              Start Simulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
