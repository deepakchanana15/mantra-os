import { describe, expect, it } from "vitest";
import { SalesOrderStatus } from "@mantra-os/db";
import { computeShippingStatus } from "./shipment-status.util";

describe("computeShippingStatus", () => {
  const orderLines = [
    { id: "line-1", quantity: 10 },
    { id: "line-2", quantity: 5 },
  ];

  it("stays at the current status when nothing has shipped yet", () => {
    const status = computeShippingStatus(orderLines, [], SalesOrderStatus.PENDING);
    expect(status).toBe(SalesOrderStatus.PENDING);
  });

  it("moves to PARTIALLY_SHIPPED when some but not all quantity has shipped", () => {
    const status = computeShippingStatus(orderLines, [{ salesOrderLineId: "line-1", quantity: 4 }], SalesOrderStatus.PENDING);
    expect(status).toBe(SalesOrderStatus.PARTIALLY_SHIPPED);
  });

  it("moves to SHIPPED only when every line is fully covered", () => {
    const status = computeShippingStatus(
      orderLines,
      [
        { salesOrderLineId: "line-1", quantity: 10 },
        { salesOrderLineId: "line-2", quantity: 5 },
      ],
      SalesOrderStatus.PARTIALLY_SHIPPED,
    );
    expect(status).toBe(SalesOrderStatus.SHIPPED);
  });

  it("sums multiple shipments against the same line (partial shipments over time)", () => {
    const status = computeShippingStatus(
      orderLines,
      [
        { salesOrderLineId: "line-1", quantity: 6 },
        { salesOrderLineId: "line-1", quantity: 4 },
        { salesOrderLineId: "line-2", quantity: 5 },
      ],
      SalesOrderStatus.PARTIALLY_SHIPPED,
    );
    expect(status).toBe(SalesOrderStatus.SHIPPED);
  });

  it("treats over-shipping a line as fully shipped, not an error (>= comparison)", () => {
    const status = computeShippingStatus(
      [{ id: "line-1", quantity: 10 }],
      [{ salesOrderLineId: "line-1", quantity: 12 }],
      SalesOrderStatus.PENDING,
    );
    expect(status).toBe(SalesOrderStatus.SHIPPED);
  });

  it("never regresses a fully-shipped order back to a lesser status if called again", () => {
    const status = computeShippingStatus(
      orderLines,
      [
        { salesOrderLineId: "line-1", quantity: 10 },
        { salesOrderLineId: "line-2", quantity: 5 },
      ],
      SalesOrderStatus.SHIPPED,
    );
    expect(status).toBe(SalesOrderStatus.SHIPPED);
  });
});
