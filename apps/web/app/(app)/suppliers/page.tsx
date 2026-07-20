import Link from "next/link";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/domain/search-input";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export default async function SuppliersPage({ searchParams }: { searchParams: { search?: string } }) {
  const params = new URLSearchParams();
  if (searchParams.search) params.set("search", searchParams.search);
  const suppliers = await apiFetch<Supplier[]>(`/v1/suppliers?${params.toString()}`);

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Suppliers</h1>
          <p className="text-sm text-muted-foreground">{suppliers.length} suppliers</p>
        </div>
        <Link href="/suppliers/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Supplier
          </Button>
        </Link>
      </div>

      <SearchInput placeholder="Search suppliers..." />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-faint">
                  No suppliers yet.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium text-foreground">{supplier.name}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.phone ?? "—"}</TableCell>
                  <TableCell>
                    <DeleteEntityButton apiPath={`/api/v1/suppliers/${supplier.id}`} entityLabel="Supplier" />
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
