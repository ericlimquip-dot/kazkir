import { countryDefaults, isValidTimezone } from "@/lib/geo/countries";
import { daysBetween } from "./dates";
import type { TripStage } from "./types";

export const MAX_TRIP_DAYS = 90;
export const MAX_CITIES = 12;

export type CityInput = { name: string; countryCode: string; timezone?: string };

export type CreateTripInput = {
  title: string;
  cities: CityInput[];
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  dayCount?: number; // used when there are no dates yet
};

export type CreateTripError =
  | "titleRequired"
  | "titleTooLong"
  | "cityRequired"
  | "tooManyCities"
  | "cityInvalid"
  | "datesInvalid"
  | "dayCountInvalid";

export type ValidTrip = {
  title: string;
  stage: TripStage;
  startDate: string | null;
  dayCount: number;
  cities: {
    name: string;
    country_code: string;
    timezone: string;
    currency: string;
    sort_key: string;
  }[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Validates and normalises the "new trip" form. Pure: no I/O. */
export function validateCreateTrip(
  input: CreateTripInput,
): { ok: true; trip: ValidTrip } | { ok: false; error: CreateTripError } {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "titleRequired" };
  if (title.length > 120) return { ok: false, error: "titleTooLong" };

  const cities = input.cities.filter((c) => c.name.trim() || c.countryCode);
  if (cities.length === 0) return { ok: false, error: "cityRequired" };
  if (cities.length > MAX_CITIES) return { ok: false, error: "tooManyCities" };

  const normalisedCities: ValidTrip["cities"] = [];
  for (const [i, city] of cities.entries()) {
    const name = city.name.trim();
    const defaults = countryDefaults(city.countryCode);
    if (!name || name.length > 80 || !defaults) return { ok: false, error: "cityInvalid" };
    const timezone =
      city.timezone && isValidTimezone(city.timezone) ? city.timezone : defaults.timezone;
    normalisedCities.push({
      name,
      country_code: city.countryCode,
      timezone,
      currency: defaults.currency,
      // Zero-padded so text ordering matches insertion order; drag-and-drop keys come in M3.
      sort_key: `a${String(i).padStart(2, "0")}`,
    });
  }

  if (input.startDate || input.endDate) {
    const { startDate, endDate } = input;
    if (!startDate || !endDate || !ISO_DATE.test(startDate) || !ISO_DATE.test(endDate)) {
      return { ok: false, error: "datesInvalid" };
    }
    const dayCount = daysBetween(startDate, endDate);
    if (!Number.isFinite(dayCount) || dayCount < 1 || dayCount > MAX_TRIP_DAYS) {
      return { ok: false, error: "datesInvalid" };
    }
    return {
      ok: true,
      trip: { title, stage: "planning", startDate, dayCount, cities: normalisedCities },
    };
  }

  const dayCount = input.dayCount ?? NaN;
  if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > MAX_TRIP_DAYS) {
    return { ok: false, error: "dayCountInvalid" };
  }
  return {
    ok: true,
    trip: { title, stage: "idea", startDate: null, dayCount, cities: normalisedCities },
  };
}
