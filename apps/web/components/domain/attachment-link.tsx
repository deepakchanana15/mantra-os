"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";

/**
 * Attachments are private-access blobs, not public — see DECISIONS.md
 * "Attachments switched to private access". The stored URL alone isn't
 * fetchable by anyone who has it; this asks the server for a short-lived
 * signed URL at the moment of opening, instead of a plain <a href>.
 */
export function AttachmentLink({
  url,
  fileName,
  className = "flex w-fit items-center gap-1 text-accent hover:underline",
}: {
  url: string;
  fileName: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/attachments/view-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't open this file.");
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className}>
      <Paperclip className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{loading ? "Opening…" : fileName}</span>
    </button>
  );
}
