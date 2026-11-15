-- CreateEnum
CREATE TYPE "StorefrontSiteStatus" AS ENUM ('ACTIVE', 'COMING_SOON');

-- CreateTable
CREATE TABLE "storefront_sites" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "domain" TEXT,
    "locale" TEXT,
    "currencyCode" TEXT,
    "databaseUrl" TEXT NOT NULL,
    "cloudinaryCloudName" TEXT,
    "cloudinaryApiKey" TEXT,
    "cloudinaryApiSecret" TEXT,
    "status" "StorefrontSiteStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "storefront_sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storefront_sites_organizationId_idx" ON "storefront_sites"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "storefront_sites_organizationId_code_key" ON "storefront_sites"("organizationId", "code");

-- AddForeignKey
ALTER TABLE "storefront_sites" ADD CONSTRAINT "storefront_sites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
