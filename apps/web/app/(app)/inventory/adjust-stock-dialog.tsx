"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Option {
  id: string;
  name: string;
}

export function AdjustStockDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Option[]>([]);
  const [warehouses, setWarehouses] = useState<Option[]>([]);
  const [productId, setProductId] = useState<string | undefined>(undefined);
  const [warehouseId, setWarehouseId] = useState<string | undefined>(undefined);
  const [quantityDelta, setQuantityDelta] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/v1/products")
      .then((res) => (res.ok ? res.json() : []))
      .then(setProducts);
    fetch("/api/v1/warehouses")
      .then((res) => (res.ok ? res.json() : []))
      .then(setWarehouses);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !warehouseId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/inventory/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, warehouseId, quantityDelta: Number(quantityDelta) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't record the adjustment.");
        return;
      }
      toast.success("Stock adjusted");
      setOpen(false);
      setQuantityDelta("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Adjust Stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual stock adjustment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Product</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" type="button" className="w-full justify-start">
                  {selectedProduct?.name ?? "Select a product"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                {products.map((p) => (
                  <DropdownMenuItem key={p.id} onSelect={() => setProductId(p.id)}>
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quantityDelta">Quantity change</Label>
            <Input
              id="quantityDelta"
              type="number"
              required
              placeholder="e.g. 10 or -5"
              value={quantityDelta}
              onChange={(e) => setQuantityDelta(e.target.value)}
            />
            <p className="text-xs text-faint">Positive corrects stock up, negative corrects it down.</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !productId || !warehouseId}>
              {loading ? "Saving…" : "Record adjustment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
