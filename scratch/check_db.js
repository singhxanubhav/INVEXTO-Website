const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tourneys = await prisma.portfolio.findMany({
    where: { inTournament: true },
    select: { id: true, userId: true, cashBalance: true, _count: { select: { transactions: true, holdings: true } } }
  });
  console.dir(tourneys, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
