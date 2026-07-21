import { Module } from "@nestjs/common";
import { InventoryModule } from "../inventory/inventory.module";
import { InvoicesController } from "./invoices/invoices.controller";
import { InvoicesRepository } from "./invoices/invoices.repository";
import { InvoicesService } from "./invoices/invoices.service";
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

@Module({
  imports: [InventoryModule],
  controllers: [
    QuotesController,
    SalesOrdersController,
    ShipmentsController,
    OpportunitiesController,
    InvoicesController,
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
  ],
})
export class SalesModule {}
