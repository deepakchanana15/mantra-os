"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

/**
 * Deletion is governed entirely by DeletionGuardService on the backend
 * (Owner-delegated grants, no self-delete, 1/day limit — see DECISIONS.md
 * "Deletion governance"). This component never re-implements any of that;
 * it just surfaces whatever the API says, including the specific reason
 * if denied. Reused across every domain that supports deletion.
 */
export function DeleteEntityButton({
  apiPath,
  entityLabel,
  redirectTo,
  onDeleted,
}: {
  apiPath: string;
  entityLabel: string;
  redirectTo?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(apiPath, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? `Couldn't delete this ${entityLabel.toLowerCase()}.`);
        return;
      }
      toast.success(`${entityLabel} deleted`);
      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
      onDeleted?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this {entityLabel.toLowerCase()}?</DialogTitle>
          <DialogDescription>
            This can&apos;t be undone by you — deletion is logged and limited to 1 per day. If you don&apos;t have
            permission, the API will explain why.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={loading} onClick={handleDelete}>
            {loading ? "Deleting…" : `Delete ${entityLabel.toLowerCase()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
