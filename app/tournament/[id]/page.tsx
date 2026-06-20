import { cookies } from "next/headers";
import { Trophy, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { formatINR } from "@/lib/format";
import { TournamentRulesCard } from "@/components/tournament/TournamentRulesCard";
import { RegisterForm } from "@/components/tournament/RegisterForm";
import { prisma } from "@/src/lib/prisma";
import { verifyToken } from "@/src/lib/auth";
import { Top5LeaderboardPreview } from "@/src/components/tournament/Top5LeaderboardPreview";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("invexto_token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

async function getTournamentData(tournamentId: string, userId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament || (tournament.status !== "active" && tournament.status !== "completed")) {
    return null;
  }

  if (tournament.status === "completed") {
    return { isCompleted: true as const, tournamentId };
  }

  const [registration, totalParticipants, dbPortfolio] = await Promise.all([
    prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId,
        },
      },
    }),
    prisma.tournamentRegistration.count({
      where: { tournamentId },
    }),
    prisma.portfolio.findFirst({
      where: { userId, inTournament: true, tournamentId },
    })
  ]);

  let portfolio = null;
  let rank = null; // Currently not calculated dynamically here, to be fetched from leaderboard if needed

  if (registration && dbPortfolio) {
    portfolio = { cashBalance: Number(dbPortfolio.cashBalance) };
  }

  return {
    isCompleted: false as const,
    tournament,
    registration,
    portfolio,
    rank,
    totalParticipants,
  };
}

export default async function TournamentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  const data = await getTournamentData(id, userId);

  if (!data) {
    notFound();
  }

  if (data.isCompleted) {
    redirect(`/tournament/results/${data.tournamentId}`);
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/tournament"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tournaments
        </Link>

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
                      Stock holdings and rankings are visible on the full leaderboard.
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
