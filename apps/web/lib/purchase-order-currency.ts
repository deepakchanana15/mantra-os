/**
 * Purchase order currency follows Company/Country — same rule as invoices
 * and products. See lib/invoice-currency.ts.
 */
export interface PurchaseOrderCurrencySource {
  country?: { currency?: { code: string } | null } | null;
  company?: { baseCurrency?: { code: string } | null } | null;
}

export function purchaseOrderCurrencyCode(order: PurchaseOrderCurrencySource): string {
  return order.country?.currency?.code ?? order.company?.baseCurrency?.code ?? "USD";
}
