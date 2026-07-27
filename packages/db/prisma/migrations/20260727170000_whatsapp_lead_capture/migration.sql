-- CreateTable
CREATE TABLE "whatsapp_phone_numbers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT,
    "phoneNumberId" TEXT NOT NULL,
    "displayPhoneNumber" TEXT,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "whatsapp_phone_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "whatsappPhoneNumberId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "fromPhone" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "externalMessageId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_phone_numbers_phoneNumberId_key" ON "whatsapp_phone_numbers"("phoneNumberId");

-- CreateIndex
CREATE INDEX "whatsapp_phone_numbers_organizationId_idx" ON "whatsapp_phone_numbers"("organizationId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_organizationId_idx" ON "whatsapp_messages"("organizationId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_opportunityId_idx" ON "whatsapp_messages"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_organizationId_externalMessageId_key" ON "whatsapp_messages"("organizationId", "externalMessageId");

-- AddForeignKey
ALTER TABLE "whatsapp_phone_numbers" ADD CONSTRAINT "whatsapp_phone_numbers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_phone_numbers" ADD CONSTRAINT "whatsapp_phone_numbers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_whatsappPhoneNumberId_fkey" FOREIGN KEY ("whatsappPhoneNumberId") REFERENCES "whatsapp_phone_numbers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
