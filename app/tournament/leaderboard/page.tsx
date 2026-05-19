"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Trophy, RefreshCw, Clock, Users, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { formatINR, formatPercent } from "@/lib/format";
import { useAuth } from "@/src/hooks/useAuth";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  totalValue: number;
  unrealizedGain: number;
  unrealizedGainPct: number;
  prizeAmount: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  totalParticipants: number;
  lastUpdated: string;
  tournament: { startDate: string; endDate: string; prizePool: Record<string, unknown> } | null;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/tournament/leaderboard");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setSecondsAgo(0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const refreshInterval = setInterval(fetchLeaderboard, 3 * 60 * 1000);
    const tickInterval = setInterval(() => {
      setSecondsAgo((s) => s + 1);
    }, 1000);
    return () => {
      clearInterval(refreshInterval);
      clearInterval(tickInterval);
    };
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      </>
    );
  }

  const tournamentPeriod = data?.tournament
    ? `${new Date(data.tournament.startDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })} – ${new Date(data.tournament.endDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`
    : null;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
            {tournamentPeriod && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {tournamentPeriod}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <RefreshCw className="h-3 w-3" />
              {secondsAgo}s ago
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchLeaderboard();
              }}
              className="rounded-lg bg-emerald-700/30 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-700/50 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {data?.totalParticipants ? (
          <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" />
            {data.totalParticipants} participant{data.totalParticipants !== 1 ? "s" : ""}
          </div>
        ) : null}

        {!data || data.leaderboard.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-emerald-800/20 py-16">
            <Trophy className="h-10 w-10 text-gray-700" />
            <p className="text-sm text-gray-600">
              No participants yet. Be the first to register!
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-emerald-800/30 bg-gradient-to-br from-emerald-900/20 to-gray-950">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-emerald-800/20 text-[10px] font-medium uppercase tracking-widest text-gray-500">
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-right">Portfolio Value</th>
                    <th className="px-4 py-3 text-right">Gain / Loss</th>
                    <th className="px-4 py-3 text-right">Gain %</th>
                    <th className="px-4 py-3 text-right">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leaderboard.map((entry) => {
                    const isCurrentUser = user && entry.userId === user.id;
                    const isGainer = entry.unrealizedGain >= 0;
                    const rankBg =
                      entry.rank === 1
                        ? "bg-amber-500/5"
                        : entry.rank === 2
                          ? "bg-gray-300/5"
                          : entry.rank === 3
                            ? "bg-orange-500/5"
                            : "";
                    const rankIcon =
                      entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;

                    return (
                      <tr
                        key={entry.userId}
                        className={`border-t border-emerald-800/10 transition hover:bg-emerald-800/10 ${
                          isCurrentUser ? "border-l-2 border-l-amber-500 bg-emerald-800/20" : ""
                        } ${rankBg}`}
                      >
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 font-mono text-sm font-bold text-white">
                            {rankIcon ? (
                              <span className="text-base">{rankIcon}</span>
                            ) : (
                              `#${entry.rank}`
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-white">
                            {entry.name}
                            {isCurrentUser && (
                              <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                                YOU
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                          {formatINR(entry.totalValue)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono text-sm font-medium ${
                            isGainer ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          <span className="flex items-center justify-end gap-1">
                            {isGainer ? (
                              <TrendingUp className="h-3.5 w-3.5" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5" />
                            )}
                            {isGainer ? "+" : ""}
                            {formatINR(entry.unrealizedGain)}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono text-sm font-medium ${
                            isGainer ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {isGainer ? "+" : ""}
                          {formatPercent(entry.unrealizedGainPct)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-amber-400">
                          {entry.prizeAmount > 0 ? formatINR(entry.prizeAmount) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/tournament")}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Tournament
          </button>
        </div>
      </main>
    </>
  );
}
