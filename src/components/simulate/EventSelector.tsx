"use client";

import { useState, useEffect } from "react";
import type { SimEvent } from "@/src/types";
import { apiGet } from "@/src/lib/api";

interface Props {
  onSelect: (eventId: string) => void;
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
      <div className="flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-900/20 p-6 text-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Market Simulation</h1>
        <p className="mt-2 text-gray-400">
          Select a historical event and trade through it in real-time
        </p>
      </div>

      {confirmId && (
        <div className="mb-6 rounded-lg border border-amber-700 bg-amber-900/20 p-4 text-center">
          <p className="mb-3 text-amber-300">
            This simulation uses a fresh ₹1,00,000 balance. Your real portfolio
            is safe.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setConfirmId(null);
                onSelect(confirmId);
              }}
              className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-500"
            >
              Start Simulation
            </button>
            <button
              onClick={() => setConfirmId(null)}
              className="rounded-lg border border-gray-600 px-6 py-2 font-medium text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <button
            key={event.id}
            onClick={() => setConfirmId(event.id)}
            className="group rounded-xl border border-gray-700 bg-gray-900 p-5 text-left transition hover:border-emerald-600 hover:bg-gray-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  event.type === "crash"
                    ? "bg-red-900/40 text-red-400"
                    : "bg-green-900/40 text-green-400"
                }`}
              >
                {event.type === "crash" ? "CRASH" : "RALLY"}
              </span>
              <span className="text-xs text-gray-500">
                {event.durationDays} days
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400">
              {event.name}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {new Date(event.startRealDate).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              –{" "}
              {new Date(event.endRealDate).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="mt-2 text-sm text-gray-400">{event.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
