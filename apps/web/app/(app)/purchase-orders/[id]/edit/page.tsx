"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { isValidDateInputValue } from "@/lib/date-input";

interface Supplier {
  id: string;
  name: string;
}

interface Currency {
  id: string;
  code: string;
  name: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string | null;
  status: string;
  deliveryDueDate: string | null;
  supplierId: string;
  companyId: string | null;
  countryId: string | null;
  currencyId: string | null;
  lines: { productId: string; quantity: number; unitCost: string }[];
}

function isoDate(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export default function EditPurchaseOrderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined);
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [countryId, setCountryId] = useState<string | undefined>(undefined);
  const [currencyId, setCurrencyId] = useState<string | undefined>(undefined);
  const [poNumber, setPoNumber] = useState("");
  const [deliveryDueDate, setDeliveryDueDate] = useState("");
  const [lines, setLines] = useState<LineItemRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/suppliers").then((res) => (res.ok ? res.json() : [])).then(setSuppliers);
    fetch("/api/v1/products").then((res) => (res.ok ? res.json() : [])).then(setProducts);
    fetch("/api/v1/currencies").then((res) => (res.ok ? res.json() : [])).then(setCurrencies);
    fetch(`/api/v1/purchase-orders/${params.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((order: PurchaseOrder | null) => {
        if (!order) {
          toast.error("Couldn't load this purchase order.");
          router.push("/purchase-orders");
          return;
        }
        if (order.status !== "DRAFT") {
          toast.error("Only draft purchase orders can be edited.");
          router.push(`/purchase-orders/${order.id}`);
          return;
        }
        setSupplierId(order.supplierId);
        setCompanyId(order.companyId ?? undefined);
        setCountryId(order.countryId ?? undefined);
        setCurrencyId(order.currencyId ?? undefined);
        setPoNumber(order.poNumber ?? "");
        setDeliveryDueDate(isoDate(order.deliveryDueDate));
        setLines(order.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: Number(l.unitCost) })));
        setLoaded(true);
      });
  }, [params.id, router]);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const selectedCurrency = currencies.find((c) => c.id === currencyId);
  const validLines = lines.filter((l) => l.productId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId || validLines.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/purchase-orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          poNumber: poNumber || undefined,
          deliveryDueDate: deliveryDueDate || undefined,
          companyId,
          countryId,
          currencyId,
          lines: validLines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitPrice })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't save changes.");
        return;
      }
      toast.success("Purchase order updated");
      router.push(`/purchase-orders/${params.id}`);
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) {
    return (
      <div className="flex flex-col gap-5 p-7">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <Link href={`/purchase-orders/${params.id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <h1 className="mt-1 text-xl font-bold text-foreground">Edit Purchase Order</h1>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="poNumber">PO number</Label>
              <Input id="poNumber" placeholder="Optional — e.g. PO-2026-001" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deliveryDueDate">Delivery due date</Label>
              <Input
                id="deliveryDueDate"
                type="date"
                min="1900-01-01"
                max="2099-12-31"
                value={deliveryDueDate}
                onChange={(e) => {
                  if (isValidDateInputValue(e.target.value)) setDeliveryDueDate(e.target.value);
                }}
              />
            </div>
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
                {loading ? "Saving…" : "Save changes"}
              </Button>
              <Link href={`/purchase-orders/${params.id}`}>
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
