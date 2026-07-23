import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { SalesByChannelWidget, type ChannelStat } from "@/components/domain/sales-by-channel-widget";

interface DashboardSummary {
  activeCustomers: number;
  openSalesOrders: number;
  lowStockProducts: number;
  revenueMonthToDate: number;
  salesByChannel: ChannelStat[];
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
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col gap-6 p-7">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">An at-a-glance summary across CRM, Sales, and Inventory.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active customers" value={summary.activeCustomers.toLocaleString()} />
        <Kpi label="Open sales orders" value={summary.openSalesOrders.toLocaleString()} />
        <Kpi label="Low stock products" value={summary.lowStockProducts.toLocaleString()} />
        <Kpi label="Revenue (MTD)" value={currency.format(summary.revenueMonthToDate)} />
      </div>

      <SalesByChannelWidget salesByChannel={summary.salesByChannel} />
    </div>
  );
}
