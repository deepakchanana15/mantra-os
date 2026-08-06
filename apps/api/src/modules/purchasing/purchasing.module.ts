import { Module } from "@nestjs/common";
import { InventoryModule } from "../inventory/inventory.module";
import { ExpensesController } from "./expenses/expenses.controller";
import { ExpensesRepository } from "./expenses/expenses.repository";
import { ExpensesService } from "./expenses/expenses.service";
import { GoodsReceiptsController } from "./goods-receipts/goods-receipts.controller";
import { GoodsReceiptsRepository } from "./goods-receipts/goods-receipts.repository";
import { GoodsReceiptsService } from "./goods-receipts/goods-receipts.service";
import { PurchaseOrderPdfService } from "./purchase-orders/purchase-order-pdf.service";
import { PurchaseOrdersController } from "./purchase-orders/purchase-orders.controller";
import { PurchaseOrdersRepository } from "./purchase-orders/purchase-orders.repository";
import { PurchaseOrdersService } from "./purchase-orders/purchase-orders.service";
import { SuppliersController } from "./suppliers/suppliers.controller";
import { SuppliersRepository } from "./suppliers/suppliers.repository";
import { SuppliersService } from "./suppliers/suppliers.service";

@Module({
  imports: [InventoryModule],
  controllers: [SuppliersController, PurchaseOrdersController, GoodsReceiptsController, ExpensesController],
  providers: [
    SuppliersRepository,
    SuppliersService,
    PurchaseOrdersRepository,
    PurchaseOrdersService,
    PurchaseOrderPdfService,
    GoodsReceiptsRepository,
    GoodsReceiptsService,
    ExpensesRepository,
    ExpensesService,
  ],
})
export class PurchasingModule {}
