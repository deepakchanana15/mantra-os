-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "brochureSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "brochureSentAt" TIMESTAMP(3);
