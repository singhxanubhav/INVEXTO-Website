import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const t = await prisma.tournament.upsert({
    where: { id: "test-tournament" },
    update: {},
    create: {
      id: "test-tournament",
      startDate: start,
      endDate: end,
      status: "active",
      prizePool: { "1st": 50000, "2nd": 25000, "3rd": 10000 },
    },
  });
  console.log("Created:", t.id, t.status, t.startDate, t.endDate);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
