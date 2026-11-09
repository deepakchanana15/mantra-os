/** Mirrors apps/api's OpportunitySource enum by hand — same reasoning as lib/opportunity-stages.ts. */
const OPPORTUNITY_SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  WEBSITE: "Website",
  META_LEAD_AD: "Meta lead ad",
  WHATSAPP: "WhatsApp",
};

export function opportunitySourceLabel(value: string): string {
  return OPPORTUNITY_SOURCE_LABELS[value] ?? value;
}
