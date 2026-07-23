-- Product Company/Country scoping (currency derivation), Quote linked to
-- Opportunity, itemized InvoiceLine, SupportTicket assignment + SLA.
-- See DECISIONS.md for each.

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "countryId" TEXT;

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "opportunityId" TEXT;

-- AlterTable
ALTER TABLE "support_tickets" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "slaHours" INTEGER;

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_lines_organizationId_idx" ON "invoice_lines"("organizationId");

-- CreateIndex
CREATE INDEX "invoice_lines_invoiceId_idx" ON "invoice_lines"("invoiceId");

-- CreateIndex
CREATE INDEX "products_companyId_idx" ON "products"("companyId");

-- CreateIndex
CREATE INDEX "products_countryId_idx" ON "products"("countryId");

-- CreateIndex
CREATE INDEX "quotes_opportunityId_idx" ON "quotes"("opportunityId");

-- CreateIndex
CREATE INDEX "support_tickets_assignedToId_idx" ON "support_tickets"("assignedToId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

