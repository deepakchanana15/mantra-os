"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StorefrontConfirmDeleteButton } from "./storefront-confirm-delete-button";

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  sku: string | null;
  price: string | null;
}

export function StorefrontProductVariants({ siteId, productId, variants }: { siteId: string; productId: string; variants: ProductVariant[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name || !value) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/storefront/sites/${siteId}/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, value }),
      });
      if (!res.ok) {
        toast.error("Couldn't add this variant.");
        return;
      }
      setName("");
      setValue("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(variantId: string) {
    const res = await fetch(`/api/v1/storefront/sites/${siteId}/products/${productId}/variants/${variantId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't remove this variant.");
      return;
    }
    router.refresh();
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Variants</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {variants.length === 0 ? (
          <p className="text-sm text-faint">No variants yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {variants.map((v) => (
              <li key={v.id} className="flex items-center justify-between rounded border border-border p-2 text-sm">
                <span>
                  {v.name}: {v.value} {v.sku ? `(${v.sku})` : ""}
                </span>
                <StorefrontConfirmDeleteButton label="variant" onConfirm={() => handleRemove(v.id)} />
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-end gap-2 border-t border-border pt-3">
          <Input placeholder="Name (e.g. Size)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Value (e.g. Large)" value={value} onChange={(e) => setValue(e.target.value)} />
          <Button type="button" variant="outline" disabled={saving || !name || !value} onClick={handleAdd}>
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
