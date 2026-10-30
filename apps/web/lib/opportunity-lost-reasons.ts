/**
 * Single source of truth for the OpportunityLostReason values — mirrors
 * apps/api's Prisma-generated OpportunityLostReason enum by hand, same
 * reasoning as lib/opportunity-stages.ts. Required whenever an Opportunity's
 * stage is set to LOST; OTHER additionally requires notes (enforced by the
 * API, not just the form) explaining what "other" means.
 */
export interface OpportunityLostReasonOption {
  value: string;
  label: string;
}

export const OPPORTUNITY_LOST_REASONS: OpportunityLostReasonOption[] = [
  { value: "NO_RESPONSE", label: "No Response" },
  { value: "INVALID_PHONE_NUMBER", label: "Invalid Phone Number" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
  { value: "PRICE_TOO_HIGH", label: "Price Too High" },
  { value: "SHIPPING_COST", label: "Shipping Cost" },
  { value: "PURCHASED_FROM_COMPETITOR", label: "Purchased from Competitor" },
  { value: "NOT_READY_TO_BUY", label: "Not Ready to Buy" },
  { value: "PRODUCT_NOT_AVAILABLE", label: "Product Not Available" },
  { value: "DUPLICATE_LEAD", label: "Duplicate Lead" },
  { value: "OTHER", label: "Other" },
];

export function opportunityLostReasonLabel(value: string): string {
  return OPPORTUNITY_LOST_REASONS.find((r) => r.value === value)?.label ?? value;
}
