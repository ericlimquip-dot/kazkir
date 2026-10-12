import type { Item } from "./types";

export type WhenKind = "when" | "departs" | "arrives" | "checkIn" | "checkOut" | "pickup";

/** One dated moment of an item: which trip day (1-based, may run past the trip's end) and an optional time. */
export type WhenRow = { kind: WhenKind; dayIndex: number; time?: string; timezone?: string };

const hhmm = (t: unknown) => (typeof t === "string" && t ? t.slice(0, 5) : undefined);
const range = (a?: string, b?: string) => (a && b ? `${a}–${b}` : a);

/**
 * The dated moments to show for an item on day `dayIndex` (null = wishlist, nothing dated).
 * Stays check out `nights` days later; overnight flights arrive `arriveDayOffset` days later.
 */
export function whenRows(
  item: Pick<Item, "type" | "start_time" | "end_time" | "details"> & { timezone?: string | null },
  dayIndex: number | null,
): WhenRow[] {
  const tz = item.timezone ?? undefined;
  const d = item.details as Record<string, unknown>;
  const zone = (key: string) => (typeof d[key] === "string" && d[key] ? (d[key] as string) : tz);
  return rawRows(item, dayIndex).map((row) => ({
    ...row,
    // Flights cross zones: departure in the origin's time, arrival in the destination's.
    timezone:
      row.kind === "departs"
        ? zone("departTimezone")
        : row.kind === "arrives"
          ? zone("arriveTimezone")
          : tz,
  }));
}

function rawRows(
  item: Pick<Item, "type" | "start_time" | "end_time" | "details">,
  dayIndex: number | null,
): WhenRow[] {
  if (dayIndex === null) return [];
  const d = item.details as Record<string, unknown>;
  const start = hhmm(item.start_time);
  const end = hhmm(item.end_time);

  switch (item.type) {
    case "flight": {
      const offset = Math.min(2, Math.max(0, Number(d.arriveDayOffset ?? 0) || 0));
      const rows: WhenRow[] = [{ kind: "departs", dayIndex, time: start }];
      if (end || offset > 0) rows.push({ kind: "arrives", dayIndex: dayIndex + offset, time: end });
      return rows;
    }
    case "stay": {
      const nights = Math.max(1, Number(d.nights ?? 1) || 1);
      return [
        { kind: "checkIn", dayIndex, time: hhmm(d.checkInTime) },
        { kind: "checkOut", dayIndex: dayIndex + nights, time: hhmm(d.checkOutTime) },
      ];
    }
    case "tour": {
      const rows: WhenRow[] = [];
      const pickup = hhmm(d.pickupTime);
      if (pickup) rows.push({ kind: "pickup", dayIndex, time: pickup });
      if (start || !pickup) rows.push({ kind: "when", dayIndex, time: range(start, end) });
      return rows;
    }
    default:
      return [{ kind: "when", dayIndex, time: range(start, end) }];
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Milliseconds to add to UTC to get local wall time in `timeZone` at `utcMs`. */
function zoneOffset(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** The instant a wall-clock time happens in a time zone, e.g. 12:00 on 2 May in Asia/Almaty. */
export function zonedTimeToUtc(dateIso: string, time: string, timeZone: string): number {
  const [y, m, d] = dateIso.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let utc = wall - zoneOffset(wall, timeZone);
  utc = wall - zoneOffset(utc, timeZone); // second pass settles DST edges
  return utc;
}

/**
 * When an item is over, as an instant (ms since epoch), or null if it can't be known
 * (undated trip, wishlist). Untimed items end at the end of their last day.
 */
export function endMoment(
  item: Pick<Item, "type" | "start_time" | "end_time" | "details" | "timezone">,
  dayIndex: number | null,
  startDate: string | null,
  fallbackTimezone = "UTC",
): number | null {
  if (dayIndex === null || !startDate) return null;
  const rows = whenRows(item, dayIndex);
  const last = rows[rows.length - 1];
  if (!last) return null;
  const [y, m, d] = startDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d) + (last.dayIndex - 1) * DAY_MS)
    .toISOString()
    .slice(0, 10);
  // "08:00–18:00" → 18:00. No check-out time entered: assume the usual noon.
  const time = last.time?.split("–").pop() ?? (last.kind === "checkOut" ? "12:00" : "23:59");
  const tz = last.timezone || item.timezone || fallbackTimezone;
  try {
    return zonedTimeToUtc(date, time, tz);
  } catch {
    return zonedTimeToUtc(date, time, "UTC");
  }
}

/**
 * Status to display: planned/booked items count as done once they've ended.
 * Ideas stay ideas — nobody committed to them, so "done" would be a guess.
 */
export function effectiveStatus(
  item: Pick<Item, "status" | "type" | "start_time" | "end_time" | "details" | "timezone">,
  dayIndex: number | null,
  startDate: string | null,
  now: number,
  fallbackTimezone?: string,
): { status: Item["status"]; auto: boolean } {
  if (item.status !== "planned" && item.status !== "booked")
    return { status: item.status, auto: false };
  const end = endMoment(item, dayIndex, startDate, fallbackTimezone);
  return end !== null && now >= end
    ? { status: "done", auto: true }
    : { status: item.status, auto: false };
}
