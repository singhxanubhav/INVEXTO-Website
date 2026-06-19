import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { portfolios: true }
    });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      return;
    }

    const portfolioIds = user.portfolios.map(p => p.id);
    console.log(`Found user ${email} with ${portfolioIds.length} portfolios. Deleting...`);

    // Using a transaction ensures either everything gets deleted or nothing does
    await prisma.$transaction([
      // 1. Delete holdings & transactions associated with user's portfolios
      prisma.holding.deleteMany({ where: { portfolioId: { in: portfolioIds } } }),
      prisma.transaction.deleteMany({ where: { portfolioId: { in: portfolioIds } } }),
      
      // 2. Delete simulation snapshots (linked to user and portfolio)
      prisma.simulationSnapshot.deleteMany({ where: { userId: user.id } }),
      
      // 3. Delete tournament registrations
      prisma.tournamentRegistration.deleteMany({ where: { userId: user.id } }),
      
      // 4. Delete prize payments
      prisma.prizePayment.deleteMany({ where: { userId: user.id } }),
      
      // 5. Delete the portfolios themselves
      prisma.portfolio.deleteMany({ where: { userId: user.id } }),
      
      // 6. Finally, delete the user
      prisma.user.delete({ where: { id: user.id } })
    ]);

    console.log(`✅ Successfully deleted user ${email} and all related data!`);
  } catch (error) {
    console.error("❌ Error deleting user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line args
const emailArg = process.argv[2];
if (!emailArg) {
  console.error("Please provide an email address to delete.");
  console.log("Usage: npx tsx scripts/delete-user.ts <email>");
  process.exit(1);
}

deleteUserByEmail(emailArg);
