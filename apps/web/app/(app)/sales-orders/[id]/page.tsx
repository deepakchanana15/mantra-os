import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";

interface SalesOrder {
  id: string;
  status: string;
  orderDate: string;
  customer: { name: string };
  lines: { id: string; quantity: number; unitPrice: string; product: { name: string; sku: string } }[];
  shipments: { id: string; status: string; trackingNumber: string | null }[];
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  PENDING: "neutral",
  CONFIRMED: "warning",
  PARTIALLY_SHIPPED: "warning",
  SHIPPED: "success",
  CANCELLED: "destructive",
};

export default async function SalesOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await apiFetch<SalesOrder>(`/v1/sales-orders/${params.id}`);
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const total = order.lines.reduce((sum, l) => sum + l.quantity * Number(l.unitPrice), 0);

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/sales-orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Sales Orders
          </Link>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-foreground">{order.customer.name}</h1>
            <Badge variant={STATUS_VARIANT[order.status] ?? "neutral"}>{order.status}</Badge>
          </div>
          <p className="text-xs text-faint">Ordered {new Date(order.orderDate).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/shipments/new?salesOrderId=${order.id}`}>
            <Button variant="outline">
              <Truck className="h-4 w-4" />
              Create Shipment
            </Button>
          </Link>
          <DeleteEntityButton apiPath={`/api/v1/sales-orders/${order.id}`} entityLabel="Sales Order" redirectTo="/sales-orders" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Line Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  <div className="font-medium text-foreground">{line.product.name}</div>
                  <div className="font-mono text-xs text-faint">{line.product.sku}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                <TableCell className="text-right tabular-nums">{currency.format(Number(line.unitPrice))}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {currency.format(line.quantity * Number(line.unitPrice))}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="text-right font-semibold text-foreground">
                Total
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums text-foreground">
                {currency.format(total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {order.shipments.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Shipments</h2>
          <div className="flex flex-col gap-2">
            {order.shipments.map((shipment) => (
              <Link
                key={shipment.id}
                href={`/shipments/${shipment.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm hover:border-accent"
              >
                <span className="text-foreground">{shipment.trackingNumber ?? "No tracking number"}</span>
                <Badge variant="neutral">{shipment.status}</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
