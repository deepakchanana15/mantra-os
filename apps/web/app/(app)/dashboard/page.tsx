import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { SalesByChannelWidget, type ChannelStat } from "@/components/domain/sales-by-channel-widget";
import { RevenueSummaryWidget, type CurrencyPeriodStat } from "@/components/domain/revenue-summary-widget";
import { RevenueBreakdownWidget, type RevenueBreakdownStat } from "@/components/domain/revenue-breakdown-widget";
import { MarketingPerformanceWidget, type MarketingCampaignStat } from "@/components/domain/marketing-performance-widget";

interface DashboardSummary {
  activeCustomers: number;
  openSalesOrders: number;
  lowStockProducts: number;
  salesByChannel: ChannelStat[];
  revenueByCurrency: CurrencyPeriodStat[];
  revenueByCompany: RevenueBreakdownStat[];
  revenueByCountry: RevenueBreakdownStat[];
  marketingPerformance: MarketingCampaignStat[];
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const summary = await apiFetch<DashboardSummary>("/v1/reports/dashboard");

  return (
    <div className="flex flex-col gap-6 p-7">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">An at-a-glance summary across CRM, Sales, and Inventory.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi label="Active customers" value={summary.activeCustomers.toLocaleString()} />
        <Kpi label="Open sales orders" value={summary.openSalesOrders.toLocaleString()} />
        <Kpi label="Low stock products" value={summary.lowStockProducts.toLocaleString()} />
      </div>

      <RevenueSummaryWidget revenueByCurrency={summary.revenueByCurrency} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesByChannelWidget salesByChannel={summary.salesByChannel} />
        <MarketingPerformanceWidget marketingPerformance={summary.marketingPerformance} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueBreakdownWidget title="Revenue by company" labelHeading="Company" stats={summary.revenueByCompany} />
        <RevenueBreakdownWidget title="Revenue by country" labelHeading="Country" stats={summary.revenueByCountry} />
      </div>
      <p className="text-xs text-faint">
        Revenue above counts customer sales only, shown in each row&apos;s own currency. Rows badged{" "}
        <span className="font-medium">B2B · Export</span> are intercompany goods transfers (e.g. an India entity
        invoicing an Australian sibling entity) — not counted in the revenue totals.
      </p>
    </div>
  );
}
