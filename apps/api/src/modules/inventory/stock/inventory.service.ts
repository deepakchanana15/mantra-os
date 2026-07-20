import { Injectable } from "@nestjs/common";
import { InventoryTransactionType } from "@mantra-os/db";
import { CreateAdjustmentDto } from "./dto/create-adjustment.dto";
import { InventoryRepository } from "./inventory.repository";

@Injectable()
export class InventoryService {
  constructor(private readonly inventory: InventoryRepository) {}

  findStockLevels(params: { productId?: string; warehouseId?: string }) {
    return this.inventory.findStockLevels(params);
  }

  findTransactions(params: { productId?: string; warehouseId?: string; skip?: number; take?: number }) {
    return this.inventory.findTransactions(params);
  }

  /** The only user-facing way to move stock outside of Sales/Purchasing flows. Always type ADJUSTMENT. */
  createAdjustment(dto: CreateAdjustmentDto) {
    return this.inventory.recordTransaction({
      productId: dto.productId,
      warehouseId: dto.warehouseId,
      type: InventoryTransactionType.ADJUSTMENT,
      quantityDelta: dto.quantityDelta,
    });
  }

  /** Called by Sales (Shipment) and Purchasing (GoodsReceipt) — see those modules. Not exposed as its own HTTP endpoint. */
  recordMovement(params: {
    productId: string;
    warehouseId: string;
    type: InventoryTransactionType;
    quantityDelta: number;
    referenceType: string;
    referenceId: string;
  }) {
    return this.inventory.recordTransaction(params);
  }
}
