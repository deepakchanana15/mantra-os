-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "organization_settings" ADD COLUMN     "codePrefix" TEXT NOT NULL DEFAULT 'ORG';

-- CreateTable
CREATE TABLE "daily_business_code_counters" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_business_code_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_business_code_counters_organizationId_scope_dateKey_key" ON "daily_business_code_counters"("organizationId", "scope", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "customers_organizationId_code_key" ON "customers"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_organizationId_code_key" ON "opportunities"("organizationId", "code");

-- AddForeignKey
ALTER TABLE "daily_business_code_counters" ADD CONSTRAINT "daily_business_code_counters_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
