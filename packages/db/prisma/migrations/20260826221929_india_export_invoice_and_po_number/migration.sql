-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_customerId_fkey";

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "lutArn" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "carriageBy" TEXT,
ADD COLUMN     "consigneeCompanyId" TEXT,
ADD COLUMN     "consigneePhone" TEXT,
ADD COLUMN     "countryOfOrigin" TEXT,
ADD COLUMN     "exchangeRate" DECIMAL(10,4),
ADD COLUMN     "exportUnderLut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "flightOrVesselNumber" TEXT,
ADD COLUMN     "freightTerms" TEXT,
ADD COLUMN     "gstRate" DECIMAL(5,2),
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "placeOfReceipt" TEXT,
ADD COLUMN     "portOfDischarge" TEXT,
ADD COLUMN     "portOfLoading" TEXT,
ADD COLUMN     "purchaseOrderId" TEXT,
ALTER COLUMN "customerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "hsnCode" TEXT;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "poNumber" TEXT;

-- CreateIndex
CREATE INDEX "invoices_consigneeCompanyId_idx" ON "invoices"("consigneeCompanyId");

-- CreateIndex
CREATE INDEX "invoices_purchaseOrderId_idx" ON "invoices"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_organizationId_poNumber_key" ON "purchase_orders"("organizationId", "poNumber");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_consigneeCompanyId_fkey" FOREIGN KEY ("consigneeCompanyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

