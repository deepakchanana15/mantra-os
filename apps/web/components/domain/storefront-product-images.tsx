"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StorefrontConfirmDeleteButton } from "./storefront-confirm-delete-button";

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
}

/** Uploads straight to the site's own Cloudinary account (via the media
 * endpoint) and attaches the resulting URL to this product in one step. */
export function StorefrontProductImages({ siteId, productId, images }: { siteId: string; productId: string; images: ProductImage[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch(`/api/v1/storefront/sites/${siteId}/media`, { method: "POST", body: formData });
      const media = await uploadRes.json();
      if (!uploadRes.ok) {
        toast.error(media.error?.message ?? "Upload failed.");
        return;
      }
      const attachRes = await fetch(`/api/v1/storefront/sites/${siteId}/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: media.url, isPrimary: images.length === 0 }),
      });
      if (!attachRes.ok) {
        toast.error("Image uploaded but couldn't attach it to the product.");
        return;
      }
      toast.success("Image added");
      router.refresh();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(imageId: string) {
    const res = await fetch(`/api/v1/storefront/sites/${siteId}/products/${productId}/images/${imageId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't remove this image.");
      return;
    }
    router.refresh();
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Images</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {images.length === 0 ? (
          <p className="text-sm text-faint">No images yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((image) => (
              <div key={image.id} className="flex flex-col gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.altText ?? ""} className="aspect-square w-full rounded border border-border object-cover" />
                <StorefrontConfirmDeleteButton label="image" onConfirm={() => handleRemove(image.id)} />
              </div>
            ))}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
        <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading…" : "Add image"}
        </Button>
      </CardContent>
    </Card>
  );
}
