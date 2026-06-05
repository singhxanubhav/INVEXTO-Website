import { cookies } from "next/headers";
import { Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { formatINR } from "@/lib/format";
import { TournamentRulesCard } from "@/components/tournament/TournamentRulesCard";
import { RegisterForm } from "@/components/tournament/RegisterForm";
import { CountdownTimer } from "@/components/tournament/CountdownTimer";
import { prisma } from "@/src/lib/prisma";
import { verifyToken } from "@/src/lib/auth";
import { TournamentAdminPanel } from "@/components/tournament/TournamentAdminPanel";

function getNextMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function getNextMonthName(): string {
  const d = getNextMonthStart();
  return d.toLocaleString("en-US", { month: "long" });
}

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("invexto_token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

async function getLatestPastTournament() {
  return prisma.tournament.findFirst({
    where: { status: "completed" },
    orderBy: { endDate: "desc" },
  });
}

async function getData(userId: string) {
  const tournament = await prisma.tournament.findFirst({
    where: { status: "active" },
  });

  if (!tournament) {
    const latest = await getLatestPastTournament();
    return { tournament: null, registration: null, portfolio: null, rank: null, totalParticipants: 0, latestPastTournament: latest };
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      tournamentId_userId: {
        tournamentId: tournament.id,
        userId,
      },
    },
  });

  const totalParticipants = await prisma.tournamentRegistration.count({
    where: { tournamentId: tournament.id },
  });

  let portfolio = null;
  let rank = null;

  if (registration) {
    const dbPortfolio = await prisma.portfolio.findFirst({
      where: { userId, inTournament: true, tournamentId: tournament.id },
    });
    if (dbPortfolio) {
      portfolio = { cashBalance: Number(dbPortfolio.cashBalance) };
    }
  }

  return {
    tournament,
    registration,
    portfolio,
    rank,
    totalParticipants,
    latestPastTournament: null,
  };
}

export default async function TournamentPage() {
  const userId = await getUserId();

  if (!userId) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-600" />
          <h1 className="mb-2 text-xl font-bold text-white">Login to join</h1>
          <p className="mb-6 text-sm text-gray-500">Sign in to participate in tournaments</p>
          <Link
            href="/login?redirect=/tournament"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-500"
          >
            Login
          </Link>
        </main>
        <div className="mx-auto max-w-md px-4">
          <TournamentAdminPanel />
        </div>
      </>
    );
  }

  const data = await getData(userId);

  const lastTournament = data.latestPastTournament
    ? {
        id: data.latestPastTournament.id,
        endDate: data.latestPastTournament.endDate.toISOString(),
      }
    : null;

  const nextMonth = getNextMonthStart();
  const nextMonthName = getNextMonthName();

  if (!data.tournament) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-900/30">
            <Trophy className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">
            No active tournament right now
          </h1>
          <p className="mb-2 text-sm text-gray-500">
            Next tournament starts on the 1<sup>st</sup> of {nextMonthName}
          </p>
          <div className="my-8 flex justify-center">
            <CountdownTimer targetDate={nextMonth} />
          </div>
          {lastTournament && (
            <Link
              href={`/tournament/results/${lastTournament.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View Previous Results
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <TournamentAdminPanel />
        </main>
      </>
    );
  }

  if (!data.registration) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">Tournament</h1>
            <p className="mt-1 text-sm text-gray-500">
              Compete with others for real prizes
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <TournamentRulesCard
              tournament={{
                startDate: data.tournament.startDate.toISOString(),
                endDate: data.tournament.endDate.toISOString(),
                prizePool: data.tournament.prizePool as Record<string, unknown>,
              }}
              totalParticipants={data.totalParticipants}
            />
            <RegisterForm tournamentId={data.tournament.id} />
          </div>
          <TournamentAdminPanel />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 rounded-2xl border border-emerald-700/30 bg-emerald-900/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600/20">
                <Trophy className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  You are registered!
                </p>
                <p className="text-xs text-gray-500">
                  {data.rank
                    ? `You are ranked #${data.rank} of ${data.totalParticipants} participants`
                    : `${data.totalParticipants} participants`}
                </p>
              </div>
            </div>
            <Link
              href="/tournament/leaderboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
            >
              View Leaderboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-800/30 bg-gradient-to-br from-emerald-900/20 to-gray-950 p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Your Portfolio</h2>
          {data.portfolio ? (
            <div className="rounded-xl border border-emerald-800/20 bg-emerald-950/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Cash Balance</span>
                <span className="text-lg font-bold text-emerald-400">
                  {formatINR(data.portfolio.cashBalance)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading...</p>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/tournament/leaderboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            View Full Leaderboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <TournamentAdminPanel />
      </main>
    </>
  );
}
