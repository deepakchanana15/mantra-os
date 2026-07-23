import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { SalesByChannelWidget, type ChannelStat } from "@/components/domain/sales-by-channel-widget";
import { MarketingPerformanceWidget, type MarketingChannelStat } from "@/components/domain/marketing-performance-widget";

interface DashboardSummary {
  activeCustomers: number;
  openSalesOrders: number;
  lowStockProducts: number;
  revenueMonthToDate: number;
  salesByChannel: ChannelStat[];
  marketingPerformance: MarketingChannelStat[];
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

/**
 * Only one report exists on the backend today (the dashboard summary) —
 * see ARCHITECTURE.md "Reports and Dashboard are not domains". This page
 * shows the same data in report framing rather than duplicating it or
 * inventing reports the API doesn't provide.
 */
export default async function ReportsPage() {
  const summary = await apiFetch<DashboardSummary>("/v1/reports/dashboard");
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col gap-6 p-7">
      <div>
        <h1 className="text-xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">
          The same live summary as the{" "}
          <Link href="/dashboard" className="text-accent hover:underline">
            Dashboard
          </Link>{" "}
          — more report types land here as they&apos;re built.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active customers" value={summary.activeCustomers.toLocaleString()} />
        <Kpi label="Open sales orders" value={summary.openSalesOrders.toLocaleString()} />
        <Kpi label="Low stock products" value={summary.lowStockProducts.toLocaleString()} />
        <Kpi label="Revenue (MTD)" value={currency.format(summary.revenueMonthToDate)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesByChannelWidget salesByChannel={summary.salesByChannel} />
        <MarketingPerformanceWidget marketingPerformance={summary.marketingPerformance} />
      </div>
    </div>
  );
}
