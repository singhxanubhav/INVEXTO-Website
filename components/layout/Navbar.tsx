"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Menu, X, LayoutDashboard, Briefcase, Gamepad2, Trophy, BookOpen, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/src/hooks/useAuth";

const navLinks = [
  { href: "/stocks", label: "Stocks", icon: LayoutDashboard },
  { href: "/dictionary", label: "Dictionary", icon: BookOpen },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/simulate", label: "Simulate", icon: Gamepad2 },
  { href: "/tournament", label: "Tournament", icon: Trophy },
];

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tournamentActive, setTournamentActive] = useState(false);

  useEffect(() => {
    fetch("/api/tournament/status")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setTournamentActive(json.data.isActive);
      })
      .catch(() => {});
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-emerald-800/40 bg-emerald-950/95 backdrop-blur supports-[backdrop-filter]:bg-emerald-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-amber-400" />
          <span className="text-xl font-bold tracking-tight text-white">
            INVEXTO
          </span>
        </Link>

        {!loading && user ? (
          <>
            <div className="hidden items-center md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative flex h-9 w-24 items-center justify-center rounded-lg text-sm font-medium text-emerald-100/80 transition-colors hover:bg-emerald-800/50 hover:text-white"
                >
                  {link.label}
                  {link.label === "Tournament" && tournamentActive && (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex items-center rounded bg-amber-500 px-1 py-0.5 text-[9px] font-bold leading-none text-white">
                      LIVE
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <div className="hidden items-center md:flex ml-4">
              <div className="relative group">
                {/* Avatar Button */}
                <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 text-sm font-bold text-white shadow-lg ring-2 ring-emerald-500/20 transition-all hover:scale-105 hover:ring-emerald-400/40">
                  {user.name ? user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
                </div>
                
                {/* Invisible hover bridge to prevent menu from closing when moving mouse */}
                <div className="absolute top-full right-0 w-full h-3"></div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-[calc(100%+8px)] w-56 origin-top-right rounded-xl border border-emerald-800/40 bg-emerald-950/95 p-2 shadow-2xl backdrop-blur opacity-0 invisible transition-all group-hover:visible group-hover:opacity-100 group-hover:-translate-y-1 z-50">
                  <div className="px-3 py-2 border-b border-emerald-800/40 mb-2 pb-3">
                    <p className="text-sm font-medium text-emerald-50">{user.name}</p>
                    <p className="text-[10px] text-emerald-400/80 uppercase tracking-wider mt-0.5">
                      {(user as any).isAdmin ? "Administrator" : "User Account"}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    {(user as any).isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-800/50 hover:text-white transition-colors"
                      >
                        <Shield className="h-4 w-4 text-emerald-400" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-emerald-100 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </>
        ) : !loading ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              asChild
              className="text-emerald-100/80 hover:bg-emerald-800/50 hover:text-white"
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button
              asChild
              className="bg-amber-500 text-emerald-950 hover:bg-amber-400"
            >
              <Link href="/register">Register</Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="hidden h-9 w-20 animate-pulse rounded-lg bg-emerald-800/20 md:block"></div>
            <div className="h-10 w-10 animate-pulse rounded-full bg-emerald-800/30"></div>
          </div>
        )}
      </div>

      {!loading && user && mobileOpen && (
        <div className="border-t border-emerald-800/40 md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-emerald-100/80 hover:bg-emerald-800/50 hover:text-white"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
                {link.label === "Tournament" && tournamentActive && (
                  <span className="ml-auto rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    LIVE
                  </span>
                )}
              </Link>
            ))}
            {(user as any).isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-emerald-800/50 hover:text-white"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            <hr className="border-emerald-800/40" />
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800/50 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-700/50">
                {user.name ? user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
              </div>
              <div className="text-sm font-medium text-emerald-100">
                {user.name}
              </div>
            </div>
            <button
              onClick={() => {
                setMobileOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-emerald-100/80 hover:bg-emerald-800/50 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
