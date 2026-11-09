"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** basePath is the entity's own API path, e.g. "/opportunities/<id>" or "/customers/<id>" — notes live at `${basePath}/notes`. */
export function AddNoteForm({ basePath, onAdded }: { basePath: string; onAdded: () => void }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!body.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1${basePath}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Couldn't add this note.");
        return;
      }
      setBody("");
      onAdded();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border p-4">
      <Textarea
        placeholder="Add a note — a call, an email, anything worth recording…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
      />
      <div className="flex justify-end">
        <Button size="sm" disabled={loading || !body.trim()} onClick={handleSubmit}>
          {loading ? "Saving…" : "Add note"}
        </Button>
      </div>
    </div>
  );
}
