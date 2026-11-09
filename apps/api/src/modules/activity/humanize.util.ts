/** "ATTEMPTING_CONTACT" -> "Attempting Contact" — enough to make any schema enum readable in a timeline without duplicating each domain's own label maps (which live in the web app). */
export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
