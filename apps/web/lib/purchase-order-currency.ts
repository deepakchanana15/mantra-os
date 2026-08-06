/**
 * Purchase order currency: an explicit override wins (the supplier's own
 * invoicing currency, e.g. INR for Indian suppliers) — unlike Invoices,
 * where the issuing Mantra entity's own Company/Country currency is always
 * correct since we're the seller. Falls back to Country/Company otherwise.
 * See lib/invoice-currency.ts.
 */
export interface PurchaseOrderCurrencySource {
  currency?: { code: string } | null;
  country?: { currency?: { code: string } | null } | null;
  company?: { baseCurrency?: { code: string } | null } | null;
}

export function purchaseOrderCurrencyCode(order: PurchaseOrderCurrencySource): string {
  return order.currency?.code ?? order.country?.currency?.code ?? order.company?.baseCurrency?.code ?? "USD";
}
