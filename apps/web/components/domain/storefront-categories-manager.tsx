"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StorefrontConfirmDeleteButton } from "./storefront-confirm-delete-button";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function StorefrontCategoriesManager({ siteId }: { siteId: string }) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/storefront/sites/${siteId}/categories`);
    setCategories(res.ok ? await res.json() : []);
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/storefront/sites/${siteId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Couldn't create this category.");
        return;
      }
      setName("");
      setSlug("");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/v1/storefront/sites/${siteId}/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't delete this category.");
      return;
    }
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="catName">Name</Label>
          <Input id="catName" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="catSlug">Slug</Label>
          <Input id="catSlug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <Button type="submit" disabled={saving || !name || !slug}>
          Add category
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories === null ? (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-sm text-faint">
                  Loading…
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-sm text-faint">
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium text-foreground">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>
                    <StorefrontConfirmDeleteButton label="category" onConfirm={() => handleDelete(category.id)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
