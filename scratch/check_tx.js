const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { portfolio: true }
  });
  console.dir(txs, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
