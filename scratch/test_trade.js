const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) return console.log("No user");

  const tournament = await prisma.tournament.findFirst({ where: { status: "active" } });
  if (!tournament) return console.log("No tournament");

  const portfolio = await prisma.portfolio.findFirst({
    where: { userId: user.id, inTournament: true, tournamentId: tournament.id }
  });

  if (!portfolio) return console.log("No tournament portfolio");

  const stock = await prisma.stock.findFirst();
  if (!stock) return console.log("No stock");

  console.log("Found portfolio:", portfolio.id, "balance:", portfolio.cashBalance.toString());

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.portfolio.update({
        where: { id: portfolio.id },
        data: { cashBalance: { decrement: 100 } },
      });
      console.log("Updated balance:", updated.cashBalance.toString());

      await tx.transaction.create({
        data: {
          portfolioId: portfolio.id,
          stockId: stock.id,
          type: "buy",
          quantity: 1,
          price: 100,
          total: 100,
        },
      });
    });
    console.log("Transaction committed!");
  } catch (err) {
    console.error("Transaction failed:", err);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
