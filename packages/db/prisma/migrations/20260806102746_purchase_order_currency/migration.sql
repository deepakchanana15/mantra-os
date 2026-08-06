-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "currencyId" TEXT;

-- CreateIndex
CREATE INDEX "purchase_orders_currencyId_idx" ON "purchase_orders"("currencyId");

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
