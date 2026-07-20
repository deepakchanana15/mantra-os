"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ProductOption {
  id: string;
  name: string;
  unitPrice: string;
  unitCost: string | null;
}

export interface LineItemRow {
  productId: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Reused by Quotes, Sales Orders, and Purchase Orders create forms — the
 * "pick product, quantity, price, add/remove rows" pattern is identical
 * across all three, only the price source (unitPrice vs unitCost) differs.
 */
export function LineItemsEditor({
  products,
  priceLabel,
  priceSource,
  lines,
  onChange,
}: {
  products: ProductOption[];
  priceLabel: string;
  priceSource: "unitPrice" | "unitCost";
  lines: LineItemRow[];
  onChange: (lines: LineItemRow[]) => void;
}) {
  function addRow() {
    onChange([...lines, { productId: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeRow(index: number) {
    onChange(lines.filter((_, i) => i !== index));
  }

  function updateRow(index: number, patch: Partial<LineItemRow>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function selectProduct(index: number, product: ProductOption) {
    const price = Number(product[priceSource] ?? product.unitPrice ?? 0);
    updateRow(index, { productId: product.id, unitPrice: price });
  }

  return (
    <div className="flex flex-col gap-2">
      {lines.map((line, index) => {
        const product = products.find((p) => p.id === line.productId);
        return (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              {index === 0 && <label className="mb-1 block text-xs font-medium text-muted-foreground">Product</label>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {product?.name ?? "Select a product"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  {products.map((p) => (
                    <DropdownMenuItem key={p.id} onSelect={() => selectProduct(index, p)}>
                      {p.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="w-24">
              {index === 0 && <label className="mb-1 block text-xs font-medium text-muted-foreground">Qty</label>}
              <Input
                type="number"
                min="1"
                value={line.quantity}
                onChange={(e) => updateRow(index, { quantity: Number(e.target.value) })}
              />
            </div>
            <div className="w-28">
              {index === 0 && <label className="mb-1 block text-xs font-medium text-muted-foreground">{priceLabel}</label>}
              <Input
                type="number"
                min="0"
                step="0.01"
                value={line.unitPrice}
                onChange={(e) => updateRow(index, { unitPrice: Number(e.target.value) })}
              />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(index)} aria-label="Remove line">
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" className="mt-1 w-fit" onClick={addRow}>
        <Plus className="h-3.5 w-3.5" />
        Add line
      </Button>
    </div>
  );
}
