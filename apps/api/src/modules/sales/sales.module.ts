import { Module } from "@nestjs/common";
import { InventoryModule } from "../inventory/inventory.module";
import { InvoicePdfService } from "./invoices/invoice-pdf.service";
import { InvoicesController } from "./invoices/invoices.controller";
import { InvoicesRepository } from "./invoices/invoices.repository";
import { InvoicesService } from "./invoices/invoices.service";
import { LeadIntakeController } from "./leads/lead-intake.controller";
import { LeadIntakeKeysController } from "./leads/lead-intake-keys.controller";
import { LeadIntakeKeysRepository } from "./leads/lead-intake-keys.repository";
import { LeadIntakeKeysService } from "./leads/lead-intake-keys.service";
import { OpportunitiesController } from "./opportunities/opportunities.controller";
import { OpportunitiesRepository } from "./opportunities/opportunities.repository";
import { OpportunitiesService } from "./opportunities/opportunities.service";
import { QuotesController } from "./quotes/quotes.controller";
import { QuotesRepository } from "./quotes/quotes.repository";
import { QuotesService } from "./quotes/quotes.service";
import { SalesOrdersController } from "./sales-orders/sales-orders.controller";
import { SalesOrdersRepository } from "./sales-orders/sales-orders.repository";
import { SalesOrdersService } from "./sales-orders/sales-orders.service";
import { ShipmentsController } from "./shipments/shipments.controller";
import { ShipmentsRepository } from "./shipments/shipments.repository";
import { ShipmentsService } from "./shipments/shipments.service";
import { WhatsAppPhoneNumbersController } from "./whatsapp/whatsapp-phone-numbers.controller";
import { WhatsAppPhoneNumbersRepository } from "./whatsapp/whatsapp-phone-numbers.repository";
import { WhatsAppPhoneNumbersService } from "./whatsapp/whatsapp-phone-numbers.service";
import { WhatsAppWebhookController } from "./whatsapp/whatsapp-webhook.controller";

@Module({
  imports: [InventoryModule],
  controllers: [
    QuotesController,
    SalesOrdersController,
    ShipmentsController,
    OpportunitiesController,
    InvoicesController,
    LeadIntakeKeysController,
    LeadIntakeController,
    WhatsAppPhoneNumbersController,
    WhatsAppWebhookController,
  ],
  providers: [
    QuotesRepository,
    QuotesService,
    SalesOrdersRepository,
    SalesOrdersService,
    ShipmentsRepository,
    ShipmentsService,
    OpportunitiesRepository,
    OpportunitiesService,
    InvoicesRepository,
    InvoicesService,
    InvoicePdfService,
    LeadIntakeKeysRepository,
    LeadIntakeKeysService,
    WhatsAppPhoneNumbersRepository,
    WhatsAppPhoneNumbersService,
  ],
})
export class SalesModule {}
