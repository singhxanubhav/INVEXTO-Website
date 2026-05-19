const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Delete any existing active tournament
  await prisma.tournament.deleteMany({ where: { status: "active" } });

  const t = await prisma.tournament.create({
    data: {
      startDate: start,
      endDate: end,
      status: "active",
      prizePool: { "1st": 50000, "2nd": 25000, "3rd": 10000 },
    },
  });
  console.log("Created tournament:", t.id, t.status);
  await prisma.$disconnect();
})();
