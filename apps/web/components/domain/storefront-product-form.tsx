"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
}

export interface StorefrontProductInitial {
  id?: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  price: string | null;
  currency: string;
  stockQty: number | null;
  categoryId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[];
}

export function StorefrontProductForm({ siteId, initial }: { siteId: string; initial?: StorefrontProductInitial }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "");
  const [stockQty, setStockQty] = useState(initial?.stockQty?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? undefined);
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [metaKeywords, setMetaKeywords] = useState(initial?.metaKeywords?.join(", ") ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/storefront/sites/${siteId}/categories`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setCategories);
  }, [siteId]);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug || !currency) return;
    setSaving(true);
    try {
      const body = {
        name,
        slug,
        sku: sku || undefined,
        description: description || undefined,
        price: price ? Number(price) : undefined,
        currency,
        stockQty: stockQty ? Number(stockQty) : undefined,
        categoryId: categoryId || undefined,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        metaKeywords: metaKeywords
          ? metaKeywords.split(",").map((k) => k.trim()).filter(Boolean)
          : undefined,
      };
      const res = await fetch(
        isEdit ? `/api/v1/storefront/sites/${siteId}/products/${initial!.id}` : `/api/v1/storefront/sites/${siteId}/products`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't save this product.");
        return;
      }
      toast.success(isEdit ? "Product saved" : "Product created");
      if (!isEdit) {
        router.push(`/websites/${siteId}/products/${data.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Product details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pName">Name</Label>
              <Input id="pName" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pSlug">Slug</Label>
              <Input id="pSlug" required value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pSku">SKU</Label>
              <Input id="pSku" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pPrice">Price</Label>
              <Input id="pPrice" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pCurrency">Currency</Label>
              <Input id="pCurrency" required value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pStock">Stock quantity</Label>
              <Input id="pStock" type="number" min="0" value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {selectedCategory?.name ?? "No category"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                  <DropdownMenuItem onSelect={() => setCategoryId(undefined)}>No category</DropdownMenuItem>
                  {categories.map((c) => (
                    <DropdownMenuItem key={c.id} onSelect={() => setCategoryId(c.id)}>
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pDescription">Description</Label>
            <Textarea id="pDescription" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pMetaTitle">Meta title ({metaTitle.length}/70)</Label>
            <Input id="pMetaTitle" maxLength={70} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pMetaDescription">Meta description ({metaDescription.length}/160)</Label>
            <Textarea id="pMetaDescription" rows={3} maxLength={160} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pMetaKeywords">Meta keywords (comma-separated)</Label>
            <Input id="pMetaKeywords" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" disabled={saving || !name || !slug || !currency}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
