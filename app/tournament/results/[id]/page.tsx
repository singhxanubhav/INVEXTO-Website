"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Medal, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { formatINR } from "@/lib/format";

interface ResultEntry {
  rank: number;
  name: string;
  finalValue: number;
  prizeAmount: number;
}

interface ResultsData {
  tournament: { startDate: string; endDate: string };
  totalParticipants: number;
  results: ResultEntry[];
}

export default function TournamentResultsPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<ResultsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/tournament/results/${params.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setError(json.error);
      })
      .catch(() => setError("Failed to load results"));
  }, [params.id]);

  if (error) {
    return (
      <>
        <Navbar />
        <main className="relative mx-auto max-w-3xl px-4 py-16 text-center">
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-4 z-20 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <p className="text-gray-500">{error}</p>
          <Link href="/tournament" className="mt-4 inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300">
            <ArrowLeft className="h-4 w-4" /> Back to Tournament
          </Link>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <main className="relative mx-auto max-w-3xl px-4 py-16 text-center">
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-4 z-20 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-500" />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="relative mx-auto max-w-4xl px-4 py-8">
        <button
          onClick={() => { if (window.history.length > 1) router.back(); else router.push("/tournament"); }}
          className="absolute left-4 top-4 z-20 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-8 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Tournament Results</h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(data.tournament.startDate).toLocaleDateString()} —{" "}
            {new Date(data.tournament.endDate).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-600">{data.totalParticipants} participants</p>
        </div>

        <div className="space-y-2">
          {data.results.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center justify-between rounded-xl border border-emerald-800/20 bg-emerald-950/20 px-5 py-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center">
                  {entry.rank === 1 ? (
                    <Medal className="h-6 w-6 text-yellow-400" />
                  ) : entry.rank === 2 ? (
                    <Medal className="h-6 w-6 text-gray-300" />
                  ) : entry.rank === 3 ? (
                    <Medal className="h-6 w-6 text-amber-600" />
                  ) : (
                    <span className="text-sm font-bold text-gray-500">#{entry.rank}</span>
                  )}
                </div>
                <span className="font-medium text-white">{entry.name}</span>
              </div>
              <div className="flex items-center gap-6">
                {entry.prizeAmount > 0 && (
                  <span className="text-sm font-semibold text-emerald-400">
                    {formatINR(entry.prizeAmount)}
                  </span>
                )}
                <span className="font-mono text-sm text-gray-400">
                  {formatINR(entry.finalValue)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
