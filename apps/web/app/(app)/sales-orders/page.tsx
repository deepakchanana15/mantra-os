import Link from "next/link";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SalesOrder {
  id: string;
  status: string;
  orderDate: string;
  customer: { name: string };
  lines: { quantity: number; unitPrice: string }[];
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  PENDING: "neutral",
  CONFIRMED: "warning",
  PARTIALLY_SHIPPED: "warning",
  SHIPPED: "success",
  CANCELLED: "destructive",
};

export default async function SalesOrdersPage() {
  const orders = await apiFetch<SalesOrder[]>("/v1/sales-orders");
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sales Orders</h1>
          <p className="text-sm text-muted-foreground">{orders.length} orders</p>
        </div>
        <Link href="/sales-orders/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Sales Order
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-faint">
                  No sales orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const total = order.lines.reduce((sum, l) => sum + l.quantity * Number(l.unitPrice), 0);
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/sales-orders/${order.id}`} className="font-medium text-foreground hover:text-accent">
                        {order.customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[order.status] ?? "neutral"}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency.format(total)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
