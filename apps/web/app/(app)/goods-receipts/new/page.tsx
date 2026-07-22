"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PurchaseOrderLine {
  id: string;
  quantity: number;
  unitCost: string;
  product: { name: string; sku: string };
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplier: { name: string };
  lines: PurchaseOrderLine[];
}

interface Warehouse {
  id: string;
  name: string;
}

const EXPENSE_CATEGORIES = [
  { value: "GOODS_RECEIPT", label: "Goods receipt" },
  { value: "SHIPPING", label: "Shipping" },
  { value: "OTHER", label: "Other" },
];

function NewGoodsReceiptForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseOrderId = searchParams.get("purchaseOrderId");

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState<string | undefined>(undefined);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFileUrl, setReceiptFileUrl] = useState<string | undefined>(undefined);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [recordExpense, setRecordExpense] = useState(true);
  const [vendorName, setVendorName] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("GOODS_RECEIPT");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);

  useEffect(() => {
    if (!purchaseOrderId) return;
    fetch(`/api/v1/purchase-orders/${purchaseOrderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PurchaseOrder | null) => {
        setOrder(data);
        if (data) {
          setQuantities(Object.fromEntries(data.lines.map((l) => [l.id, l.quantity])));
          setVendorName(data.supplier.name);
        }
      });
    fetch("/api/v1/warehouses").then((res) => (res.ok ? res.json() : [])).then(setWarehouses);
  }, [purchaseOrderId]);

  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);
  const selectedExpenseCategory = EXPENSE_CATEGORIES.find((c) => c.value === expenseCategory);

  const suggestedAmount = useMemo(() => {
    if (!order) return 0;
    return order.lines.reduce((sum, line) => {
      const qty = quantities[line.id] ?? 0;
      return sum + qty * Number(line.unitCost);
    }, 0);
  }, [order, quantities]);

  useEffect(() => {
    if (!amountTouched) {
      setExpenseAmount(suggestedAmount > 0 ? suggestedAmount.toFixed(2) : "");
    }
  }, [suggestedAmount, amountTouched]);

  async function handleReceiptFileChange(file: File | null) {
    setReceiptFile(file);
    setReceiptFileUrl(undefined);
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/uploads",
      });
      setReceiptFileUrl(blob.url);
    } catch {
      toast.error("Couldn't upload the receipt file.");
      setReceiptFile(null);
    } finally {
      setUploadingReceipt(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!order || !warehouseId) return;
    const lines = order.lines
      .filter((l) => quantities[l.id] > 0)
      .map((l) => ({ purchaseOrderLineId: l.id, quantity: quantities[l.id] }));
    if (lines.length === 0) return;
    if (receiptFile && !receiptFileUrl) {
      toast.error("Still uploading the receipt — wait a moment and try again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/goods-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseOrderId: order.id, warehouseId, lines, receiptFileUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't record the receipt.");
        return;
      }

      if (recordExpense && Number(expenseAmount) > 0) {
        const expenseRes = await fetch("/api/v1/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorName,
            category: expenseCategory,
            amount: Number(expenseAmount),
            notes: expenseNotes || undefined,
            receiptFileUrl,
            supplierId: order.supplierId,
            goodsReceiptId: data.id,
            purchaseOrderId: order.id,
          }),
        });
        if (!expenseRes.ok) {
          const expenseData = await expenseRes.json();
          toast.error(expenseData.error?.message ?? "Receipt recorded, but the expense couldn't be saved.");
        }
      }

      toast.success("Goods receipt recorded");
      router.push(`/goods-receipts/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  if (!purchaseOrderId) {
    return (
      <Card className="max-w-lg">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Goods receipts are created from a Purchase Order&apos;s &quot;Receive Goods&quot; action.{" "}
          <Link href="/purchase-orders" className="text-accent hover:underline">
            Go to Purchase Orders
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return <p className="text-sm text-faint">Loading order…</p>;
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="text-sm text-muted-foreground">
            Receiving order from <span className="font-medium text-foreground">{order.supplier.name}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Warehouse</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" type="button" className="w-full justify-start">
                  {selectedWarehouse?.name ?? "Select a warehouse"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                {warehouses.map((w) => (
                  <DropdownMenuItem key={w.id} onSelect={() => setWarehouseId(w.id)}>
                    {w.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Quantity received</Label>
            {order.lines.map((line) => (
              <div key={line.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{line.product.name}</div>
                  <div className="font-mono text-xs text-faint">{line.product.sku}</div>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={line.quantity}
                  className="w-24"
                  value={quantities[line.id] ?? 0}
                  onChange={(e) => setQuantities((prev) => ({ ...prev, [line.id]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label>Vendor's hard-copy receipt (optional)</Label>
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface-secondary">
                <Paperclip className="h-3.5 w-3.5" />
                {receiptFile ? receiptFile.name : "Attach photo or PDF"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => handleReceiptFileChange(e.target.files?.[0] ?? null)}
                />
              </label>
              {uploadingReceipt && <span className="text-xs text-faint">Uploading…</span>}
              {receiptFileUrl && <span className="text-xs text-accent">Uploaded</span>}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={recordExpense}
                onChange={(e) => setRecordExpense(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border accent-accent"
              />
              Also record as an expense
            </label>

            {recordExpense && (
              <div className="flex flex-col gap-3 rounded-md border border-border p-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="vendorName">Vendor</Label>
                  <Input id="vendorName" value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="expenseAmount">Amount</Label>
                    <Input
                      id="expenseAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={expenseAmount}
                      onChange={(e) => {
                        setExpenseAmount(e.target.value);
                        setAmountTouched(true);
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Category</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" type="button" className="w-full justify-start">
                          {selectedExpenseCategory?.label}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                        {EXPENSE_CATEGORIES.map((c) => (
                          <DropdownMenuItem key={c.value} onSelect={() => setExpenseCategory(c.value)}>
                            {c.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="expenseNotes">Notes</Label>
                  <Input id="expenseNotes" value={expenseNotes} onChange={(e) => setExpenseNotes(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 flex gap-2">
            <Button type="submit" disabled={loading || !warehouseId || uploadingReceipt}>
              {loading ? "Recording…" : "Record receipt"}
            </Button>
            <Link href={`/purchase-orders/${order.id}`}>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function NewGoodsReceiptPage() {
  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <Link href="/goods-receipts" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Goods Receipts
        </Link>
        <h1 className="mt-1 text-xl font-bold text-foreground">New Goods Receipt</h1>
      </div>
      <Suspense>
        <NewGoodsReceiptForm />
      </Suspense>
    </div>
  );
}
