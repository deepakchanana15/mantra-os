"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { OPPORTUNITY_STAGES, opportunityStageDescription } from "@/lib/opportunity-stages";
import { OPPORTUNITY_LOST_REASONS, opportunityLostReasonLabel } from "@/lib/opportunity-lost-reasons";

/**
 * The Opportunity detail page's own inline editor for stage/value/lost
 * reason — lives on the page itself rather than behind a dialog, so
 * editing this and reading the activity timeline happen in the same view.
 */
export function OpportunityStageEditor({
  opportunityId,
  currentStage,
  currentLostReason,
  currentEstimatedValue,
  currentNotes,
}: {
  opportunityId: string;
  currentStage: string;
  currentLostReason: string | null;
  currentEstimatedValue: string | null;
  currentNotes: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(currentStage);
  const [lostReason, setLostReason] = useState(currentLostReason ?? "");
  const [estimatedValue, setEstimatedValue] = useState(currentEstimatedValue ?? "");
  const [notes, setNotes] = useState(currentNotes ?? "");

  const selectedStage = OPPORTUNITY_STAGES.find((s) => s.value === stage);
  const selectedLostReason = OPPORTUNITY_LOST_REASONS.find((r) => r.value === lostReason);
  const isLost = stage === "LOST";
  const notesRequired = isLost && lostReason === "OTHER";

  const isDirty =
    stage !== currentStage ||
    lostReason !== (currentLostReason ?? "") ||
    estimatedValue !== (currentEstimatedValue ?? "") ||
    notes !== (currentNotes ?? "");

  async function handleSave() {
    if (isLost && !lostReason) {
      toast.error("Pick a lost reason before saving");
      return;
    }
    if (notesRequired && !notes.trim()) {
      toast.error('Notes are required when the lost reason is "Other"');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          lostReason: isLost ? lostReason : undefined,
          estimatedValue: estimatedValue ? Number(estimatedValue) : null,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Couldn't update this opportunity.");
        return;
      }
      toast.success("Opportunity updated");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
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
            {OPPORTUNITY_STAGES.map((s) => (
              <DropdownMenuItem key={s.value} onSelect={() => setStage(s.value)}>
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <p className="text-xs text-muted-foreground">{opportunityStageDescription(stage)}</p>
      </div>

      {isLost && (
        <div className="flex flex-col gap-1.5">
          <Label>Lost reason</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" type="button" className="w-full justify-start">
                {selectedLostReason?.label ?? "Select a reason"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-72 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
              {OPPORTUNITY_LOST_REASONS.map((r) => (
                <DropdownMenuItem key={r.value} onSelect={() => setLostReason(r.value)}>
                  {r.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes{notesRequired ? " *" : ""}</Label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {notesRequired && (
          <p className="text-xs text-muted-foreground">
            Required — explain what &quot;{opportunityLostReasonLabel("OTHER")}&quot; means here.
          </p>
        )}
      </div>

      <Button disabled={loading || !isDirty} onClick={handleSave} className="self-start">
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
