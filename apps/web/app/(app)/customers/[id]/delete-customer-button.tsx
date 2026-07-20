"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

/**
 * Deletion is governed by DeletionGuardService on the backend (Owner-delegated
 * grants, no self-delete, 1/day limit — see DECISIONS.md "Deletion
 * governance"). This button doesn't re-implement any of that; it just
 * surfaces whatever the API says, including the specific reason if denied.
 */
export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/customers/${customerId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Couldn't delete this customer.");
        return;
      }
      toast.success("Customer deleted");
      router.push("/customers");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this customer?</DialogTitle>
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
            {loading ? "Deleting…" : "Delete customer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
