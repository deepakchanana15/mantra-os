import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";

interface Shipment {
  id: string;
  status: string;
  trackingNumber: string | null;
  createdAt: string;
  createdBy: string;
  warehouse: { name: string };
  salesOrder: { id: string; customer: { name: string } };
  lines: { id: string; quantity: number; salesOrderLine: { product: { name: string; sku: string } } }[];
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  PENDING: "neutral",
  IN_TRANSIT: "warning",
  DELIVERED: "success",
  CANCELLED: "destructive",
};

export default async function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const shipment = await apiFetch<Shipment>(`/v1/shipments/${params.id}`);

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/shipments" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Shipments
          </Link>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-foreground">{shipment.trackingNumber ?? "Shipment"}</h1>
            <Badge variant={STATUS_VARIANT[shipment.status] ?? "neutral"}>{shipment.status}</Badge>
          </div>
          <Link href={`/sales-orders/${shipment.salesOrder.id}`} className="text-xs text-faint hover:text-accent">
            Order for {shipment.salesOrder.customer.name}
          </Link>
        </div>
        <DeleteEntityButton apiPath={`/api/v1/shipments/${shipment.id}`} entityLabel="Shipment" redirectTo="/shipments" />
      </div>

      <div className="text-sm text-muted-foreground">Shipped from {shipment.warehouse.name}</div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipment.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  <div className="font-medium text-foreground">{line.salesOrderLine.product.name}</div>
                  <div className="font-mono text-xs text-faint">{line.salesOrderLine.product.sku}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
