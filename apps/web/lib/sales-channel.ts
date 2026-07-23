/**
 * Single source of truth for Sales Channel labels — mirrors apps/api's
 * Prisma-generated SalesChannel/OnlineChannelType/OfflineChannelType enums
 * by hand (apps/web has no direct dependency on @mantra-os/db; it only
 * talks to the API over HTTP). Keep in sync with packages/db/prisma/
 * schema.prisma. See DECISIONS.md "Sales channel tracking".
 */
export interface ChannelOption {
  value: string;
  label: string;
}

export const SALES_CHANNELS: ChannelOption[] = [
  { value: "ONLINE", label: "Online" },
  { value: "OFFLINE", label: "Offline" },
];

export const ONLINE_CHANNEL_TYPES: ChannelOption[] = [
  { value: "WEBSITE_STORE", label: "Website/Store" },
  { value: "MARKETPLACE", label: "Marketplace" },
];

export const OFFLINE_CHANNEL_TYPES: ChannelOption[] = [
  { value: "WALK_IN", label: "Walk-in" },
  { value: "PHONE_ORDER", label: "Phone order" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "Email" },
  { value: "SALES_REPRESENTATIVE", label: "Sales representative" },
  { value: "DISTRIBUTOR_DEALER", label: "Distributor/Dealer" },
  { value: "EXHIBITION_TOURNAMENT", label: "Exhibition/Tournament" },
];

export function salesChannelLabel(value: string | null | undefined): string {
  return SALES_CHANNELS.find((c) => c.value === value)?.label ?? "—";
}

export function channelSubTypeLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return (
    ONLINE_CHANNEL_TYPES.find((c) => c.value === value)?.label ??
    OFFLINE_CHANNEL_TYPES.find((c) => c.value === value)?.label ??
    value
  );
}
