const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst({
    where: { name: 'Anubhav Singh' },
    include: { portfolios: true }
  });
  console.log(JSON.stringify(user.portfolios.map(p => ({
    id: p.id,
    inTournament: p.inTournament,
    tournamentId: p.tournamentId,
    createdAt: p.createdAt,
    cash: p.cashBalance,
  })), null, 2));
}

check().finally(() => prisma.$disconnect());
