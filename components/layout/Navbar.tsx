"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Menu, X, LayoutDashboard, Briefcase, Gamepad2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/src/hooks/useAuth";

const navLinks = [
  { href: "/stocks", label: "Stocks", icon: LayoutDashboard },
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

            <div className="hidden items-center gap-3 md:flex">
              <span className="text-sm text-emerald-300/70">{user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-emerald-700/50 text-emerald-200 hover:bg-emerald-800 hover:text-white"
              >
                Logout
              </Button>
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
        ) : null}
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
            <hr className="border-emerald-800/40" />
            <div className="px-3 py-2 text-xs text-emerald-300/70">
              {user.name}
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
