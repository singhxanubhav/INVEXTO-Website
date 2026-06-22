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
import { Top5LeaderboardPreview } from "@/src/components/tournament/Top5LeaderboardPreview";

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

async function getTournamentData(userId: string) {
  // Find the first active tournament
  const tournament = await prisma.tournament.findFirst({
    where: { status: "active" },
    orderBy: { startDate: "asc" },
  });

  if (!tournament) {
    return null;
  }

  const [registration, totalParticipants, dbPortfolio] = await Promise.all([
    prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: tournament.id,
          userId,
        },
      },
    }),
    prisma.tournamentRegistration.count({
      where: { tournamentId: tournament.id },
    }),
    prisma.portfolio.findFirst({
      where: { userId, inTournament: true, tournamentId: tournament.id },
    })
  ]);

  let portfolio = null;

  if (registration && dbPortfolio) {
    portfolio = { cashBalance: Number(dbPortfolio.cashBalance) };
  }

  return {
    tournament,
    registration,
    portfolio,
    totalParticipants,
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

  const data = await getTournamentData(userId);
  const nextMonth = getNextMonthStart();
  const nextMonthName = getNextMonthName();

  if (!data) {
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
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 mt-2 flex flex-wrap items-center justify-between gap-4 border-b border-emerald-900/30 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900/30">
              <Trophy className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">
                  {new Date(data.tournament.startDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" })} Tournament
                </h1>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                  LIVE
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(data.tournament.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} —{" "}
                {new Date(data.tournament.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {!data.registration ? (
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
        ) : (
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-emerald-700/30 bg-emerald-900/30 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-600/20">
                      <Trophy className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-emerald-300">
                        You are locked in!
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {data.totalParticipants} participants competing
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-800/30 bg-gradient-to-br from-emerald-900/20 to-gray-950 p-6 md:p-8">
                <h3 className="mb-6 text-xl font-bold text-white">Your Portfolio</h3>
                {data.portfolio ? (
                  <div className="rounded-xl border border-emerald-800/20 bg-emerald-950/30 p-6 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-sm text-gray-400 mb-1">Cash Balance</span>
                        <span className="text-3xl font-bold text-emerald-400">
                          {formatINR(data.portfolio.cashBalance)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-emerald-600/80 mt-4">
                      Top 5 rankings are visible on the leaderboard.
                    </p>
                  </div>
                ) : (
                  <div className="animate-pulse rounded-xl bg-emerald-900/20 h-24"></div>
                )}
              </div>
            </div>

            <div className="lg:col-span-3">
              <Top5LeaderboardPreview tournamentId={data.tournament.id} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
