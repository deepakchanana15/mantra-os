-- CreateEnum
CREATE TYPE "MarketingChannel" AS ENUM ('META', 'GOOGLE', 'BING');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'ERROR', 'DISCONNECTED');

-- CreateTable
CREATE TABLE "marketing_integrations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" "MarketingChannel" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'CONNECTED',
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "marketing_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_campaign_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" "MarketingChannel" NOT NULL,
    "externalCampaignId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "spend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "leads" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_campaign_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketing_integrations_organizationId_idx" ON "marketing_integrations"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_integrations_organizationId_channel_key" ON "marketing_integrations"("organizationId", "channel");

-- CreateIndex
CREATE INDEX "ad_campaign_metrics_organizationId_date_idx" ON "ad_campaign_metrics"("organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ad_campaign_metrics_organizationId_channel_externalCampaign_key" ON "ad_campaign_metrics"("organizationId", "channel", "externalCampaignId", "date");

-- AddForeignKey
ALTER TABLE "marketing_integrations" ADD CONSTRAINT "marketing_integrations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaign_metrics" ADD CONSTRAINT "ad_campaign_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

