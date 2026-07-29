"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const STAGES = [
  { value: "NEW", label: "New" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

/**
 * Every Opportunity is editable regardless of source (manual, Meta,
 * WhatsApp, etc.) — the person working the deal updates stage and value
 * here as it progresses; only converting to a Customer is a separate,
 * explicit action. See DECISIONS.md.
 */
export function EditOpportunityButton({
  opportunityId,
  currentStage,
  currentEstimatedValue,
}: {
  opportunityId: string;
  currentStage: string;
  currentEstimatedValue: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(currentStage);
  const [estimatedValue, setEstimatedValue] = useState(currentEstimatedValue ?? "");

  const selectedStage = STAGES.find((s) => s.value === stage);

  function handleOpenChange(next: boolean) {
    if (next) {
      setStage(currentStage);
      setEstimatedValue(currentEstimatedValue ?? "");
    }
    setOpen(next);
  }

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          estimatedValue: estimatedValue ? Number(estimatedValue) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Couldn't update this opportunity.");
        return;
      }
      toast.success("Opportunity updated");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit opportunity</DialogTitle>
          <DialogDescription>Update the stage and estimated value as the deal progresses.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Stage</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" type="button" className="w-full justify-start">
                  {selectedStage?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                {STAGES.map((s) => (
                  <DropdownMenuItem key={s.value} onSelect={() => setStage(s.value)}>
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estimatedValue">Estimated value</Label>
            <Input
              id="estimatedValue"
              type="number"
              min="0"
              step="0.01"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={loading} onClick={handleSave}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
