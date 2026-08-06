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

interface Supplier {
  id: string;
  name: string;
}

interface Currency {
  id: string;
  code: string;
  name: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined);
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [countryId, setCountryId] = useState<string | undefined>(undefined);
  const [currencyId, setCurrencyId] = useState<string | undefined>(undefined);
  const [lines, setLines] = useState<LineItemRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/suppliers").then((res) => (res.ok ? res.json() : [])).then(setSuppliers);
    fetch("/api/v1/products").then((res) => (res.ok ? res.json() : [])).then(setProducts);
    fetch("/api/v1/currencies").then((res) => (res.ok ? res.json() : [])).then(setCurrencies);
  }, []);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const selectedCurrency = currencies.find((c) => c.id === currencyId);
  const validLines = lines.filter((l) => l.productId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId || validLines.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          companyId,
          countryId,
          currencyId,
          lines: validLines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitPrice })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the purchase order.");
        return;
      }
      toast.success("Purchase order created");
      router.push(`/purchase-orders/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <Link href="/purchase-orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Purchase Orders
        </Link>
        <h1 className="mt-1 text-xl font-bold text-foreground">New Purchase Order</h1>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label>Supplier</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {selectedSupplier?.name ?? "Select a supplier"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  {suppliers.map((s) => (
                    <DropdownMenuItem key={s.id} onSelect={() => setSupplierId(s.id)}>
                      {s.name}
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

            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {selectedCurrency ? `${selectedCurrency.code} — ${selectedCurrency.name}` : "Defaults to the issuing entity's currency"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  <DropdownMenuItem onSelect={() => setCurrencyId(undefined)}>
                    Defaults to the issuing entity&apos;s currency
                  </DropdownMenuItem>
                  {currencies.map((c) => (
                    <DropdownMenuItem key={c.id} onSelect={() => setCurrencyId(c.id)}>
                      {c.code} — {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-faint">
                Set this to the supplier&apos;s own invoicing currency (e.g. INR for suppliers in India) — overrides the
                Company/Country default above.
              </p>
            </div>

            <LineItemsEditor
              products={products}
              priceLabel="Unit Cost"
              priceSource="unitCost"
              lines={lines}
              onChange={setLines}
            />

            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={loading || !supplierId || validLines.length === 0}>
                {loading ? "Creating…" : "Create purchase order"}
              </Button>
              <Link href="/purchase-orders">
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
