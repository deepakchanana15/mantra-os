import Link from "next/link";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { purchaseOrderCurrencyCode, type PurchaseOrderCurrencySource } from "@/lib/purchase-order-currency";

interface PurchaseOrder extends PurchaseOrderCurrencySource {
  id: string;
  poNumber: string | null;
  status: string;
  orderDate: string;
  supplier: { name: string };
  lines: { quantity: number; unitCost: string }[];
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  DRAFT: "neutral",
  SENT: "warning",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED: "success",
  CANCELLED: "destructive",
};

export default async function PurchaseOrdersPage() {
  const orders = await apiFetch<PurchaseOrder[]>("/v1/purchase-orders");

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">{orders.length} orders</p>
        </div>
        <Link href="/purchase-orders/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Purchase Order
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-faint">
                  No purchase orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const total = order.lines.reduce((sum, l) => sum + l.quantity * Number(l.unitCost), 0);
                const currency = new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: purchaseOrderCurrencyCode(order),
                  currencyDisplay: "code",
                });
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/purchase-orders/${order.id}`} className="font-medium text-foreground hover:text-accent">
                        {order.poNumber ?? order.supplier.name}
                      </Link>
                      {order.poNumber && <div className="text-xs text-faint">{order.supplier.name}</div>}
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
