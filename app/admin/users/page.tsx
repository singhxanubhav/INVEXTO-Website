"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Shield,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  Users,
  Eye,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";
import { UserDetailModal } from "@/components/admin/UserDetailModal";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  upiId: string | null;
  isAdmin: boolean;
  isDuplicateUpi: boolean;
  createdAt: string;
  portfolio: {
    cashBalance: number;
    totalHoldings: number;
    totalTrades: number;
    inTournament: boolean;
  } | null;
  tournamentRegistrations: {
    tournamentId: string;
    registeredAt: string;
    finalRank: number | null;
    prizeAmount: number | null;
  }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [duplicateUpiCount, setDuplicateUpiCount] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      filter,
    });
    if (search.trim()) params.set("search", search.trim());

    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setUsers(json.data.users);
          setTotal(json.data.total);
          setTotalPages(json.data.totalPages);
          if (json.data.duplicateUpiCount !== undefined) {
            setDuplicateUpiCount(json.data.duplicateUpiCount);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, limit, search, filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1); // reset to page 1 on search
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1); // reset to page 1 on filter
  };

  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  return (
    <>
      <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">User Management</h1>
                <p className="text-xs text-muted-foreground">
                  {total.toLocaleString()} total registered users in Invexto
                </p>
              </div>
            </div>
          </div>

          <a
            href="/api/admin/tournament/export?type=users"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Export Users CSV
          </a>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-emerald-800/30 pb-3">
          <button
            onClick={() => handleFilterChange("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === "all"
                ? "bg-emerald-600 text-white"
                : "text-muted-foreground hover:bg-emerald-950/40 hover:text-foreground"
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => handleFilterChange("active")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === "active"
                ? "bg-emerald-600 text-white"
                : "text-muted-foreground hover:bg-emerald-950/40 hover:text-foreground"
            }`}
          >
            Active Traders (Placed Trades)
          </button>
          <button
            onClick={() => handleFilterChange("missing_upi")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === "missing_upi"
                ? "bg-emerald-600 text-white"
                : "text-muted-foreground hover:bg-emerald-950/40 hover:text-foreground"
            }`}
          >
            Missing UPI ID
          </button>
          <button
            onClick={() => handleFilterChange("duplicate_upi")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${
              filter === "duplicate_upi"
                ? "bg-red-600 text-white"
                : "text-red-400 hover:bg-red-950/30"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            Duplicate UPI Flagged {duplicateUpiCount > 0 && `(${duplicateUpiCount})`}
          </button>
          <button
            onClick={() => handleFilterChange("admin")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === "admin"
                ? "bg-emerald-600 text-white"
                : "text-muted-foreground hover:bg-emerald-950/40 hover:text-foreground"
            }`}
          >
            Admins
          </button>
        </div>

        {/* Search & Page Limit Bar */}
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search across all users by name, email, or UPI..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-emerald-950/30 border-emerald-800/30 pl-9 text-xs"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-muted-foreground">
            <span>
              Showing <strong className="text-foreground">{startIdx}-{endIdx}</strong> of{" "}
              <strong className="text-foreground">{total.toLocaleString()}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-emerald-800/30 bg-emerald-950/40 px-2 py-1 text-xs text-foreground outline-none"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl bg-emerald-800/20" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground rounded-2xl border border-dashed border-emerald-800/20">
            No users match the criteria
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-emerald-800/30 bg-gray-950/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-emerald-800/30 bg-emerald-950/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">UPI ID</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-right">Cash Balance</th>
                  <th className="px-4 py-3 text-center">Trades</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-800/10">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className="cursor-pointer transition-colors hover:bg-emerald-900/20"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{u.name}</span>
                        {u.isAdmin && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                            Admin
                          </span>
                        )}
                        {u.isDuplicateUpi && (
                          <span
                            title="Same UPI used on multiple accounts"
                            className="flex items-center gap-0.5 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-400"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Dup UPI
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.upiId ? (
                        <span className="font-mono">{u.upiId}</span>
                      ) : (
                        <span className="text-gray-600 italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-400 text-xs">
                      {u.portfolio ? formatINR(u.portfolio.cashBalance) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {u.portfolio?.totalTrades ? (
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-300">
                          {u.portfolio.totalTrades}
                        </span>
                      ) : (
                        <span className="text-gray-600">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserId(u.id);
                        }}
                        className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Page <strong className="text-foreground">{page}</strong> of{" "}
              <strong className="text-foreground">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 border-emerald-800/30 text-xs"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  let pNum = page;
                  if (page <= 3) pNum = idx + 1;
                  else if (page >= totalPages - 2) pNum = totalPages - 4 + idx;
                  else pNum = page - 2 + idx;

                  if (pNum < 1 || pNum > totalPages) return null;

                  return (
                    <Button
                      key={pNum}
                      variant={page === pNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pNum)}
                      className={`h-8 w-8 p-0 text-xs ${
                        page === pNum
                          ? "bg-emerald-600 text-white"
                          : "border-emerald-800/30 text-muted-foreground"
                      }`}
                    >
                      {pNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 border-emerald-800/30 text-xs"
              >
                Next
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* User Detail Inspection Modal */}
      <UserDetailModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </>
  );
}
