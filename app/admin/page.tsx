"use client";

import { useState, useEffect } from "react";
import { Shield, Users, Trophy, Loader2 } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "next/navigation";

interface AdminStats {
  totalUsers: number;
  activeParticipants: number;
  activeTournament: { startDate: string; endDate: string } | null;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.isAdmin) {
      router.push("/");
      return;
    }

    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStats(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || (!user?.isAdmin && !authLoading)) {
    return (
      <>
        <Navbar />
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage users and tournaments
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Users</p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {loading ? "—" : stats?.totalUsers ?? 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <div className="rounded-xl border border-amber-800/30 bg-amber-900/20 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active Tournament Participants</p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {loading ? "—" : stats?.activeParticipants ?? 0}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-amber-400" />
            </div>
            {stats?.activeTournament && (
              <p className="mt-2 text-xs text-muted-foreground">
                Ongoing: {new Date(stats.activeTournament.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} —{" "}
                {new Date(stats.activeTournament.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/users"
            className="group rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-5 transition-all hover:border-emerald-700/50 hover:bg-emerald-900/40"
          >
            <h2 className="text-lg font-semibold text-foreground group-hover:text-amber-400 transition-colors">
              Users
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              View all registered users, their portfolios, and tournament history
            </p>
          </Link>
          <Link
            href="/admin/tournament"
            className="group rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-5 transition-all hover:border-emerald-700/50 hover:bg-emerald-900/40"
          >
            <h2 className="text-lg font-semibold text-foreground group-hover:text-amber-400 transition-colors">
              Tournament
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage tournaments, view registrations, process prize payouts
            </p>
          </Link>
          <Link
            href="/admin/analytics"
            className="group rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-5 transition-all hover:border-emerald-700/50 hover:bg-emerald-900/40"
          >
            <h2 className="text-lg font-semibold text-foreground group-hover:text-amber-400 transition-colors">
              Analytics
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor website traffic, visitors, top countries, and platform usage
            </p>
          </Link>
          <Link
            href="/admin/settings"
            className="group rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-5 transition-all hover:border-emerald-700/50 hover:bg-emerald-900/40"
          >
            <h2 className="text-lg font-semibold text-foreground group-hover:text-amber-400 transition-colors">
              Settings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage global authentication settings and Super Admin roles
            </p>
          </Link>
        </div>
      </main>
    </>
  );
}
