/**
 * Plain (non-"use client") address types/helpers — kept separate from
 * components/domain/address-fields.tsx (which IS "use client") because a
 * Server Component importing a function from a client-directive module gets
 * a client-reference proxy back, not the real function, and calling it
 * throws at runtime ("X is not a function"). Server Components (customer
 * detail page) import from here; the client-only AddressFields input
 * component re-exports/uses these too.
 *
 * Mirrors apps/api/src/common/dto/address.dto.ts's AddressDto — keep in sync.
 */
export interface AddressValue {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export const EMPTY_ADDRESS: AddressValue = {};

/** True if every field is blank — used to omit the address entirely rather than send an empty object. */
export function isAddressEmpty(address: AddressValue): boolean {
  return Object.values(address).every((v) => !v || !v.trim());
}

/** Formats an address for read-only display (detail pages) — omits blank lines rather than showing empty commas. */
export function formatAddress(address: AddressValue | null | undefined): string[] {
  if (!address) return [];
  const line1 = [address.line1, address.line2].filter(Boolean).join(", ");
  const line2 = [address.city, address.state, address.postalCode].filter(Boolean).join(", ");
  const line3 = address.country;
  return [line1, line2, line3].filter((l): l is string => Boolean(l));
}
