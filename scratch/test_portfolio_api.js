const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  console.log("User:", user.id);

  // simulate what /api/portfolio does
  const tournament = await prisma.tournament.findFirst({ where: { status: "active" } });
  
  let portfolio = await prisma.portfolio.findFirst({
    where: { userId: user.id, inTournament: true, tournamentId: { not: null } },
    orderBy: { createdAt: "desc" },
    include: {
      holdings: { include: { stock: true } },
      transactions: true,
    },
  });

  console.log("Found tournament portfolio ID:", portfolio?.id);
  console.log("Found tournament portfolio cash:", portfolio?.cashBalance?.toString());
  console.log("Holdings count:", portfolio?.holdings.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
