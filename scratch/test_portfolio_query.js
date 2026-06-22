const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const activeTournament = await prisma.tournament.findFirst({
    where: { status: "active" }
  });
  
  const user = await prisma.user.findFirst({ where: { name: 'Anubhav Singh' } });

  const where = {
    userId: user.id,
    inTournament: true,
    tournamentId: activeTournament ? activeTournament.id : { not: null }
  };

  console.log("WHERE:", where);

  const portfolio = await prisma.portfolio.findFirst({
    where,
    orderBy: { createdAt: "desc" },
    include: { holdings: true }
  });

  console.log("FOUND PORTFOLIO:", portfolio?.id, portfolio?.cashBalance, portfolio?.holdings.length);
}

check().finally(() => prisma.$disconnect());
