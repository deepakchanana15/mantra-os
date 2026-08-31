import { Card, CardContent } from "@/components/ui/card";

interface PeriodTotals {
  orders: number;
  revenue: number;
}

export interface CurrencyPeriodStat {
  currency: string;
  mtd: PeriodTotals;
  ytd: PeriodTotals;
  allTime: PeriodTotals;
}

function formatCurrency(amount: number, code: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: code, currencyDisplay: "code", maximumFractionDigits: 0 }).format(amount);
}

const PERIODS = [
  { key: "mtd" as const, label: "This month" },
  { key: "ytd" as const, label: "This year" },
  { key: "allTime" as const, label: "All time" },
];

/**
 * Customer revenue only (never includes intercompany/B2B export invoices —
 * see RevenueBreakdownWidget). Split by currency rather than blended into
 * one number, since AUD and INR (etc.) totals can never just be summed.
 */
export function RevenueSummaryWidget({ revenueByCurrency }: { revenueByCurrency: CurrencyPeriodStat[] }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 text-xs font-medium text-muted-foreground">Revenue</div>
        {revenueByCurrency.length === 0 ? (
          <p className="py-4 text-center text-sm text-faint">No sales orders yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {PERIODS.map((period) => (
              <div key={period.key}>
                <div className="text-xs text-muted-foreground">{period.label}</div>
                <div className="mt-1 flex flex-col gap-0.5">
                  {revenueByCurrency.map((stat) => (
                    <div key={stat.currency} className="text-lg font-bold tabular-nums tracking-tight text-foreground">
                      {formatCurrency(stat[period.key].revenue, stat.currency)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
