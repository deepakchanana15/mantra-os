import { PurchaseOrderStatus } from "@mantra-os/db";

export interface OrderLineQuantity {
  id: string;
  quantity: number;
}

export interface FulfillmentLine {
  purchaseOrderLineId: string;
  quantity: number;
}

/**
 * Pure — no DB access — so it's unit-testable without mocking Prisma.
 * Mirrors shipment-status.util.ts on the Sales side; extracted from
 * GoodsReceiptsService.updatePurchaseOrderReceivingStatus() for the same
 * reason during Phase 6.
 */
export function computeReceivingStatus(
  orderLines: OrderLineQuantity[],
  receiptLines: FulfillmentLine[],
  currentStatus: PurchaseOrderStatus,
): PurchaseOrderStatus {
  const receivedByLine = new Map<string, number>();
  for (const line of receiptLines) {
    receivedByLine.set(line.purchaseOrderLineId, (receivedByLine.get(line.purchaseOrderLineId) ?? 0) + line.quantity);
  }

  const allFullyReceived = orderLines.every((line) => (receivedByLine.get(line.id) ?? 0) >= line.quantity);
  const anyReceived = receivedByLine.size > 0;

  if (allFullyReceived) return PurchaseOrderStatus.RECEIVED;
  if (anyReceived) return PurchaseOrderStatus.PARTIALLY_RECEIVED;
  return currentStatus;
}
