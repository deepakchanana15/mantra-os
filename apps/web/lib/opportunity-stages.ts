/**
 * Single source of truth for the OpportunityStage values shown across
 * Opportunities — mirrors apps/api's Prisma-generated OpportunityStage enum
 * by hand (apps/web has no direct dependency on @mantra-os/db; it only
 * talks to the API over HTTP). Keep in sync with
 * packages/db/prisma/schema.prisma's OpportunityStage enum. Same shape as
 * lib/customer-types.ts — descriptions are the user's own wording for when
 * to pick each stage, shown below the stage dropdown as it's being chosen.
 */
export interface OpportunityStageOption {
  value: string;
  label: string;
  description: string;
}

export const OPPORTUNITY_STAGES: OpportunityStageOption[] = [
  { value: "NEW", label: "New", description: "A new lead has arrived but nobody has contacted them yet." },
  {
    value: "ATTEMPTING_CONTACT",
    label: "Attempting Contact",
    description: "WhatsApp messages / Email sent, but the customer has not responded. Follow-up is still in progress.",
  },
  {
    value: "QUALIFIED",
    label: "Qualified",
    description: "Customer responds and confirms genuine interest, buying intent, or a relevant requirement.",
  },
  {
    value: "PROPOSAL",
    label: "Proposal",
    description: "You have shared a specific product recommendation, quotation, or offer with an interested customer.",
  },
  {
    value: "NEGOTIATION",
    label: "Negotiation",
    description: "The customer is discussing price, delivery, payment, or other purchase terms.",
  },
  {
    value: "WON",
    label: "Won",
    description: "The customer has completed the purchase according to your defined sales policy.",
  },
  {
    value: "LOST",
    label: "Lost",
    description: "The lead is invalid, explicitly declines, is disqualified, or has completed your follow-up process without responding.",
  },
];

export function opportunityStageLabel(value: string): string {
  return OPPORTUNITY_STAGES.find((s) => s.value === value)?.label ?? value;
}

export function opportunityStageDescription(value: string): string | undefined {
  return OPPORTUNITY_STAGES.find((s) => s.value === value)?.description;
}
