const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function threeDigitsToWords(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10].toLowerCase()}` : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

/** Spells out an integer amount for the "Amount in words" line export invoices require. Whole units only — cents/paise are dropped, matching standard export-invoice convention. */
export function amountToWords(amount: number, currencyCode: string): string {
  const whole = Math.round(Math.abs(amount));
  if (whole === 0) return `${currencyCode} Zero only`;

  const segments: { value: number; label: string }[] = [
    { value: 1_000_000_000, label: "Billion" },
    { value: 1_000_000, label: "Million" },
    { value: 1_000, label: "Thousand" },
    { value: 1, label: "" },
  ];

  let remaining = whole;
  const words: string[] = [];
  for (const { value, label } of segments) {
    const count = Math.floor(remaining / value);
    if (count > 0) {
      words.push(label ? `${threeDigitsToWords(count)} ${label}` : threeDigitsToWords(count));
      remaining %= value;
    }
  }

  return `${currencyCode} ${words.join(" ")} only`;
}
