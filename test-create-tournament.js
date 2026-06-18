const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const startDate = new Date();
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  
  try {
    const tournament = await prisma.tournament.create({
      data: {
        startDate,
        endDate,
        status: "active",
        prizePool: {
          "1": 500,
          "2": 300,
          "3": 150,
          "4": 50,
          "5": 25,
        },
      },
    });
    console.log("Success:", tournament.id);
  } catch (err) {
    console.error("Prisma error:", err);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
