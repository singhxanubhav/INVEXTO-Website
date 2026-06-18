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
        <main className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex justify-start">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <p className="text-gray-500">{error}</p>
            <Link href="/tournament" className="mt-4 inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300">
              <ArrowLeft className="h-4 w-4" /> Back to Tournament
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <main className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex justify-start">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-start">
          <button
            onClick={() => { if (window.history.length > 1) router.back(); else router.push("/tournament"); }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-900/20 border border-amber-500/20">
            <Trophy className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Tournament Results</h1>
            <p className="mt-1 text-sm text-gray-500">
              {new Date(data.tournament.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} —{" "}
              {new Date(data.tournament.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              <span className="mx-2">•</span>
              {data.totalParticipants} participants
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {data.results.map((entry, index) => (
            <div
              key={index}
              className="group relative flex flex-col sm:flex-row gap-6 sm:gap-0 items-start sm:items-center justify-between rounded-2xl border border-emerald-800/30 bg-gradient-to-r from-emerald-950/40 to-gray-900/40 px-6 py-5 transition-all hover:border-emerald-700/50 hover:bg-emerald-900/20 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] overflow-hidden"
            >
              <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600/30 transition-all group-hover:w-1.5 group-hover:bg-emerald-400" />
              
              <div className="flex items-center gap-5 pl-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800/50 border border-gray-700/50 shadow-inner">
                  {entry.rank === 1 ? (
                    <Medal className="h-7 w-7 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
                  ) : entry.rank === 2 ? (
                    <Medal className="h-7 w-7 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.4)]" />
                  ) : entry.rank === 3 ? (
                    <Medal className="h-7 w-7 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.4)]" />
                  ) : entry.rank ? (
                    <span className="text-base font-bold text-gray-400">#{entry.rank}</span>
                  ) : (
                    <span className="text-base font-bold text-gray-600">—</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white">{entry.name}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Participant</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-8 sm:pr-4">
                <div className="flex flex-col sm:items-end">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Final Portfolio</span>
                  <span className="font-mono text-lg font-semibold text-gray-200">
                    {formatINR(entry.finalValue)}
                  </span>
                </div>

                <div className="flex flex-col sm:items-end">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-500/80 font-bold mb-1">Prize Won</span>
                  {entry.prizeAmount > 0 ? (
                    <span className="text-base font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                      {formatINR(entry.prizeAmount)}
                    </span>
                  ) : (
                    <span className="text-base font-medium text-gray-600 py-1">—</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data.results.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500">
              No participants found or results are still being calculated.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
