-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "stageChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "opportunity_stage_history" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "fromStage" "OpportunityStage",
    "toStage" "OpportunityStage" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,

    CONSTRAINT "opportunity_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunity_stage_history_organizationId_idx" ON "opportunity_stage_history"("organizationId");

-- CreateIndex
CREATE INDEX "opportunity_stage_history_opportunityId_idx" ON "opportunity_stage_history"("opportunityId");

-- AddForeignKey
ALTER TABLE "opportunity_stage_history" ADD CONSTRAINT "opportunity_stage_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_stage_history" ADD CONSTRAINT "opportunity_stage_history_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
