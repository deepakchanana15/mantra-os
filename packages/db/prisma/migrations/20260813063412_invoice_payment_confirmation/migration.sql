-- AlterEnum
ALTER TYPE "AttachmentEntityType" ADD VALUE 'INVOICE';

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paidBy" TEXT;
