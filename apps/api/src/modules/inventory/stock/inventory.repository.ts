import { Injectable } from "@nestjs/common";
import { InventoryTransactionType } from "@mantra-os/db";
import { BaseRepository } from "../../../common/repositories/base.repository";

/**
 * Owns both InventoryTransaction (the append-only ledger, the 10M-row scale
 * target) and StockLevel (the derived current-state snapshot) — see
 * DATABASE.md "Append-only ledger tables". Every stock movement, whatever
 * domain triggers it (a manual adjustment here, a Shipment in Sales, a
 * GoodsReceipt in Purchasing), goes through recordTransaction() so the
 * ledger and the snapshot can never drift apart.
 */
@Injectable()
export class InventoryRepository extends BaseRepository {
  async recordTransaction(params: {
    productId: string;
    warehouseId: string;
    type: InventoryTransactionType;
    quantityDelta: number;
    referenceType?: string;
    referenceId?: string;
  }) {
    const transaction = await this.db.inventoryTransaction.create({
      data: {
        organizationId: this.organizationId,
        productId: params.productId,
        warehouseId: params.warehouseId,
        type: params.type,
        quantity: params.quantityDelta,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        createdBy: this.userId,
      },
    });

    await this.db.stockLevel.upsert({
      where: { productId_warehouseId: { productId: params.productId, warehouseId: params.warehouseId } },
      create: {
        organizationId: this.organizationId,
        productId: params.productId,
        warehouseId: params.warehouseId,
        quantityOnHand: params.quantityDelta,
      },
      update: {
        quantityOnHand: { increment: params.quantityDelta },
      },
    });

    return transaction;
  }

  findStockLevels(params: { productId?: string; warehouseId?: string }) {
    return this.db.stockLevel.findMany({
      where: {
        organizationId: this.organizationId,
        ...(params.productId ? { productId: params.productId } : {}),
        ...(params.warehouseId ? { warehouseId: params.warehouseId } : {}),
      },
      include: { product: true, warehouse: true },
    });
  }

  findTransactions(params: {
    productId?: string;
    warehouseId?: string;
    skip?: number;
    take?: number;
  }) {
    return this.db.inventoryTransaction.findMany({
      where: {
        organizationId: this.organizationId,
        ...(params.productId ? { productId: params.productId } : {}),
        ...(params.warehouseId ? { warehouseId: params.warehouseId } : {}),
      },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }
}
