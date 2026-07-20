import { Module } from "@nestjs/common";
import { InventoryModule } from "../inventory/inventory.module";
import { GoodsReceiptsController } from "./goods-receipts/goods-receipts.controller";
import { GoodsReceiptsRepository } from "./goods-receipts/goods-receipts.repository";
import { GoodsReceiptsService } from "./goods-receipts/goods-receipts.service";
import { PurchaseOrdersController } from "./purchase-orders/purchase-orders.controller";
import { PurchaseOrdersRepository } from "./purchase-orders/purchase-orders.repository";
import { PurchaseOrdersService } from "./purchase-orders/purchase-orders.service";
import { SuppliersController } from "./suppliers/suppliers.controller";
import { SuppliersRepository } from "./suppliers/suppliers.repository";
import { SuppliersService } from "./suppliers/suppliers.service";

@Module({
  imports: [InventoryModule],
  controllers: [SuppliersController, PurchaseOrdersController, GoodsReceiptsController],
  providers: [
    SuppliersRepository,
    SuppliersService,
    PurchaseOrdersRepository,
    PurchaseOrdersService,
    GoodsReceiptsRepository,
    GoodsReceiptsService,
  ],
})
export class PurchasingModule {}
