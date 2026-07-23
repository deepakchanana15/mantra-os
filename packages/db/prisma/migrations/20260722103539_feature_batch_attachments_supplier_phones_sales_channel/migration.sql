-- Feature batch: polymorphic Attachment (multi-document uploads for
-- Goods Receipt + Expense, replacing the single receiptFileUrl field),
-- SupplierPhone (multiple phone numbers with a primary flag), and
-- SalesOrder channel tracking (Online/Offline + sub-fields).

-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "OnlineChannelType" AS ENUM ('WEBSITE_STORE', 'MARKETPLACE');

-- CreateEnum
CREATE TYPE "OfflineChannelType" AS ENUM ('WALK_IN', 'PHONE_ORDER', 'WHATSAPP', 'EMAIL', 'SALES_REPRESENTATIVE', 'DISTRIBUTOR_DEALER', 'EXHIBITION_TOURNAMENT');

-- CreateEnum
CREATE TYPE "AttachmentEntityType" AS ENUM ('GOODS_RECEIPT', 'EXPENSE');

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "receiptFileUrl";

-- AlterTable
ALTER TABLE "goods_receipts" DROP COLUMN "receiptFileUrl";

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "offlineChannelType" "OfflineChannelType",
ADD COLUMN     "onlineChannelType" "OnlineChannelType",
ADD COLUMN     "orderReference" TEXT,
ADD COLUMN     "salesChannel" "SalesChannel";

-- CreateTable
CREATE TABLE "supplier_phones" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "supplier_phones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" "AttachmentEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_phones_organizationId_idx" ON "supplier_phones"("organizationId");

-- CreateIndex
CREATE INDEX "supplier_phones_supplierId_idx" ON "supplier_phones"("supplierId");

-- CreateIndex
CREATE INDEX "attachments_organizationId_idx" ON "attachments"("organizationId");

-- CreateIndex
CREATE INDEX "attachments_entityType_entityId_idx" ON "attachments"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "sales_orders_salesChannel_idx" ON "sales_orders"("salesChannel");

-- AddForeignKey
ALTER TABLE "supplier_phones" ADD CONSTRAINT "supplier_phones_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_phones" ADD CONSTRAINT "supplier_phones_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

