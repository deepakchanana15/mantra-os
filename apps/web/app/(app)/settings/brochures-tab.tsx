"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface BrochureField {
  key: "brochureUrlEn" | "brochureUrlDe" | "brochureUrlNl";
  label: string;
}

const FIELDS: BrochureField[] = [
  { key: "brochureUrlEn", label: "English" },
  { key: "brochureUrlDe", label: "German" },
  { key: "brochureUrlNl", label: "Dutch" },
];

/**
 * Replaces a brochure PDF: upload direct-to-Vercel-Blob (public, since
 * POST /v1/leads/brochure and the emails it sends need a URL anyone can
 * fetch, unlike MultiFileUpload's private attachments), then PATCH the new
 * URL into OrganizationSettings. Never a code change or redeploy to update
 * a brochure — see DECISIONS.md-equivalent comment on OrganizationSettings.
 */
export function BrochuresTab({
  initialBrochureUrlEn,
  initialBrochureUrlDe,
  initialBrochureUrlNl,
}: {
  initialBrochureUrlEn: string | null;
  initialBrochureUrlDe: string | null;
  initialBrochureUrlNl: string | null;
}) {
  const [urls, setUrls] = useState<Record<BrochureField["key"], string | null>>({
    brochureUrlEn: initialBrochureUrlEn,
    brochureUrlDe: initialBrochureUrlDe,
    brochureUrlNl: initialBrochureUrlNl,
  });
  const [uploading, setUploading] = useState<BrochureField["key"] | null>(null);

  async function handleUpload(key: BrochureField["key"], file: File) {
    setUploading(key);
    try {
      const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/uploads" });
      const res = await fetch("/api/v1/organizations/me/brochures", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: blob.url }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Couldn't save the brochure.");
        return;
      }
      setUrls((prev) => ({ ...prev, [key]: blob.url }));
      toast.success("Brochure updated");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Brochures</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          The PDF(s) sent to B2B leads who submit a wholesale/contact enquiry on any of your sites. Upload a new
          file here any time to replace one — no code change needed.
        </p>
        {FIELDS.map((field) => (
          <div key={field.key} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <div className="flex items-center gap-2.5 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-faint" />
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{field.label}</span>
                {urls[field.key] ? (
                  <a href={urls[field.key]!} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                    View current file
                  </a>
                ) : (
                  <span className="text-xs text-faint">Not uploaded yet</span>
                )}
              </div>
            </div>
            <label>
              <Button type="button" variant="outline" size="sm" disabled={uploading === field.key} asChild>
                <span className="cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  {uploading === field.key ? "Uploading…" : urls[field.key] ? "Replace" : "Upload"}
                </span>
              </Button>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={uploading !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(field.key, file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
