"use client";

import { useState, useEffect, Fragment } from "react";
import { Search, ChevronDown, ChevronUp, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  upiId: string | null;
  isAdmin: boolean;
  createdAt: string;
  portfolio: { cashBalance: number; totalHoldings: number; inTournament: boolean } | null;
  tournamentRegistrations: { tournamentId: string; registeredAt: string; finalRank: number | null; prizeAmount: number | null }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setUsers(json.data.users);
          setTotal(json.data.total);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="mt-2 flex items-center gap-3">
          <Shield className="h-6 w-6 text-amber-400" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Users</h1>
            <p className="text-sm text-muted-foreground">{total} total users</p>
          </div>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-emerald-900/30 pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl bg-emerald-800/30" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No users found</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-emerald-800/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-emerald-800/30 bg-emerald-900/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">UPI</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cash</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">In Tournament</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <Fragment key={u.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                    className="cursor-pointer border-b border-emerald-800/20 transition-colors hover:bg-emerald-900/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {u.name}
                        {u.isAdmin && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.upiId || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {u.portfolio ? formatINR(u.portfolio.cashBalance) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.portfolio?.inTournament ? (
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">Yes</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </td>
                  </tr>
                  {expandedId === u.id && (
                    <tr key={`${u.id}-expanded`}>
                      <td colSpan={6} className="bg-emerald-950/30 px-6 py-4">
                        <div className="text-sm text-muted-foreground">
                          <p className="mb-2 font-medium text-foreground">Tournament Registrations</p>
                          {u.tournamentRegistrations.length === 0 ? (
                            <p className="text-xs text-muted-foreground/60">No tournament history</p>
                          ) : (
                            <div className="space-y-1">
                              {u.tournamentRegistrations.map((r, i) => (
                                <div key={i} className="flex items-center gap-4 text-xs">
                                  <span>Registered: {new Date(r.registeredAt).toLocaleDateString("en-IN")}</span>
                                  {r.finalRank !== null && <span>Rank: #{r.finalRank}</span>}
                                  {r.prizeAmount !== null && <span className="text-amber-400">Prize: {formatINR(r.prizeAmount)}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
