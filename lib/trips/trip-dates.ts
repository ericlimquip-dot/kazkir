import { MAX_TRIP_DAYS } from "./create-trip";
import { daysBetween } from "./dates";

export type TripDatesInput = { startDate?: string; endDate?: string; dayCount?: number };
export type TripDatesError = "datesInvalid" | "dayCountInvalid";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Dates for an existing trip: either a first and last day, or just a number of days.
 * Pure: no I/O. Returns the new start date (null = undated) and length.
 */
export function validateTripDates(
  input: TripDatesInput,
): { ok: true; startDate: string | null; dayCount: number } | { ok: false; error: TripDatesError } {
  if (input.startDate || input.endDate) {
    const { startDate, endDate } = input;
    if (!startDate || !endDate || !ISO_DATE.test(startDate) || !ISO_DATE.test(endDate)) {
      return { ok: false, error: "datesInvalid" };
    }
    const dayCount = daysBetween(startDate, endDate);
    if (!Number.isFinite(dayCount) || dayCount < 1 || dayCount > MAX_TRIP_DAYS) {
      return { ok: false, error: "datesInvalid" };
    }
    return { ok: true, startDate, dayCount };
  }
  const dayCount = input.dayCount ?? NaN;
  if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > MAX_TRIP_DAYS) {
    return { ok: false, error: "dayCountInvalid" };
  }
  return { ok: true, startDate: null, dayCount };
}
