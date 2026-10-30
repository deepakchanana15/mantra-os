-- CreateTable
CREATE TABLE "ad_campaign_demographics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" "MarketingChannel" NOT NULL,
    "externalCampaignId" TEXT NOT NULL,
    "ageRange" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "lifetimeSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lifetimeImpressions" INTEGER NOT NULL DEFAULT 0,
    "lifetimeClicks" INTEGER NOT NULL DEFAULT 0,
    "lifetimeLeads" INTEGER NOT NULL DEFAULT 0,
    "last30dSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "last30dImpressions" INTEGER NOT NULL DEFAULT 0,
    "last30dClicks" INTEGER NOT NULL DEFAULT 0,
    "last30dLeads" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_campaign_demographics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_campaign_regions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" "MarketingChannel" NOT NULL,
    "externalCampaignId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "lifetimeSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lifetimeImpressions" INTEGER NOT NULL DEFAULT 0,
    "lifetimeClicks" INTEGER NOT NULL DEFAULT 0,
    "lifetimeLeads" INTEGER NOT NULL DEFAULT 0,
    "last30dSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "last30dImpressions" INTEGER NOT NULL DEFAULT 0,
    "last30dClicks" INTEGER NOT NULL DEFAULT 0,
    "last30dLeads" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_campaign_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_campaign_targeted_cities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" "MarketingChannel" NOT NULL,
    "externalCampaignId" TEXT NOT NULL,
    "cityKey" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "regionName" TEXT,
    "countryCode" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_campaign_targeted_cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_campaign_demographics_organizationId_idx" ON "ad_campaign_demographics"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ad_campaign_demographics_organizationId_channel_externalCam_key" ON "ad_campaign_demographics"("organizationId", "channel", "externalCampaignId", "ageRange", "gender");

-- CreateIndex
CREATE INDEX "ad_campaign_regions_organizationId_idx" ON "ad_campaign_regions"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ad_campaign_regions_organizationId_channel_externalCampaign_key" ON "ad_campaign_regions"("organizationId", "channel", "externalCampaignId", "region");

-- CreateIndex
CREATE INDEX "ad_campaign_targeted_cities_organizationId_idx" ON "ad_campaign_targeted_cities"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ad_campaign_targeted_cities_organizationId_channel_external_key" ON "ad_campaign_targeted_cities"("organizationId", "channel", "externalCampaignId", "cityKey");

-- AddForeignKey
ALTER TABLE "ad_campaign_demographics" ADD CONSTRAINT "ad_campaign_demographics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaign_regions" ADD CONSTRAINT "ad_campaign_regions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaign_targeted_cities" ADD CONSTRAINT "ad_campaign_targeted_cities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

