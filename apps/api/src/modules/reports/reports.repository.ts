import { Injectable } from "@nestjs/common";
import { SalesOrderStatus } from "@mantra-os/db";
import { BaseRepository } from "../../common/repositories/base.repository";

interface PeriodTotals {
  orders: number;
  revenue: number;
}

interface BreakdownRow {
  label: string;
  currency: string;
  isIntercompany: boolean;
  mtd: PeriodTotals;
  ytd: PeriodTotals;
  allTime: PeriodTotals;
}

function emptyPeriodTotals(): PeriodTotals {
  return { orders: 0, revenue: 0 };
}

/**
 * Maps a company's own base currency to its home country name, for
 * attributing an intercompany export invoice's revenue row — deliberately
 * NOT sourced from Invoice.countryOfOrigin, since that's a free-text field
 * a user could leave blank or mistype (e.g. as the destination country
 * instead of the origin). baseCurrency is a controlled field, so this is
 * the reliable source of truth for "which of our own entities is this".
 */
const CURRENCY_TO_HOME_COUNTRY: Record<string, string> = {
  AUD: "Australia",
  INR: "India",
  USD: "United States",
  GBP: "United Kingdom",
  CAD: "Canada",
  NZD: "New Zealand",
  EUR: "Europe",
};

function addToPeriods(row: { mtd: PeriodTotals; ytd: PeriodTotals; allTime: PeriodTotals }, date: Date, revenue: number, startOfMonth: Date, startOfYear: Date) {
  row.allTime.orders += 1;
  row.allTime.revenue += revenue;
  if (date >= startOfYear) {
    row.ytd.orders += 1;
    row.ytd.revenue += revenue;
  }
  if (date >= startOfMonth) {
    row.mtd.orders += 1;
    row.mtd.revenue += revenue;
  }
}

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
    const startOfYear = new Date(startOfMonth.getFullYear(), 0, 1);

    const [activeCustomers, openSalesOrders, lowStockLevels, allSalesOrders, allB2bExportInvoices, campaignsLast30d] = await Promise.all([
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
      // Every non-cancelled Sales Order ever placed — fetched once and
      // bucketed into MTD/YTD/all-time in a single pass below, rather than
      // three separate date-filtered queries.
      this.db.salesOrder.findMany({
        where: {
          organizationId: this.organizationId,
          deletedAt: null,
          status: { not: SalesOrderStatus.CANCELLED },
        },
        include: {
          lines: true,
          company: { include: { baseCurrency: true } },
          country: { include: { currency: true } },
        },
      }),
      // Intercompany export invoices (e.g. an India entity invoicing an
      // Australian sibling entity) — kept out of revenue totals and the
      // customer-revenue rows below, shown as their own labeled rows
      // instead. See DECISIONS.md "India export invoice compliance".
      this.db.invoice.findMany({
        where: {
          organizationId: this.organizationId,
          deletedAt: null,
          consigneeCompanyId: { not: null },
        },
        include: {
          company: { include: { baseCurrency: true } },
          country: { include: { currency: true } },
        },
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

    // Channel breakdown stays MTD-only — the dashboard's "this month"
    // operational view, not part of the currency/period bifurcation below.
    const byChannel = new Map<string, { orders: number; revenue: number }>();
    for (const order of allSalesOrders) {
      if (order.orderDate < startOfMonth) continue;
      const orderRevenue = order.lines.reduce((sum, line) => sum + line.quantity * Number(line.unitPrice), 0);
      const channelKey = order.salesChannel ?? "UNSPECIFIED";
      const existing = byChannel.get(channelKey) ?? { orders: 0, revenue: 0 };
      byChannel.set(channelKey, { orders: existing.orders + 1, revenue: existing.revenue + orderRevenue });
    }
    const salesByChannel = Array.from(byChannel.entries()).map(([channel, stats]) => ({ channel, ...stats }));

    // Revenue by currency (top-level KPI) and by company/country — each
    // grouped by (label, currency) so two currencies for the same
    // company/country never get summed together as one number.
    const byCurrency = new Map<string, { mtd: PeriodTotals; ytd: PeriodTotals; allTime: PeriodTotals }>();
    const byCompany = new Map<string, BreakdownRow>();
    const byCountry = new Map<string, BreakdownRow>();

    for (const order of allSalesOrders) {
      const orderRevenue = order.lines.reduce((sum, line) => sum + line.quantity * Number(line.unitPrice), 0);
      const currency = order.country?.currency?.code ?? order.company?.baseCurrency?.code ?? "USD";

      const currencyRow = byCurrency.get(currency) ?? { mtd: emptyPeriodTotals(), ytd: emptyPeriodTotals(), allTime: emptyPeriodTotals() };
      addToPeriods(currencyRow, order.orderDate, orderRevenue, startOfMonth, startOfYear);
      byCurrency.set(currency, currencyRow);

      const companyLabel = order.company?.name ?? "Unassigned";
      const companyKey = `customer:${companyLabel}:${currency}`;
      const companyRow = byCompany.get(companyKey) ?? { label: companyLabel, currency, isIntercompany: false, mtd: emptyPeriodTotals(), ytd: emptyPeriodTotals(), allTime: emptyPeriodTotals() };
      addToPeriods(companyRow, order.orderDate, orderRevenue, startOfMonth, startOfYear);
      byCompany.set(companyKey, companyRow);

      const countryLabel = order.country?.name ?? "Unassigned";
      const countryKey = `customer:${countryLabel}:${currency}`;
      const countryRow = byCountry.get(countryKey) ?? { label: countryLabel, currency, isIntercompany: false, mtd: emptyPeriodTotals(), ytd: emptyPeriodTotals(), allTime: emptyPeriodTotals() };
      addToPeriods(countryRow, order.orderDate, orderRevenue, startOfMonth, startOfYear);
      byCountry.set(countryKey, countryRow);
    }

    // Intercompany export invoices — their own B2B/Export-labeled rows,
    // never merged into the customer rows above even when the label and
    // currency happen to match, so revenueByCurrency and these rows both
    // stay honest about what's a real sale versus a goods transfer
    // between our own entities.
    for (const invoice of allB2bExportInvoices) {
      const invoiceValue = Number(invoice.amount) - Number(invoice.discountAmount ?? 0);
      const currency = invoice.country?.currency?.code ?? invoice.company?.baseCurrency?.code ?? "USD";
      const invoiceDate = invoice.issuedAt ?? invoice.createdAt;

      const companyLabel = invoice.company?.legalName ?? invoice.company?.name ?? "Unassigned";
      const companyKey = `b2b:${companyLabel}:${currency}`;
      const companyRow = byCompany.get(companyKey) ?? { label: companyLabel, currency, isIntercompany: true, mtd: emptyPeriodTotals(), ytd: emptyPeriodTotals(), allTime: emptyPeriodTotals() };
      addToPeriods(companyRow, invoiceDate, invoiceValue, startOfMonth, startOfYear);
      byCompany.set(companyKey, companyRow);

      const issuerCurrency = invoice.company?.baseCurrency?.code;
      const countryLabel = (issuerCurrency && CURRENCY_TO_HOME_COUNTRY[issuerCurrency]) || invoice.countryOfOrigin || "Unassigned";
      const countryKey = `b2b:${countryLabel}:${currency}`;
      const countryRow = byCountry.get(countryKey) ?? { label: countryLabel, currency, isIntercompany: true, mtd: emptyPeriodTotals(), ytd: emptyPeriodTotals(), allTime: emptyPeriodTotals() };
      addToPeriods(countryRow, invoiceDate, invoiceValue, startOfMonth, startOfYear);
      byCountry.set(countryKey, countryRow);
    }

    const revenueByCurrency = Array.from(byCurrency.entries())
      .map(([currency, totals]) => ({ currency, ...totals }))
      .sort((a, b) => b.allTime.revenue - a.allTime.revenue);
    const revenueByCompany = Array.from(byCompany.values()).sort((a, b) => b.allTime.revenue - a.allTime.revenue);
    const revenueByCountry = Array.from(byCountry.values()).sort((a, b) => b.allTime.revenue - a.allTime.revenue);

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
      salesByChannel,
      revenueByCurrency,
      revenueByCompany,
      revenueByCountry,
      marketingPerformance,
    };
  }
}
