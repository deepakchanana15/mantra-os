/**
 * Native <input type="date"> can occasionally emit a malformed value (e.g.
 * a 5-digit year like "12026-08-14") when the year segment overflows while
 * typing, which then fails the backend's ISO 8601 validation. Reject
 * anything that isn't empty or a well-formed YYYY-MM-DD before it ever
 * reaches state.
 */
export function isValidDateInputValue(value: string): boolean {
  return value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value);
}
