"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyCountrySelect } from "@/components/domain/company-country-select";
import { isValidDateInputValue } from "@/lib/date-input";
import { OPPORTUNITY_STAGES, opportunityStageDescription } from "@/lib/opportunity-stages";
import { OPPORTUNITY_LOST_REASONS, opportunityLostReasonLabel } from "@/lib/opportunity-lost-reasons";

export default function NewOpportunityPage() {
  const router = useRouter();
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [name, setName] = useState("");
  const [stage, setStage] = useState("NEW");
  const [lostReason, setLostReason] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [countryId, setCountryId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const selectedStage = OPPORTUNITY_STAGES.find((s) => s.value === stage);
  const selectedLostReason = OPPORTUNITY_LOST_REASONS.find((r) => r.value === lostReason);
  const isLost = stage === "LOST";
  const notesRequired = isLost && lostReason === "OTHER";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leadName || !leadEmail) return;
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
      const res = await fetch("/api/v1/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName,
          leadEmail,
          leadPhone: leadPhone || undefined,
          name,
          stage,
          lostReason: isLost ? lostReason : undefined,
          estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
          expectedCloseDate: expectedCloseDate || undefined,
          notes: notes || undefined,
          companyId,
          countryId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the opportunity.");
        return;
      }
      toast.success(
        data.customerId
          ? "Opportunity created and linked to the matching existing customer"
          : "Opportunity created",
      );
      router.push("/opportunities");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <Link href="/opportunities" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Opportunities
        </Link>
        <h1 className="mt-1 text-xl font-bold text-foreground">New Opportunity</h1>
      </div>

      <Card className="max-w-xl">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
              <p className="text-xs text-faint">
                Who this opportunity is with. If the email matches an existing customer, it links automatically —
                otherwise it&apos;s saved as a lead until you convert it.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="leadName">Contact name</Label>
                <Input id="leadName" required value={leadName} onChange={(e) => setLeadName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="leadEmail">Email</Label>
                  <Input
                    id="leadEmail"
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="leadPhone">Phone</Label>
                  <Input id="leadPhone" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Opportunity name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="expectedCloseDate">Expected close date</Label>
                <Input
                  id="expectedCloseDate"
                  type="date"
                  min="1900-01-01"
                  max="2099-12-31"
                  value={expectedCloseDate}
                  onChange={(e) => {
                    if (isValidDateInputValue(e.target.value)) setExpectedCloseDate(e.target.value);
                  }}
                />
              </div>
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

            <CompanyCountrySelect
              companyId={companyId}
              countryId={countryId}
              onCompanyChange={setCompanyId}
              onCountryChange={setCountryId}
            />

            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={loading || !leadName || !leadEmail}>
                {loading ? "Creating…" : "Create opportunity"}
              </Button>
              <Link href="/opportunities">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
