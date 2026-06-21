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

  redirect("/tournament");
}
