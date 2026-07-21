"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LineItemsEditor, type LineItemRow, type ProductOption } from "@/components/domain/line-items-editor";
import { CompanyCountrySelect } from "@/components/domain/company-country-select";

interface Customer {
  id: string;
  name: string;
}

export default function NewSalesOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [countryId, setCountryId] = useState<string | undefined>(undefined);
  const [lines, setLines] = useState<LineItemRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/customers").then((res) => (res.ok ? res.json() : [])).then(setCustomers);
    fetch("/api/v1/products").then((res) => (res.ok ? res.json() : [])).then(setProducts);
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const validLines = lines.filter((l) => l.productId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || validLines.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, companyId, countryId, lines: validLines }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the sales order.");
        return;
      }
      toast.success("Sales order created");
      router.push(`/sales-orders/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <Link href="/sales-orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Sales Orders
        </Link>
        <h1 className="mt-1 text-xl font-bold text-foreground">New Sales Order</h1>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label>Customer</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {selectedCustomer?.name ?? "Select a customer"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  {customers.map((c) => (
                    <DropdownMenuItem key={c.id} onSelect={() => setCustomerId(c.id)}>
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <CompanyCountrySelect
              companyId={companyId}
              countryId={countryId}
              onCompanyChange={setCompanyId}
              onCountryChange={setCountryId}
            />

            <LineItemsEditor
              products={products}
              priceLabel="Unit Price"
              priceSource="unitPrice"
              lines={lines}
              onChange={setLines}
            />

            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={loading || !customerId || validLines.length === 0}>
                {loading ? "Creating…" : "Create sales order"}
              </Button>
              <Link href="/sales-orders">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
