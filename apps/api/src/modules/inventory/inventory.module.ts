import { Module } from "@nestjs/common";
import { InventoryController } from "./stock/inventory.controller";
import { InventoryRepository } from "./stock/inventory.repository";
import { InventoryService } from "./stock/inventory.service";
import { WarehousesController } from "./warehouses/warehouses.controller";
import { WarehousesRepository } from "./warehouses/warehouses.repository";
import { WarehousesService } from "./warehouses/warehouses.service";

@Module({
  controllers: [WarehousesController, InventoryController],
  providers: [WarehousesRepository, WarehousesService, InventoryRepository, InventoryService],
  exports: [InventoryService, WarehousesRepository],
})
export class InventoryModule {}
