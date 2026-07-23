"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export interface UploadedAttachment {
  fileUrl: string;
  fileName: string;
  contentType?: string;
}

const ACCEPTED_TYPES = "application/pdf,image/jpeg,image/jpg,image/png";

/**
 * Multiple direct-to-Vercel-Blob uploads (supplier invoice, delivery
 * challan, packing slip, GRN copy, receipts, ...) — see DECISIONS.md
 * "Multi-document attachments". Each file uploads as soon as it's picked;
 * the parent form just carries the resulting URLs until submit.
 */
export function MultiFileUpload({
  label = "Documents",
  attachments,
  onChange,
}: {
  label?: string;
  attachments: UploadedAttachment[];
  onChange: (attachments: UploadedAttachment[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: UploadedAttachment[] = [];
      for (const file of Array.from(files)) {
        const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/uploads" });
        uploaded.push({ fileUrl: blob.url, fileName: file.name, contentType: file.type || undefined });
      }
      onChange([...attachments, ...uploaded]);
    } catch {
      toast.error("Couldn't upload one or more files.");
    } finally {
      setUploading(false);
    }
  }

  function removeAt(index: number) {
    onChange(attachments.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface-secondary">
        <Paperclip className="h-3.5 w-3.5" />
        {uploading ? "Uploading…" : "Attach files (PDF, JPG, PNG)"}
        <input
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {attachments.length > 0 && (
        <ul className="flex flex-col gap-1">
          {attachments.map((attachment, index) => (
            <li
              key={`${attachment.fileUrl}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
            >
              <a
                href={attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-accent hover:underline"
              >
                {attachment.fileName}
              </a>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="shrink-0 text-faint hover:text-destructive"
                aria-label={`Remove ${attachment.fileName}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
