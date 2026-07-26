"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

/**
 * A lead only becomes a Customer through this explicit action — never
 * automatically — since conversion often follows an offline conversation
 * (a phone call) that nothing in the data can infer. See DECISIONS.md
 * "Leads are not Customers".
 */
export function ConvertToCustomerButton({ opportunityId, leadName }: { opportunityId: string; leadName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConvert() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/opportunities/${opportunityId}/convert-to-customer`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Couldn't convert this lead to a customer.");
        return;
      }
      toast.success(`${leadName} is now a customer`);
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-3.5 w-3.5" />
          Convert to Customer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert {leadName} to a customer?</DialogTitle>
          <DialogDescription>
            Creates a Customer record from this lead&apos;s contact details and links it to this opportunity. Do this
            once the sale is confirmed — for example after a phone call closes the deal.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={loading} onClick={handleConvert}>
            {loading ? "Converting…" : "Convert to Customer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
