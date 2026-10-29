"use client";

import { useState, useEffect } from "react";
import { Shield, ArrowLeft, Trophy, Loader2, Check, Users, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

interface TournamentData {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  prizePool: Record<string, number>;
  registrationCount: number;
  winners: { name: string; email: string; upiId: string | null; finalRank: number; prizeAmount: number | null }[];
}

export default function AdminTournamentPage() {
  const [tournaments, setTournaments] = useState<TournamentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [prizes, setPrizes] = useState({
    "1": 1000,
    "2": 750,
    "3": 500,
    "4": 250,
    "5": 250,
  });

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/tournament")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setTournaments(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const today = new Date();
    setNewStartDate(today.toISOString().split("T")[0]);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setNewEndDate(end.toISOString().split("T")[0]);
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: newStartDate, endDate: newEndDate, prizes }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Tournament created!");
        fetchData();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to create tournament");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = async (id: string) => {
    setClosingId(id);
    try {
      const res = await fetch("/api/tournament/close", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: id }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Tournament closed!");
        fetchData();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to close tournament");
    } finally {
      setClosingId(null);
    }
  };

  const handleSyncUsers = async (tournamentId: string) => {
    setSyncingId(tournamentId);
    try {
      const res = await fetch("/api/admin/tournament/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || "All users registered into tournament!");
        fetchData();
      } else {
        toast.error(json.error || "Failed to sync users");
      }
    } catch {
      toast.error("Failed to sync users");
    } finally {
      setSyncingId(null);
    }
  };

  const handleUpdateDates = async (id: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/tournament", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: id, startDate: editStartDate, endDate: editEndDate }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Tournament dates updated!");
        setEditingId(null);
        fetchData();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to update tournament dates");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePayout = async (userId: string, tournamentId: string, amount: number) => {
    try {
      const res = await fetch("/api/admin/tournament/payout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tournamentId, amount }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Payment recorded!");
        fetchData();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to process payout");
    }
  };

  const activeTournaments = tournaments.filter((t) => t.status === "active");

  return (
    <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="mt-2 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-amber-400" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Tournament Management</h1>
              <p className="text-sm text-muted-foreground">
                {tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""} total
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="rounded-lg border border-emerald-800/30 bg-emerald-950/30 px-3 py-2 text-sm text-foreground outline-none"
                  style={{ colorScheme: "dark" }}
                />
                <span className="text-muted-foreground text-sm">to</span>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="rounded-lg border border-emerald-800/30 bg-emerald-950/30 px-3 py-2 text-sm text-foreground outline-none"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-end gap-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full">
                {[1, 2, 3, 4, 5].map((rank) => (
                  <div key={rank} className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                      Rank {rank} (₹)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={prizes[rank.toString() as keyof typeof prizes] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setPrizes(prev => ({ ...prev, [rank.toString()]: val ? parseInt(val, 10) : 0 }));
                      }}
                      className="w-full rounded-lg border border-emerald-800/30 bg-emerald-950/50 px-2 py-1.5 text-xs text-foreground outline-none focus:border-emerald-500/50"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="bg-emerald-600 text-white hover:bg-emerald-500 shrink-0 h-10"
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trophy className="mr-2 h-4 w-4" />}
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl bg-emerald-800/30" />
          <Skeleton className="h-64 rounded-xl bg-emerald-800/30" />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No tournaments yet</div>
      ) : (
        <div className="space-y-8">
          {activeTournaments.map((activeTournament) => (
            <div key={activeTournament.id} className="rounded-xl border border-amber-800/30 bg-amber-900/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-foreground">Active Tournament</h2>
                <span className="ml-2 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">LIVE</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Period</p>
                  {editingId === activeTournament.id ? (
                    <div className="mt-1 flex flex-col gap-2">
                      <input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="w-full rounded-lg border border-amber-800/30 bg-amber-950/30 px-3 py-1.5 text-xs text-foreground outline-none"
                        style={{ colorScheme: "dark" }}
                      />
                      <input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="w-full rounded-lg border border-amber-800/30 bg-amber-950/30 px-3 py-1.5 text-xs text-foreground outline-none"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-foreground mt-1">
                      {new Date(activeTournament.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} —{" "}
                      {new Date(activeTournament.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Registrations</p>
                  <p className="text-sm font-medium text-foreground">{activeTournament.registrationCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prize Pool</p>
                  <p className="text-sm font-medium text-foreground">
                    {Object.entries(activeTournament.prizePool)
                      .map(([rank, amount]) => `#${rank}: ${formatINR(Number(amount))}`)
                      .join(" | ")}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                {editingId === activeTournament.id ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      className="border-amber-800/30 bg-transparent text-amber-500 hover:bg-amber-950/30 hover:text-amber-400"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleUpdateDates(activeTournament.id)}
                      disabled={updatingId === activeTournament.id}
                      className="bg-amber-600 text-white hover:bg-amber-500"
                    >
                      {updatingId === activeTournament.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save Dates
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(activeTournament.id);
                      setEditStartDate(activeTournament.startDate.split("T")[0]);
                      setEditEndDate(activeTournament.endDate.split("T")[0]);
                    }}
                    className="border-amber-800/30 bg-transparent text-amber-500 hover:bg-amber-950/30 hover:text-amber-400"
                  >
                    Edit Dates
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSyncUsers(activeTournament.id)}
                  disabled={syncingId === activeTournament.id}
                  className="border-emerald-700/50 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300"
                >
                  {syncingId === activeTournament.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="mr-2 h-4 w-4" />
                  )}
                  {syncingId === activeTournament.id ? "Syncing..." : "Sync All Users"}
                </Button>
                <a
                  href={`/api/admin/tournament/export?type=participants&tournamentId=${activeTournament.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/50 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </a>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleClose(activeTournament.id)}
                  disabled={closingId === activeTournament.id}
                  className="bg-red-900/40 text-red-400 hover:bg-red-900/60 border border-red-800/30"
                >
                  {closingId === activeTournament.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {closingId === activeTournament.id ? "Closing..." : "Close Tournament"}
                </Button>
              </div>
            </div>
          ))}

          {tournaments.map((t) => (
            <div key={t.id} className="rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    Tournament: {new Date(t.startDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} —{" "}
                    {new Date(t.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}
                    {t.registrationCount} registrations
                    {" · "}
                    <span className={t.status === "active" ? "text-amber-400" : "text-muted-foreground"}>
                      {t.status.toUpperCase()}
                    </span>
                  </p>
                </div>
                {t.status === "completed" && (
                  <a
                    href={`/api/admin/tournament/export?type=winners&tournamentId=${t.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/30 bg-emerald-950/40 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-900/40 transition"
                  >
                    <Download className="h-3 w-3" />
                    Export Winners CSV
                  </a>
                )}
              </div>

              {t.status === "completed" && t.winners.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-medium text-foreground">Winners & Payouts</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-emerald-800/20">
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Rank</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">UPI ID</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Prize</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.winners.map((w) => (
                          <tr key={w.finalRank} className="border-b border-emerald-800/10">
                            <td className="px-3 py-2 font-medium text-foreground">#{w.finalRank}</td>
                            <td className="px-3 py-2 text-muted-foreground">{w.name}</td>
                            <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{w.upiId || "—"}</td>
                            <td className="px-3 py-2 text-right font-medium text-amber-400">
                              {w.prizeAmount ? formatINR(w.prizeAmount) : "—"}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {w.prizeAmount ? (
                                <button
                                  onClick={() => handlePayout(t.id, t.id, w.prizeAmount!)}
                                  className="inline-flex items-center gap-1 rounded bg-emerald-600/20 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                                >
                                  <Check className="h-3 w-3" />
                                  Mark as Paid
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
