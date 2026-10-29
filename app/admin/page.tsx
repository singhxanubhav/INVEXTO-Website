"use client";

import { useState, useEffect } from "react";
import { Shield, Users, Trophy, Loader2, Activity, Settings, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "next/navigation";
import { TournamentLiveMonitor } from "@/components/admin/TournamentLiveMonitor";
import { LiveTradesFeed } from "@/components/admin/LiveTradesFeed";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.isAdmin) {
      router.push("/");
    }
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
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Admin Command Center
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time tournament monitoring, live operations, and platform analytics
              </p>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/users"
            className="group rounded-2xl border border-emerald-800/30 bg-emerald-950/20 p-5 transition-all hover:border-emerald-700/50 hover:bg-emerald-950/40"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                Users Management
              </h2>
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Search all 2,000+ users, inspect holdings, audit UPIs & trades
            </p>
          </Link>

          <Link
            href="/admin/tournament"
            className="group rounded-2xl border border-amber-800/30 bg-amber-950/20 p-5 transition-all hover:border-amber-700/50 hover:bg-amber-950/40"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground group-hover:text-amber-400 transition-colors">
                Tournaments & Payouts
              </h2>
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Sync participants, edit tournament dates, record prize payouts
            </p>
          </Link>

          <Link
            href="/admin/analytics"
            className="group rounded-2xl border border-emerald-800/30 bg-emerald-950/20 p-5 transition-all hover:border-emerald-700/50 hover:bg-emerald-950/40"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                Web Analytics
              </h2>
              <BarChart3 className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Live visitors, country breakdowns, sessions, and pageviews
            </p>
          </Link>

          <Link
            href="/admin/settings"
            className="group rounded-2xl border border-emerald-800/30 bg-emerald-950/20 p-5 transition-all hover:border-emerald-700/50 hover:bg-emerald-950/40"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                System Settings
              </h2>
              <Settings className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              OTP verification, auto-enrollment toggle, Super Admin access
            </p>
          </Link>
        </div>

        {/* Live Tournament & Market Operations Monitor */}
        <TournamentLiveMonitor />

        {/* Real-time Trades Feed */}
        <LiveTradesFeed />
      </main>
    </>
  );
}
