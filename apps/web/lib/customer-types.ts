/**
 * Single source of truth for the CustomerType values shown across Customers
 * and Marketing Segments — mirrors apps/api's Prisma-generated CustomerType
 * enum by hand (apps/web has no direct dependency on @mantra-os/db; it only
 * talks to the API over HTTP). Keep in sync with
 * packages/db/prisma/schema.prisma's CustomerType enum. See DECISIONS.md
 * "Customer type taxonomy" for where this list came from.
 */
export interface CustomerTypeOption {
  value: string;
  label: string;
  description: string;
}

export const CUSTOMER_TYPES: CustomerTypeOption[] = [
  { value: "USER", label: "User", description: "Individual player or parent purchasing for personal use." },
  { value: "STORE", label: "Store", description: "Retail sports shop, online retailer, or distributor." },
  { value: "ACADEMY", label: "Academy", description: "Cricket academies and training centres." },
  { value: "CLUB", label: "Club", description: "Cricket clubs purchasing for members or teams." },
  { value: "COACH", label: "Coach", description: "Individual or freelance coach." },
  { value: "PROFESSIONAL", label: "Professional", description: "Professional player or contracted athlete." },
  { value: "SCHOOL", label: "School", description: "Schools purchasing sports equipment for students." },
  { value: "COLLEGE_UNIVERSITY", label: "College / University", description: "Educational institutions with cricket teams." },
  { value: "ASSOCIATION", label: "Association", description: "District, State, National or regional cricket associations." },
  { value: "CORPORATE", label: "Corporate", description: "Companies buying kits for tournaments or employee sports events." },
  {
    value: "GOVERNMENT",
    label: "Government",
    description: "Government departments, police, army, railways, public sector organizations.",
  },
  {
    value: "TEAM",
    label: "Team",
    description: "Independent teams that aren't formally registered clubs (weekend, social, corporate teams).",
  },
  { value: "DISTRIBUTOR", label: "Distributor", description: "Regional wholesale distributor supplying retailers." },
  { value: "DEALER", label: "Dealer", description: "Authorized dealer or reseller." },
  { value: "FRANCHISE", label: "Franchise", description: "Cricket franchises (league teams, academy franchises)." },
  {
    value: "EVENT_ORGANIZER",
    label: "Event Organizer",
    description: "Tournament organizers needing balls, trophies, apparel, sponsorship kits.",
  },
  { value: "RENTAL_PROVIDER", label: "Rental Provider", description: "Businesses renting cricket equipment or nets." },
  { value: "NGO_FOUNDATION", label: "NGO / Foundation", description: "Organizations running cricket development programs." },
  {
    value: "INFLUENCER_CREATOR",
    label: "Influencer / Creator",
    description: "YouTubers, reviewers, Instagram creators, ambassadors.",
  },
  { value: "OEM_PRIVATE_LABEL", label: "OEM / Private Label", description: "Companies buying products under their own brand." },
];

export function customerTypeLabel(value: string): string {
  return CUSTOMER_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function customerTypeDescription(value: string): string | undefined {
  return CUSTOMER_TYPES.find((t) => t.value === value)?.description;
}
