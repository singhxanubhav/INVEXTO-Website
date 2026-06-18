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

async function getAllPastTournaments() {
  return prisma.tournament.findMany({
    where: { status: "completed" },
    orderBy: { endDate: "desc" },
    include: {
      _count: { select: { registrations: true } }
    }
  });
}

async function getData(userId: string) {
  const tournament = await prisma.tournament.findFirst({
    where: { status: "active" },
  });

  const pastTournaments = await getAllPastTournaments();

  if (!tournament) {
    return { tournament: null, registration: null, portfolio: null, rank: null, totalParticipants: 0, pastTournaments };
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
    pastTournaments,
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
      </>
    );
  }

  const data = await getData(userId);



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

        </main>
        <TournamentHistoryList pastTournaments={data.pastTournaments} />
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
        </main>
        <TournamentHistoryList pastTournaments={data.pastTournaments} />
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
          <div className="mt-3 rounded-xl border border-amber-800/20 bg-amber-950/20 px-4 py-3">
            <p className="text-xs text-amber-400">
              🔒 You are locked in this tournament until{" "}
              {new Date(data.tournament.endDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}. Your portfolio is in tournament mode.
            </p>
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
      </main>
      <TournamentHistoryList pastTournaments={data.pastTournaments} />
    </>
  );
}

function TournamentHistoryList({ pastTournaments }: { pastTournaments: any[] }) {
  if (!pastTournaments || pastTournaments.length === 0) return null;

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16 pt-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900/30">
          <Trophy className="h-5 w-5 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Tournament History</h2>
      </div>

      <div className="flex flex-col gap-4">
        {pastTournaments.map((t) => (
          <div 
            key={t.id} 
            className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border border-emerald-800/30 bg-gradient-to-r from-emerald-950/40 to-gray-900/40 p-6 transition-all hover:border-emerald-700/50 hover:bg-emerald-900/20 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] overflow-hidden"
          >
            <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600/50 transition-all group-hover:w-1.5 group-hover:bg-emerald-400" />
            
            <div className="pl-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
                {new Date(t.startDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </p>
              <h3 className="text-lg font-bold text-white mb-1">
                {new Date(t.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — {new Date(t.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
                  {t._count.registrations} Participants
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="rounded bg-emerald-900/50 border border-emerald-800/50 px-2 py-0.5 text-[10px] font-medium text-emerald-300">COMPLETED</span>
              </div>
            </div>

            <Link
              href={`/tournament/results/${t.id}`}
              className="mt-5 sm:mt-0 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600/10 border border-emerald-600/20 px-5 py-2.5 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-600 hover:text-white"
            >
              View Full Results
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
