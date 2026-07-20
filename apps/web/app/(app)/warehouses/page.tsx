import Link from "next/link";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";

interface Warehouse {
  id: string;
  name: string;
  address: { city?: string; country?: string } | null;
}

export default async function WarehousesPage() {
  const warehouses = await apiFetch<Warehouse[]>("/v1/warehouses");

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Warehouses</h1>
          <p className="text-sm text-muted-foreground">{warehouses.length} warehouses</p>
        </div>
        <Link href="/warehouses/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Warehouse
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-sm text-faint">
                  No warehouses yet.
                </TableCell>
              </TableRow>
            ) : (
              warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium text-foreground">{warehouse.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {[warehouse.address?.city, warehouse.address?.country].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <DeleteEntityButton apiPath={`/api/v1/warehouses/${warehouse.id}`} entityLabel="Warehouse" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
