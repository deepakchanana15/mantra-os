/**
 * Product currency follows Company/Country — Country's currency wins, else
 * Company's base currency, else USD as a last-resort fallback (matches the
 * org-wide default used before this existed). See DECISIONS.md "Product
 * currency follows Company/Country".
 */
export interface ProductCurrencySource {
  country?: { currency?: { code: string } | null } | null;
  company?: { baseCurrency?: { code: string } | null } | null;
}

export function productCurrencyCode(product: ProductCurrencySource): string {
  return product.country?.currency?.code ?? product.company?.baseCurrency?.code ?? "USD";
}

export function formatProductPrice(amount: string | number, product: ProductCurrencySource): string {
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: productCurrencyCode(product),
    currencyDisplay: "code",
  });
  return currency.format(Number(amount));
}
