const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const t = await prisma.tournament.findMany({ where: { status: 'active' } });
  console.log(JSON.stringify(t.map(x => x.id), null, 2));
}

check().finally(() => prisma.$disconnect());
