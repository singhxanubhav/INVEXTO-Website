"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";

export function HeroSection() {
  const [tournamentActive, setTournamentActive] = useState(false);
  const [tournamentEndDate, setTournamentEndDate] = useState("");

  useEffect(() => {
    fetch("/api/tournament/status")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setTournamentActive(json.data.isActive);
          if (json.data.tournament?.endDate) {
            const d = new Date(json.data.tournament.endDate);
            setTournamentEndDate(
              d.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })
            );
          }
        }
      })
      .catch(() => {});
  }, []);

  const currentMonth = new Date()
    .toLocaleString("en-US", { month: "long" })
    .toUpperCase();

  return (
    <section className="relative flex flex-col items-center justify-center px-4 py-20 text-center sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.3_0.1_80/0.15)_0%,_transparent_70%)]" />
      <div className="relative z-10 max-w-3xl">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          The foundation for future investors
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Navigate through historic market crashes, trade virtual stocks, and
          compete in monthly tournaments.
        </p>
        <div className="mt-6">
          <Link
            href="/tournament"
            className="inline-flex items-center gap-2 text-lg font-bold text-amber-500 transition-colors hover:text-amber-400"
          >
            <Trophy className="h-5 w-5" />
            {tournamentActive
              ? `JOIN THE ${currentMonth} TOURNAMENT NOW!!`
              : tournamentEndDate
                ? `NEXT TOURNAMENT STARTS SOON`
                : `JOIN THE ${currentMonth} TOURNAMENT NOW!!`}
          </Link>
        </div>
      </div>
    </section>
  );
}
