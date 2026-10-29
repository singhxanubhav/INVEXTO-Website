import { prisma } from "@/src/lib/prisma";
import { SimpleCache } from "@/src/lib/simple-cache";
import crypto from "crypto";

export async function isAutoTournamentEnrollmentEnabled(): Promise<boolean> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "autoTournamentEnrollment" },
  });
  return setting ? setting.value === "true" : true;
}

export async function enrollAllUsersInTournament(tournamentId: string) {
  const allUsers = await prisma.user.findMany({
    select: { id: true },
  });

  if (allUsers.length === 0) {
    return { enrolledCount: 0, totalParticipants: 0 };
  }

  // 1. Existing registrations
  const existingRegistrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId },
    select: { userId: true },
  });
  const registeredUserIds = new Set(existingRegistrations.map((r) => r.userId));

  const usersToRegister = allUsers.filter((u) => !registeredUserIds.has(u.id));

  const CHUNK_SIZE = 1000;
  if (usersToRegister.length > 0) {
    const registrationData = usersToRegister.map((u) => ({
      id: crypto.randomUUID(),
      tournamentId,
      userId: u.id,
      registeredAt: new Date(),
    }));

    for (let i = 0; i < registrationData.length; i += CHUNK_SIZE) {
      const chunk = registrationData.slice(i, i + CHUNK_SIZE);
      await prisma.tournamentRegistration.createMany({
        data: chunk,
        skipDuplicates: true,
      });
    }
  }

  // 2. Existing portfolios for this tournament
  const existingPortfolios = await prisma.portfolio.findMany({
    where: { tournamentId },
    select: { userId: true },
  });
  const portfolioUserIds = new Set(existingPortfolios.map((p) => p.userId));

  const usersNeedPortfolio = allUsers.filter((u) => !portfolioUserIds.has(u.id));

  if (usersNeedPortfolio.length > 0) {
    const portfolioData = usersNeedPortfolio.map((u) => ({
      id: crypto.randomUUID(),
      userId: u.id,
      inTournament: true,
      tournamentId,
      cashBalance: 100000,
      createdAt: new Date(),
    }));

    for (let i = 0; i < portfolioData.length; i += CHUNK_SIZE) {
      const chunk = portfolioData.slice(i, i + CHUNK_SIZE);
      await prisma.portfolio.createMany({
        data: chunk,
      });
    }
  }

  // Invalidate any cached leaderboard / hot stocks
  SimpleCache.del(`tournament:leaderboard:${tournamentId}`);
  SimpleCache.del("hot-stocks");

  const totalParticipants = await prisma.tournamentRegistration.count({
    where: { tournamentId },
  });

  return {
    enrolledCount: usersToRegister.length,
    totalParticipants,
  };
}

export async function ensureUserTournamentEnrollment(userId: string, tournamentId: string) {
  let registered = false;

  const existingReg = await prisma.tournamentRegistration.findUnique({
    where: {
      tournamentId_userId: {
        tournamentId,
        userId,
      },
    },
  });

  if (!existingReg) {
    await prisma.tournamentRegistration.create({
      data: {
        id: crypto.randomUUID(),
        tournamentId,
        userId,
      },
    });
    registered = true;
  }

  const existingPortfolio = await prisma.portfolio.findFirst({
    where: {
      userId,
      inTournament: true,
      tournamentId,
    },
  });

  if (!existingPortfolio) {
    await prisma.portfolio.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        inTournament: true,
        tournamentId,
        cashBalance: 100000,
      },
    });
    registered = true;
  }

  if (registered) {
    SimpleCache.del(`tournament:leaderboard:${tournamentId}`);
    SimpleCache.del("hot-stocks");
  }

  return true;
}
