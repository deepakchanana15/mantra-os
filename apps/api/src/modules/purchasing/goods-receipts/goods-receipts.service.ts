import { Injectable } from "@nestjs/common";
import { InventoryTransactionType } from "@mantra-os/db";
import { InventoryService } from "../../inventory/stock/inventory.service";
import { PurchaseOrdersRepository } from "../purchase-orders/purchase-orders.repository";
import { CreateGoodsReceiptDto } from "./dto/create-goods-receipt.dto";
import { computeReceivingStatus } from "./goods-receipt-status.util";
import { GoodsReceiptsRepository } from "./goods-receipts.repository";

/**
 * No delete/update endpoints and no DeletionGuardService here — GoodsReceipt
 * is append-only, like InventoryTransaction, per DATABASE.md "Append-only
 * ledger tables". A wrong receipt is corrected with an inventory
 * ADJUSTMENT, not by editing this record.
 */
@Injectable()
export class GoodsReceiptsService {
  constructor(
    private readonly goodsReceipts: GoodsReceiptsRepository,
    private readonly purchaseOrders: PurchaseOrdersRepository,
    private readonly inventory: InventoryService,
  ) {}

  findAll(params: { skip?: number; take?: number; purchaseOrderId?: string }) {
    return this.goodsReceipts.findAll(params);
  }

  findOne(id: string) {
    return this.goodsReceipts.findOneOrThrow(id);
  }

  async create(dto: CreateGoodsReceiptDto) {
    const productsByLineId = await this.goodsReceipts.resolveLineProducts(
      dto.lines.map((line) => line.purchaseOrderLineId),
    );

    const receipt = await this.goodsReceipts.create(dto);

    for (const line of dto.lines) {
      const purchaseOrderLine = productsByLineId.get(line.purchaseOrderLineId)!;
      await this.inventory.recordMovement({
        productId: purchaseOrderLine.productId,
        warehouseId: dto.warehouseId,
        type: InventoryTransactionType.RECEIPT,
        quantityDelta: line.quantity,
        referenceType: "GoodsReceipt",
        referenceId: receipt.id,
      });
    }

    await this.updatePurchaseOrderReceivingStatus(dto.purchaseOrderId);
    return receipt;
  }

  /** Orchestration only — the actual status math is in goods-receipt-status.util.ts (unit tested there). */
  private async updatePurchaseOrderReceivingStatus(purchaseOrderId: string): Promise<void> {
    const order = await this.purchaseOrders.findOneOrThrow(purchaseOrderId);
    const receipts = await this.goodsReceipts.findAll({ purchaseOrderId, take: 1000 });
    const receiptLines = receipts.flatMap((receipt) => receipt.lines);

    const status = computeReceivingStatus(order.lines, receiptLines, order.status);

    if (status !== order.status) {
      await this.purchaseOrders.updateStatus(purchaseOrderId, status);
    }
  }
}
