/** Shared formatting helpers for pdfkit-generated documents (Invoice, Purchase Order). */

export function formatMoney(amount: { toString(): string } | number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "code" }).format(Number(amount));
}

export function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

interface PostalAddressShape {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/** `value` is a Prisma Json field — shape follows AddressDto by convention, but isn't type-guaranteed. */
export function formatPostalAddress(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const address = value as PostalAddressShape;
  const line2 = address.line2 ? `${address.line1}, ${address.line2}` : address.line1;
  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(" ");
  return [line2, cityLine, address.country].filter((l): l is string => !!l && l.trim().length > 0);
}
