import cron from "node-cron";
import { prisma } from "@/src/lib/prisma";
import { fetchQuote } from "@/src/lib/yahoo-finance";

function getTodayInIST(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset);
}

function isLastDayOfMonth(date: Date): boolean {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d.getDate() === 1;
}

function getMonthName(date: Date): string {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function getCurrentMonthStart(): Date {
  const d = getTodayInIST();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function getCurrentMonthEnd(): Date {
  const d = getTodayInIST();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

async function createNewTournament() {
  const existing = await prisma.tournament.findFirst({
    where: { status: "active" },
  });
  if (existing) return;

  const now = getTodayInIST();
  const startDate = getCurrentMonthStart();
  const endDate = getCurrentMonthEnd();

  await prisma.tournament.create({
    data: {
      startDate,
      endDate,
      status: "active",
      prizePool: { first: 1000, second: 750, third: 500, fourth: 250, fifth: 250 },
    },
  });

  console.log(`[Cron] New tournament created for ${getMonthName(now)}`);
}

async function closeTournamentAndComputeWinners(tournamentId: string) {
  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId },
    include: { user: true },
  });

  if (registrations.length === 0) {
    console.log("[Cron] No registrations for tournament, skipping");
    return;
  }

  const results: { registrationId: string; userId: string; totalValue: number }[] = [];

  for (const reg of registrations) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: reg.userId, mode: "tournament", tournamentId },
      include: { holdings: { include: { stock: true } } },
    });

    if (!portfolio) {
      results.push({ registrationId: reg.id, userId: reg.userId, totalValue: 100000 });
      continue;
    }

    let stockValue = 0;
    for (const h of portfolio.holdings) {
      if (h.quantity <= 0) continue;
      let price = 0;
      try {
        const quote = await fetchQuote(h.stock.symbol);
        price = quote?.regularMarketPrice ? Number(quote.regularMarketPrice) : Number(h.avgBuyPrice);
      } catch {
        price = Number(h.avgBuyPrice);
      }
      stockValue += h.quantity * price;
    }

    const totalValue = stockValue + Number(portfolio.cashBalance);
    results.push({ registrationId: reg.id, userId: reg.userId, totalValue });
  }

  results.sort((a, b) => b.totalValue - a.totalValue);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  const prizePool = (tournament?.prizePool as Record<string, number>) || {};
  const prizeMap: Record<number, number> = {
    1: prizePool.first ?? 0,
    2: prizePool.second ?? 0,
    3: prizePool.third ?? 0,
    4: prizePool.fourth ?? 0,
    5: prizePool.fifth ?? 0,
  };

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const rank = i + 1;
    await prisma.tournamentRegistration.update({
      where: { id: r.registrationId },
      data: {
        finalRank: rank,
        finalValue: r.totalValue,
        prizeAmount: prizeMap[rank] ?? 0,
      },
    });
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "completed" },
  });

  console.log(`[Cron] Tournament ${tournamentId} closed. Winners:`);
  for (let i = 0; i < Math.min(5, results.length); i++) {
    const r = results[i];
    const reg = registrations.find((x) => x.id === r.registrationId);
    console.log(`  #${i + 1}: ${reg?.user?.name ?? "Unknown"} — ₹${r.totalValue.toFixed(2)}`);
  }
}

async function checkAndCloseTournament() {
  const today = getTodayInIST();
  if (!isLastDayOfMonth(today)) return;

  const tournament = await prisma.tournament.findFirst({
    where: { status: "active" },
  });

  if (!tournament) {
    console.log("[Cron] No active tournament to close");
    return;
  }

  await closeTournamentAndComputeWinners(tournament.id);
}

export function initCronJobs() {
  cron.schedule("0 0 1 * *", () => {
    createNewTournament().catch((err) =>
      console.error("[Cron] createNewTournament error:", err)
    );
  });

  cron.schedule("59 23 * * *", () => {
    checkAndCloseTournament().catch((err) =>
      console.error("[Cron] checkAndCloseTournament error:", err)
    );
  });

  console.log("[Cron] Tournament cron jobs initialized");
}
