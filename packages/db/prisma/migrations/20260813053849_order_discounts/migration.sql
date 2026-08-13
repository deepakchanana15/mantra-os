-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "discountAmount" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "discountAmount" DECIMAL(12,2);
