-- DropForeignKey
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_customerId_fkey";

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "leadEmail" TEXT,
ADD COLUMN     "leadName" TEXT,
ADD COLUMN     "leadPhone" TEXT,
ALTER COLUMN "customerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

