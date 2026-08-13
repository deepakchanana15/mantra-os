"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDollarSign } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { MultiFileUpload, type UploadedAttachment } from "@/components/domain/multi-file-upload";

/**
 * Marking an invoice paid always requires proof of payment (a bank
 * statement screenshot) — see DECISIONS.md "Invoice payment confirmation".
 * The backend rejects the request if no attachment is attached, so the
 * submit button is disabled client-side until at least one is uploaded.
 */
export function MarkInvoicePaidButton({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/invoices/${invoiceId}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachments }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Couldn't mark this invoice as paid.");
        return;
      }
      toast.success(`${invoiceNumber} marked as paid`);
      setOpen(false);
      setAttachments([]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CircleDollarSign className="h-3.5 w-3.5" />
          Mark as Paid
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark {invoiceNumber} as paid?</DialogTitle>
          <DialogDescription>
            Upload a screenshot of the bank statement showing this payment was received, then confirm. This updates the
            invoice status and keeps a record of proof of payment.
          </DialogDescription>
        </DialogHeader>
        <MultiFileUpload label="Bank statement screenshot" attachments={attachments} onChange={setAttachments} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={loading || attachments.length === 0} onClick={handleConfirm}>
            {loading ? "Marking as paid…" : "Mark as Paid"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
