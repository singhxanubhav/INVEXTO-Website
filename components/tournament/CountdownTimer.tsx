"use client";

import { useState, useEffect } from "react";

interface Props {
  targetDate: Date;
}

export function CountdownTimer({ targetDate }: Props) {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    const tick = () => {
      setDiff(Math.max(0, targetDate.getTime() - Date.now()));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return (
    <div className="flex items-center gap-2 font-mono text-2xl font-bold tracking-wider text-white">
      <span className="min-w-[2ch] text-right">{days}</span>
      <span className="text-gray-600">d</span>
      <span className="min-w-[2ch] text-right">{String(hours).padStart(2, "0")}</span>
      <span className="text-gray-600">:</span>
      <span className="min-w-[2ch] text-right">{String(minutes).padStart(2, "0")}</span>
      <span className="text-gray-600">:</span>
      <span className="min-w-[2ch] text-right">{String(seconds).padStart(2, "0")}</span>
    </div>
  );
}
