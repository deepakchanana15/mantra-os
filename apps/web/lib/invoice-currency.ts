/**
 * Invoice currency follows Company/Country — Country's currency wins, else
 * Company's base currency, else USD as a last-resort fallback. Same rule as
 * product pricing — see lib/product-currency.ts and DECISIONS.md "Product
 * currency follows Company/Country".
 */
export interface InvoiceCurrencySource {
  country?: { currency?: { code: string } | null } | null;
  company?: { baseCurrency?: { code: string } | null } | null;
}

export function invoiceCurrencyCode(invoice: InvoiceCurrencySource): string {
  return invoice.country?.currency?.code ?? invoice.company?.baseCurrency?.code ?? "USD";
}

export function formatInvoiceAmount(amount: string | number, invoice: InvoiceCurrencySource): string {
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: invoiceCurrencyCode(invoice),
    currencyDisplay: "code",
  });
  return currency.format(Number(amount));
}
