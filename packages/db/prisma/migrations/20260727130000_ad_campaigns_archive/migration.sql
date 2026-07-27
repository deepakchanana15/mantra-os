-- CreateTable
CREATE TABLE "ad_campaigns" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" "MarketingChannel" NOT NULL,
    "externalCampaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "objective" TEXT,
    "dailyBudget" DECIMAL(12,2),
    "lifetimeBudget" DECIMAL(12,2),
    "startDate" TIMESTAMP(3),
    "stopDate" TIMESTAMP(3),
    "lifetimeSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lifetimeImpressions" INTEGER NOT NULL DEFAULT 0,
    "lifetimeClicks" INTEGER NOT NULL DEFAULT 0,
    "lifetimeReach" INTEGER,
    "last30dSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "last30dImpressions" INTEGER NOT NULL DEFAULT 0,
    "last30dClicks" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_campaigns_organizationId_idx" ON "ad_campaigns"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ad_campaigns_organizationId_channel_externalCampaignId_key" ON "ad_campaigns"("organizationId", "channel", "externalCampaignId");

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
