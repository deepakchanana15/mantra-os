"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  altText: string | null;
  createdAt: string;
}

export function StorefrontMediaManager({ siteId }: { siteId: string }) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/storefront/sites/${siteId}/media`);
    setItems(res.ok ? await res.json() : []);
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/v1/storefront/sites/${siteId}/media`, { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Upload failed.");
        return;
      }
      toast.success("Image uploaded");
      load();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/v1/storefront/sites/${siteId}/media/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't delete this image.");
      return;
    }
    toast.success("Image removed");
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
        <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading…" : "Upload image"}
        </Button>
      </div>

      {items === null ? (
        <p className="text-sm text-faint">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-faint">No media uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-2 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.altText ?? item.filename} className="aspect-square w-full rounded object-cover" />
                <p className="truncate text-xs text-muted-foreground">{item.filename}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-3 w-3" />
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
