const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: {
      email: {
        in: ["kshitijvaishnav4@gmail.com", "anubhavsinghbkj@gmail.com"],
      },
    },
    data: {
      emailVerified: true,
      isAdmin: true,
    },
  });
  console.log("Updated admins to be verified.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
