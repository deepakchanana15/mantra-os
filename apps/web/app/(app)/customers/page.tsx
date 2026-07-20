import Link from "next/link";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerSearch } from "./customer-search";
import { CustomerTypeFilter } from "./customer-type-filter";
import { ExportCustomersButton } from "./export-customers-button";

interface Customer {
  id: string;
  name: string;
  type: "INDIVIDUAL" | "COMPANY";
  email: string | null;
  phone: string | null;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { search?: string; type?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams.search) params.set("search", searchParams.search);
  const customers = await apiFetch<Customer[]>(`/v1/customers?${params.toString()}`);
  const filtered = searchParams.type ? customers.filter((c) => c.type === searchParams.type) : customers;

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} customers</p>
        </div>
        <Link href="/customers/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Customer
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <CustomerSearch />
        <CustomerTypeFilter />
        <div className="ml-auto">
          <ExportCustomersButton customers={filtered} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-faint">
                  No customers yet.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link href={`/customers/${customer.id}`} className="font-medium text-foreground hover:text-accent">
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{customer.type === "COMPANY" ? "Company" : "Individual"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{customer.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.phone ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
