-- CreateEnum
CREATE TYPE "OpportunitySource" AS ENUM ('MANUAL', 'WEBSITE', 'META_LEAD_AD', 'WHATSAPP');

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "externalLeadId" TEXT,
ADD COLUMN     "source" "OpportunitySource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- CreateTable
CREATE TABLE "lead_intake_keys" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "lead_intake_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_intake_keys_key_key" ON "lead_intake_keys"("key");

-- CreateIndex
CREATE INDEX "lead_intake_keys_organizationId_idx" ON "lead_intake_keys"("organizationId");

-- CreateIndex
CREATE INDEX "lead_intake_keys_companyId_idx" ON "lead_intake_keys"("companyId");

-- AddForeignKey
ALTER TABLE "lead_intake_keys" ADD CONSTRAINT "lead_intake_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_intake_keys" ADD CONSTRAINT "lead_intake_keys_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

