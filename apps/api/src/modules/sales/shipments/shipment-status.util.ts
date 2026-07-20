import { SalesOrderStatus } from "@mantra-os/db";

export interface OrderLineQuantity {
  id: string;
  quantity: number;
}

export interface FulfillmentLine {
  salesOrderLineId: string;
  quantity: number;
}

/**
 * Pure — no DB access — so it's unit-testable without mocking Prisma.
 * Extracted from ShipmentsService.updateSalesOrderShippingStatus() during
 * Phase 6 specifically to make this math testable in isolation; the
 * orchestration (fetching the order + shipments, writing the new status)
 * stays in the service.
 */
export function computeShippingStatus(
  orderLines: OrderLineQuantity[],
  shipmentLines: FulfillmentLine[],
  currentStatus: SalesOrderStatus,
): SalesOrderStatus {
  const shippedByLine = new Map<string, number>();
  for (const line of shipmentLines) {
    shippedByLine.set(line.salesOrderLineId, (shippedByLine.get(line.salesOrderLineId) ?? 0) + line.quantity);
  }

  const allFullyShipped = orderLines.every((line) => (shippedByLine.get(line.id) ?? 0) >= line.quantity);
  const anyShipped = shippedByLine.size > 0;

  if (allFullyShipped) return SalesOrderStatus.SHIPPED;
  if (anyShipped) return SalesOrderStatus.PARTIALLY_SHIPPED;
  return currentStatus;
}
