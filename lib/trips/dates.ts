// Date helpers for trips. Trip dates are calendar dates (YYYY-MM-DD) with no time zone:
// "Day 3" is the third calendar day at the destination, whatever zone the viewer is in.

const DAY_MS = 24 * 60 * 60 * 1000;

function parseIsoDate(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Calendar date of a 1-based day index, or null for undated trips. */
export function dateOfDay(startDate: string | null, dayIndex: number): string | null {
  if (!startDate) return null;
  return toIsoDate(parseIsoDate(startDate) + (dayIndex - 1) * DAY_MS);
}

/** Inclusive number of days from start to end (same day = 1). */
export function daysBetween(startDate: string, endDate: string): number {
  return Math.round((parseIsoDate(endDate) - parseIsoDate(startDate)) / DAY_MS) + 1;
}

export function endDateOf(startDate: string, dayCount: number): string {
  return toIsoDate(parseIsoDate(startDate) + (dayCount - 1) * DAY_MS);
}

/** "Mon, 3 Mar" / "Sen, 3 Mar" — formatted in UTC so the calendar date never shifts. */
export function formatDayDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(parseIsoDate(iso)));
}

/** "3–9 Mar 2027" style range in the viewer's locale. */
export function formatDateRange(startIso: string, endIso: string, locale: string): string {
  const fmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return fmt.formatRange(new Date(parseIsoDate(startIso)), new Date(parseIsoDate(endIso)));
}

/** "HH:MM:SS" → "HH:MM". */
export function shortTime(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

/** "28 Apr 2027" / "28 Apr 2027" (id) for a stand-alone calendar date. */
export function formatDate(iso: string, locale: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(parseIsoDate(iso)));
}
