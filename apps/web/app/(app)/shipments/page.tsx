import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Shipment {
  id: string;
  status: string;
  trackingNumber: string | null;
  createdAt: string;
  warehouse: { name: string };
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  PENDING: "neutral",
  IN_TRANSIT: "warning",
  DELIVERED: "success",
  CANCELLED: "destructive",
};

export default async function ShipmentsPage() {
  const shipments = await apiFetch<Shipment[]>("/v1/shipments");

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <h1 className="text-xl font-bold text-foreground">Shipments</h1>
        <p className="text-sm text-muted-foreground">
          {shipments.length} shipments — created from a Sales Order&apos;s &quot;Create Shipment&quot; action.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-faint">
                  No shipments yet.
                </TableCell>
              </TableRow>
            ) : (
              shipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell>
                    <Link href={`/shipments/${shipment.id}`} className="font-medium text-foreground hover:text-accent">
                      {shipment.trackingNumber ?? "No tracking number"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{shipment.warehouse.name}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[shipment.status] ?? "neutral"}>{shipment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(shipment.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
