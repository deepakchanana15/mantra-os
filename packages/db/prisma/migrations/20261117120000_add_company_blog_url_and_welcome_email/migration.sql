-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "blogUrl" TEXT;

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "welcomeEmailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "welcomeEmailSentAt" TIMESTAMP(3);
