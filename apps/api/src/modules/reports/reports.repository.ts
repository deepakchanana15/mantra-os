import { Injectable } from "@nestjs/common";
import { SalesOrderStatus } from "@mantra-os/db";
import { BaseRepository } from "../../common/repositories/base.repository";

/**
 * Read-only aggregation across CRM/Sales/Inventory — deliberately has no
 * entities of its own. See ARCHITECTURE.md "Reports and Dashboard are not
 * domains": these queries exist to summarize the real domains, not to
 * duplicate their data.
 */
@Injectable()
export class ReportsRepository extends BaseRepository {
  async getDashboardSummary() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [activeCustomers, openSalesOrders, lowStockLevels, salesOrdersThisMonth] = await Promise.all([
      this.db.customer.count({
        where: { organizationId: this.organizationId, deletedAt: null },
      }),
      this.db.salesOrder.count({
        where: {
          organizationId: this.organizationId,
          deletedAt: null,
          status: { in: [SalesOrderStatus.PENDING, SalesOrderStatus.CONFIRMED, SalesOrderStatus.PARTIALLY_SHIPPED] },
        },
      }),
      this.db.stockLevel.findMany({
        where: {
          organizationId: this.organizationId,
          reorderPoint: { not: null },
        },
        select: { id: true, quantityOnHand: true, reorderPoint: true },
      }),
      this.db.salesOrder.findMany({
        where: {
          organizationId: this.organizationId,
          deletedAt: null,
          status: { not: SalesOrderStatus.CANCELLED },
          orderDate: { gte: startOfMonth },
        },
        include: { lines: true },
      }),
    ]);

    const lowStockCount = lowStockLevels.filter(
      (level) => level.reorderPoint !== null && level.quantityOnHand <= level.reorderPoint,
    ).length;

    const revenueMonthToDate = salesOrdersThisMonth.reduce(
      (total, order) =>
        total + order.lines.reduce((lineTotal, line) => lineTotal + line.quantity * Number(line.unitPrice), 0),
      0,
    );

    const byChannel = new Map<string, { orders: number; revenue: number }>();
    for (const order of salesOrdersThisMonth) {
      const key = order.salesChannel ?? "UNSPECIFIED";
      const orderRevenue = order.lines.reduce((sum, line) => sum + line.quantity * Number(line.unitPrice), 0);
      const existing = byChannel.get(key) ?? { orders: 0, revenue: 0 };
      byChannel.set(key, { orders: existing.orders + 1, revenue: existing.revenue + orderRevenue });
    }
    const salesByChannel = Array.from(byChannel.entries()).map(([channel, stats]) => ({ channel, ...stats }));

    return {
      activeCustomers,
      openSalesOrders,
      lowStockProducts: lowStockCount,
      revenueMonthToDate,
      salesByChannel,
    };
  }
}
