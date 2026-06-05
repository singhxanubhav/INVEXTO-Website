-- AlterTable
ALTER TABLE "Portfolio" DROP COLUMN "mode",
ADD COLUMN     "inTournament" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "PortfolioMode";
