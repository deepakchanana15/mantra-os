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

    const [activeCustomers, openSalesOrders, lowStockLevels, salesOrdersThisMonth, campaignsLast30d] = await Promise.all([
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
        include: { lines: true, company: true, country: true },
      }),
      // Per-campaign, not per-channel — see DECISIONS.md "Per-campaign ad
      // performance, not channel-consolidated". Sourced from AdCampaign's
      // own rolling last-30-day totals (from the ad platform's own date
      // preset), not our day-by-day AdCampaignMetric accumulation — that
      // way this is accurate from day one, not dependent on how long
      // MantraOS itself has been syncing. Only campaigns with actual
      // recent activity show up here; the full archive lives on the
      // Campaigns page regardless of activity.
      this.db.adCampaign.findMany({
        where: {
          organizationId: this.organizationId,
          OR: [{ last30dSpend: { gt: 0 } }, { last30dImpressions: { gt: 0 } }, { last30dClicks: { gt: 0 } }],
        },
        orderBy: { last30dSpend: "desc" },
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
    const byCompany = new Map<string, { orders: number; revenue: number }>();
    const byCountry = new Map<string, { orders: number; revenue: number }>();
    for (const order of salesOrdersThisMonth) {
      const orderRevenue = order.lines.reduce((sum, line) => sum + line.quantity * Number(line.unitPrice), 0);

      const channelKey = order.salesChannel ?? "UNSPECIFIED";
      const existingChannel = byChannel.get(channelKey) ?? { orders: 0, revenue: 0 };
      byChannel.set(channelKey, { orders: existingChannel.orders + 1, revenue: existingChannel.revenue + orderRevenue });

      const companyKey = order.company?.name ?? "Unassigned";
      const existingCompany = byCompany.get(companyKey) ?? { orders: 0, revenue: 0 };
      byCompany.set(companyKey, { orders: existingCompany.orders + 1, revenue: existingCompany.revenue + orderRevenue });

      const countryKey = order.country?.name ?? "Unassigned";
      const existingCountry = byCountry.get(countryKey) ?? { orders: 0, revenue: 0 };
      byCountry.set(countryKey, { orders: existingCountry.orders + 1, revenue: existingCountry.revenue + orderRevenue });
    }
    const salesByChannel = Array.from(byChannel.entries()).map(([channel, stats]) => ({ channel, ...stats }));
    // Sourced from Sales Orders only, which always require a real Customer
    // (no intercompany/consignee concept the way Invoice has) — so this
    // never includes intercompany transfers like an India-entity export
    // invoice to an Australian sibling entity. See DECISIONS.md "India
    // export invoice compliance".
    const revenueByCompany = Array.from(byCompany.entries())
      .map(([company, stats]) => ({ company, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);
    const revenueByCountry = Array.from(byCountry.entries())
      .map(([country, stats]) => ({ country, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);

    const marketingPerformance = campaignsLast30d.map((campaign) => ({
      channel: campaign.channel,
      campaignName: campaign.name,
      status: campaign.status,
      currency: campaign.currency,
      spend: Number(campaign.last30dSpend),
      impressions: campaign.last30dImpressions,
      clicks: campaign.last30dClicks,
    }));

    return {
      activeCustomers,
      openSalesOrders,
      lowStockProducts: lowStockCount,
      revenueMonthToDate,
      salesByChannel,
      revenueByCompany,
      revenueByCountry,
      marketingPerformance,
    };
  }
}
