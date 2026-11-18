/** Dates from the API are ISO-8601 strings; these format them for display in the user's time zone. */

const DATE = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** "2026-12-18T10:00:00Z" → "18 Dec 2026". Unparseable input is returned as-is. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : DATE.format(date);
}

/** "2026-12-18T10:00:00Z" → "18 Dec 2026, 3:30 pm" (in the viewer's time zone). */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : DATE_TIME.format(date);
}
