import { Trophy, Users, Calendar, IndianRupee } from "lucide-react";
import { formatINR } from "@/lib/format";

interface Props {
  tournament: {
    startDate: string;
    endDate: string;
    prizePool: Record<string, unknown>;
  };
  totalParticipants: number;
}

export function TournamentRulesCard({ tournament, totalParticipants }: Props) {
  const startStr = new Date(tournament.startDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const endStr = new Date(tournament.endDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const prizes = [
    { rank: "1st", amount: (tournament.prizePool as any)?.first ?? 1000 },
    { rank: "2nd", amount: (tournament.prizePool as any)?.second ?? 750 },
    { rank: "3rd", amount: (tournament.prizePool as any)?.third ?? 500 },
    { rank: "4th", amount: (tournament.prizePool as any)?.fourth ?? 250 },
    { rank: "5th", amount: (tournament.prizePool as any)?.fifth ?? 250 },
  ];

  return (
    <div className="rounded-2xl border border-emerald-800/30 bg-gradient-to-br from-emerald-900/30 to-emerald-950/30 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/20">
          <Trophy className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Monthly Tournament</h2>
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            {startStr} – {endStr}
          </p>
        </div>
      </div>

      <div className="mb-5 space-y-3 rounded-xl border border-emerald-800/20 bg-emerald-950/30 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Starting Capital</span>
          <span className="font-semibold text-white">{formatINR(100000)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-gray-400">
            <Users className="h-3.5 w-3.5" />
            Participants
          </span>
          <span className="font-semibold text-white">{totalParticipants}</span>
        </div>
        <div className="border-t border-emerald-800/20 pt-3 text-xs text-gray-500">
          Simulate Events are disabled during the tournament month.
        </div>
      </div>

      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-400/70">
        Prize Pool
      </h3>
      <div className="space-y-1.5">
        {prizes.map((p, i) => (
          <div
            key={p.rank}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              i === 0
                ? "bg-amber-500/10 text-amber-300"
                : "text-gray-300"
            }`}
          >
            <span className="font-medium">{p.rank}</span>
            <span className="flex items-center gap-1 font-semibold">
              <IndianRupee className="h-3 w-3" />
              {p.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
