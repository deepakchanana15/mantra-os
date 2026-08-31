import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface RevenueBreakdownStat {
  label: string;
  isIntercompany: boolean;
  orders: number;
  revenue: number;
}

/**
 * Shown on both Dashboard and Reports — same summary endpoint, see
 * ARCHITECTURE.md "Reports and Dashboard are not domains". Intercompany
 * rows (e.g. an India entity's export invoice to an Australian sibling
 * entity) are badged "B2B · Export" and kept as separate rows from real
 * customer revenue, even when the label is the same — see DECISIONS.md
 * "India export invoice compliance".
 */
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
                <TableRow key={`${stat.isIntercompany ? "b2b" : "customer"}-${stat.label}`}>
                  <TableCell className="text-foreground">
                    <div className="flex items-center gap-1.5">
                      {stat.label}
                      {stat.isIntercompany && (
                        <Badge variant="neutral" className="text-[10px]">
                          B2B · Export
                        </Badge>
                      )}
                    </div>
                  </TableCell>
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
