-- CreateTable
CREATE TABLE "meta_lead_pages" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT,
    "pageId" TEXT NOT NULL,
    "pageAccessToken" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "meta_lead_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meta_lead_pages_pageId_key" ON "meta_lead_pages"("pageId");

-- CreateIndex
CREATE INDEX "meta_lead_pages_organizationId_idx" ON "meta_lead_pages"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_organizationId_externalLeadId_key" ON "opportunities"("organizationId", "externalLeadId");

-- AddForeignKey
ALTER TABLE "meta_lead_pages" ADD CONSTRAINT "meta_lead_pages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_lead_pages" ADD CONSTRAINT "meta_lead_pages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

