"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { formatINR } from "@/lib/format";
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
}

interface Props {
  tournamentId: string;
}

export function Top5LeaderboardPreview({ tournamentId }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournament/leaderboard/${tournamentId}?t=${Date.now()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchLeaderboard();
    const refreshInterval = setInterval(fetchLeaderboard, 3 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-emerald-800/30 bg-gradient-to-br from-emerald-900/20 to-gray-950 p-6 md:p-8 animate-pulse">
        <h3 className="mb-6 text-xl font-bold text-white">Top 5 Leaderboard</h3>
        <div className="h-48 rounded-xl bg-emerald-900/20"></div>
      </div>
    );
  }

  const top5 = data?.leaderboard.slice(0, 5) || [];

  return (
    <div className="rounded-2xl border border-emerald-800/30 bg-gradient-to-br from-emerald-900/20 to-gray-950 p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          Top 5 Leaderboard
        </h3>
      </div>

      {top5.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-800/20 py-8">
          <p className="text-sm text-gray-500">No entries yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-emerald-800/30 bg-gray-950/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-emerald-800/20 text-[10px] font-medium uppercase tracking-widest text-gray-500 bg-emerald-950/30">
                <th className="px-4 py-3 text-left w-16">Rank</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-right">Profit / Loss</th>
              </tr>
            </thead>
            <tbody>
              {top5.map((entry) => {
                const isCurrentUser = user && entry.userId === user.id;
                const isGainer = entry.unrealizedGain >= 0;
                const rankIcon = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;

                return (
                  <tr
                    key={entry.userId}
                    className={`border-t border-emerald-800/10 transition hover:bg-emerald-800/10 ${
                      isCurrentUser ? "border-l-2 border-l-amber-500 bg-emerald-800/20" : ""
                    }`}
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
                    <td
                      className={`px-4 py-3 text-right font-mono text-sm font-medium ${
                        isGainer ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {isGainer ? "+" : ""}
                      {formatINR(entry.unrealizedGain)}
                      <span className="ml-1.5 text-[10px]">
                        ({isGainer ? "+" : ""}
                        {entry.unrealizedGainPct.toFixed(2)}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
