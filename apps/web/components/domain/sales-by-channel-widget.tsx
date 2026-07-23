import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { salesChannelLabel } from "@/lib/sales-channel";

export interface ChannelStat {
  channel: string;
  orders: number;
  revenue: number;
}

/** Shown on both Dashboard and Reports — same summary endpoint, see ARCHITECTURE.md "Reports and Dashboard are not domains". */
export function SalesByChannelWidget({ salesByChannel }: { salesByChannel: ChannelStat[] }) {
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">Sales by channel (MTD)</div>
        {salesByChannel.length === 0 ? (
          <p className="py-4 text-center text-sm text-faint">No sales orders this month.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesByChannel.map((stat) => (
                <TableRow key={stat.channel}>
                  <TableCell className="text-foreground">
                    {stat.channel === "UNSPECIFIED" ? "Unspecified" : salesChannelLabel(stat.channel)}
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
