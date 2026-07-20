"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

interface PurchaseOrderLine {
  id: string;
  quantity: number;
  product: { name: string; sku: string };
}

interface PurchaseOrder {
  id: string;
  supplier: { name: string };
  lines: PurchaseOrderLine[];
}

interface Warehouse {
  id: string;
  name: string;
}

function NewGoodsReceiptForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseOrderId = searchParams.get("purchaseOrderId");

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState<string | undefined>(undefined);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!purchaseOrderId) return;
    fetch(`/api/v1/purchase-orders/${purchaseOrderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PurchaseOrder | null) => {
        setOrder(data);
        if (data) {
          setQuantities(Object.fromEntries(data.lines.map((l) => [l.id, l.quantity])));
        }
      });
    fetch("/api/v1/warehouses").then((res) => (res.ok ? res.json() : [])).then(setWarehouses);
  }, [purchaseOrderId]);

  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!order || !warehouseId) return;
    const lines = order.lines
      .filter((l) => quantities[l.id] > 0)
      .map((l) => ({ purchaseOrderLineId: l.id, quantity: quantities[l.id] }));
    if (lines.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/v1/goods-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseOrderId: order.id, warehouseId, lines }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't record the receipt.");
        return;
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

          <div className="mt-2 flex gap-2">
            <Button type="submit" disabled={loading || !warehouseId}>
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
