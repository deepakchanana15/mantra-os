import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface RevenueBreakdownStat {
  label: string;
  orders: number;
  revenue: number;
}

/** Shown on both Dashboard and Reports — same summary endpoint, see ARCHITECTURE.md "Reports and Dashboard are not domains". */
export function RevenueBreakdownWidget({ title, labelHeading, stats }: { title: string; labelHeading: string; stats: RevenueBreakdownStat[] }) {
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">{title}</div>
        {stats.length === 0 ? (
          <p className="py-4 text-center text-sm text-faint">No sales orders this month.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labelHeading}</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((stat) => (
                <TableRow key={stat.label}>
                  <TableCell className="text-foreground">{stat.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{stat.orders.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{currency.format(stat.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
