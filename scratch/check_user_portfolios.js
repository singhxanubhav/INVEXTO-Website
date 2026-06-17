const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId: 'd96ff77c-171b-4918-bb68-d82c1da8dfbe', inTournament: true },
    orderBy: { createdAt: 'desc' }
  });
  console.dir(portfolios);
}

main().finally(() => prisma.$disconnect());
