import { describe, expect, it } from "vitest";
import { PurchaseOrderStatus } from "@mantra-os/db";
import { computeReceivingStatus } from "./goods-receipt-status.util";

describe("computeReceivingStatus", () => {
  const orderLines = [
    { id: "line-1", quantity: 20 },
    { id: "line-2", quantity: 8 },
  ];

  it("stays at the current status when nothing has been received yet", () => {
    const status = computeReceivingStatus(orderLines, [], PurchaseOrderStatus.SENT);
    expect(status).toBe(PurchaseOrderStatus.SENT);
  });

  it("moves to PARTIALLY_RECEIVED when some but not all quantity has arrived", () => {
    const status = computeReceivingStatus(orderLines, [{ purchaseOrderLineId: "line-1", quantity: 5 }], PurchaseOrderStatus.SENT);
    expect(status).toBe(PurchaseOrderStatus.PARTIALLY_RECEIVED);
  });

  it("moves to RECEIVED only when every line is fully covered", () => {
    const status = computeReceivingStatus(
      orderLines,
      [
        { purchaseOrderLineId: "line-1", quantity: 20 },
        { purchaseOrderLineId: "line-2", quantity: 8 },
      ],
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
    );
    expect(status).toBe(PurchaseOrderStatus.RECEIVED);
  });

  it("sums multiple receipts against the same line", () => {
    const status = computeReceivingStatus(
      orderLines,
      [
        { purchaseOrderLineId: "line-1", quantity: 12 },
        { purchaseOrderLineId: "line-1", quantity: 8 },
        { purchaseOrderLineId: "line-2", quantity: 8 },
      ],
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
    );
    expect(status).toBe(PurchaseOrderStatus.RECEIVED);
  });
});
