const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting tournament participant synchronization...");

  const activeTournament = await prisma.tournament.findFirst({
    where: { status: "active" },
  });

  if (!activeTournament) {
    console.log("No active tournament found. Exiting.");
    return;
  }

  console.log(`Active tournament ID: ${activeTournament.id} (${activeTournament.startDate.toISOString()} - ${activeTournament.endDate.toISOString()})`);

  const totalUsers = await prisma.user.count();
  console.log(`Total users in system: ${totalUsers}`);

  const allUsers = await prisma.user.findMany({
    select: { id: true },
  });

  // 1. Existing registrations
  const existingRegistrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId: activeTournament.id },
    select: { userId: true },
  });
  const registeredUserIds = new Set(existingRegistrations.map((r) => r.userId));
  console.log(`Already registered in active tournament: ${registeredUserIds.size}`);

  const usersToRegister = allUsers.filter((u) => !registeredUserIds.has(u.id));
  console.log(`Users needing registration: ${usersToRegister.length}`);

  const CHUNK_SIZE = 1000;
  if (usersToRegister.length > 0) {
    const registrationData = usersToRegister.map((u) => ({
      id: crypto.randomUUID(),
      tournamentId: activeTournament.id,
      userId: u.id,
      registeredAt: new Date(),
    }));

    for (let i = 0; i < registrationData.length; i += CHUNK_SIZE) {
      const chunk = registrationData.slice(i, i + CHUNK_SIZE);
      const res = await prisma.tournamentRegistration.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      console.log(`Registered chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${res.count} users`);
    }
  }

  // 2. Existing portfolios
  const existingPortfolios = await prisma.portfolio.findMany({
    where: { tournamentId: activeTournament.id },
    select: { userId: true },
  });
  const portfolioUserIds = new Set(existingPortfolios.map((p) => p.userId));
  console.log(`Already have tournament portfolio: ${portfolioUserIds.size}`);

  const usersNeedPortfolio = allUsers.filter((u) => !portfolioUserIds.has(u.id));
  console.log(`Users needing tournament portfolio: ${usersNeedPortfolio.length}`);

  if (usersNeedPortfolio.length > 0) {
    const portfolioData = usersNeedPortfolio.map((u) => ({
      id: crypto.randomUUID(),
      userId: u.id,
      inTournament: true,
      tournamentId: activeTournament.id,
      cashBalance: 100000,
      createdAt: new Date(),
    }));

    for (let i = 0; i < portfolioData.length; i += CHUNK_SIZE) {
      const chunk = portfolioData.slice(i, i + CHUNK_SIZE);
      const res = await prisma.portfolio.createMany({
        data: chunk,
      });
      console.log(`Created portfolio chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${res.count} portfolios`);
    }
  }

  const finalParticipantCount = await prisma.tournamentRegistration.count({
    where: { tournamentId: activeTournament.id },
  });

  const finalPortfolioCount = await prisma.portfolio.count({
    where: { tournamentId: activeTournament.id },
  });

  console.log("-----------------------------------------");
  console.log("SYNCHRONIZATION COMPLETE!");
  console.log(`Total users in Invexto: ${totalUsers}`);
  console.log(`Active tournament participants: ${finalParticipantCount}`);
  console.log(`Active tournament portfolios: ${finalPortfolioCount}`);
  console.log("-----------------------------------------");
}

main()
  .catch((err) => {
    console.error("Sync error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
