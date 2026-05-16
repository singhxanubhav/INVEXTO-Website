"use client";

import { useRouter } from "next/navigation";
import type { SimState } from "@/src/types";
import { calcSimPortfolioValue, STARTING_CASH } from "@/src/lib/simulation";
import { formatINR, formatPercent } from "@/lib/format";

interface Props {
  state: SimState;
  onTryAnother: () => void;
}

export default function ResultsModal({ state, onTryAnother }: Props) {
  const router = useRouter();
  const finalValue = calcSimPortfolioValue(state);
  const gainLoss = finalValue - STARTING_CASH;
  const gainLossPct = (gainLoss / STARTING_CASH) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6">
        <h2 className="mb-2 text-center text-2xl font-bold text-white">
          Simulation Complete
        </h2>
        <p className="mb-6 text-center text-sm text-gray-400">
          {state.eventName}
        </p>

        <div className="mb-6 rounded-lg bg-gray-800 p-4">
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400">Final Portfolio Value</p>
              <p className="text-xl font-bold text-white">
                {formatINR(finalValue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Starting Cash</p>
              <p className="text-xl font-bold text-white">
                {formatINR(STARTING_CASH)}
              </p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Total Gain / Loss</p>
            <p
              className={`text-2xl font-bold ${
                gainLoss >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {gainLoss >= 0 ? "+" : ""}
              {formatINR(gainLoss)} ({formatPercent(gainLossPct)})
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 font-semibold text-white">Trade History</h3>
          {state.transactions.length === 0 ? (
            <p className="text-sm text-gray-500">No trades were made.</p>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {state.transactions.map((tx, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded bg-gray-800 px-3 py-1.5 text-sm"
                >
                  <span className="text-gray-300">
                    Day {tx.day + 1}
                  </span>
                  <span className="font-medium text-white">{tx.symbol}</span>
                  <span
                    className={
                      tx.type === "buy" ? "text-green-400" : "text-red-400"
                    }
                  >
                    {tx.type === "buy" ? "BUY" : "SELL"} {tx.qty} @{" "}
                    {formatINR(tx.price)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onTryAnother}
            className="flex-1 rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-500"
          >
            Try Another Event
          </button>
          <button
            onClick={() => router.push("/portfolio")}
            className="flex-1 rounded-lg border border-gray-600 py-2.5 font-medium text-gray-300 hover:bg-gray-800"
          >
            Back to Portfolio
          </button>
        </div>
      </div>
    </div>
  );
}
