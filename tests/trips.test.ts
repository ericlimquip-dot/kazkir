import { describe, expect, it } from "vitest";
import { countryDefaults, listCountries } from "@/lib/geo/countries";
import { validateCreateTrip } from "@/lib/trips/create-trip";
import { validateTripDates } from "@/lib/trips/trip-dates";
import { dateOfDay, daysBetween, endDateOf, formatDayDate, shortTime } from "@/lib/trips/dates";

describe("trip dates", () => {
  it("maps day indexes onto the calendar", () => {
    expect(dateOfDay("2027-03-30", 1)).toBe("2027-03-30");
    expect(dateOfDay("2027-03-30", 3)).toBe("2027-04-01");
    expect(dateOfDay(null, 3)).toBeNull();
  });

  it("counts days inclusively, across month and leap-year boundaries", () => {
    expect(daysBetween("2027-03-03", "2027-03-03")).toBe(1);
    expect(daysBetween("2028-02-27", "2028-03-01")).toBe(4);
    expect(endDateOf("2028-02-27", 4)).toBe("2028-03-01");
  });

  it("formats dates without shifting the calendar day", () => {
    expect(formatDayDate("2027-03-03", "en")).toContain("3");
    expect(formatDayDate("2027-03-03", "en")).toMatch(/Wed/);
  });

  it("shortens times", () => {
    expect(shortTime("09:30:00")).toBe("09:30");
    expect(shortTime(null)).toBeNull();
  });
});

describe("countries", () => {
  it("knows Kazakhstan and Kyrgyzstan", () => {
    expect(countryDefaults("KZ")?.currency).toBe("KZT");
    expect(countryDefaults("KG")).toEqual({ timezone: "Asia/Bishkek", currency: "KGS" });
  });

  it("lists countries in the viewer's language", () => {
    const id = listCountries("id");
    expect(id.find((c) => c.code === "JP")?.name).toBe("Jepang");
    expect(listCountries("en").find((c) => c.code === "JP")?.name).toBe("Japan");
  });
});

describe("validateCreateTrip", () => {
  const almaty = { name: "Almaty", countryCode: "KZ" };

  it("creates an undated idea trip from a day count", () => {
    const r = validateCreateTrip({ title: " Central Asia ", cities: [almaty], dayCount: 7 });
    expect(r.ok && r.trip).toMatchObject({
      title: "Central Asia",
      stage: "idea",
      startDate: null,
      dayCount: 7,
    });
  });

  it("creates a planning trip from dates", () => {
    const r = validateCreateTrip({
      title: "Central Asia",
      cities: [almaty, { name: "Bishkek", countryCode: "KG" }],
      startDate: "2027-05-01",
      endDate: "2027-05-08",
    });
    expect(r.ok && r.trip.stage).toBe("planning");
    expect(r.ok && r.trip.dayCount).toBe(8);
    expect(r.ok && r.trip.cities.map((c) => [c.currency, c.sort_key])).toEqual([
      ["KZT", "a00"],
      ["KGS", "a01"],
    ]);
  });

  it("rejects bad input", () => {
    expect(validateCreateTrip({ title: "", cities: [almaty], dayCount: 3 })).toEqual({
      ok: false,
      error: "titleRequired",
    });
    expect(validateCreateTrip({ title: "x", cities: [], dayCount: 3 })).toEqual({
      ok: false,
      error: "cityRequired",
    });
    expect(
      validateCreateTrip({
        title: "x",
        cities: [{ name: "Atlantis", countryCode: "ZZ" }],
        dayCount: 3,
      }),
    ).toEqual({ ok: false, error: "cityInvalid" });
    expect(
      validateCreateTrip({
        title: "x",
        cities: [almaty],
        startDate: "2027-05-08",
        endDate: "2027-05-01",
      }),
    ).toEqual({ ok: false, error: "datesInvalid" });
    expect(validateCreateTrip({ title: "x", cities: [almaty], dayCount: 0 })).toEqual({
      ok: false,
      error: "dayCountInvalid",
    });
    expect(validateCreateTrip({ title: "x", cities: [almaty], dayCount: 91 })).toEqual({
      ok: false,
      error: "dayCountInvalid",
    });
  });

  it("ignores a bogus time zone and falls back to the country default", () => {
    const r = validateCreateTrip({
      title: "x",
      cities: [{ ...almaty, timezone: "Mars/Olympus" }],
      dayCount: 2,
    });
    expect(r.ok && r.trip.cities[0].timezone).toBe("Asia/Almaty");
  });
});

describe("validateTripDates", () => {
  it("sets dates and derives the length", () => {
    expect(validateTripDates({ startDate: "2027-05-01", endDate: "2027-05-07" })).toEqual({
      ok: true,
      startDate: "2027-05-01",
      dayCount: 7,
    });
  });
  it("keeps a trip undated with a new length", () => {
    expect(validateTripDates({ dayCount: 4 })).toEqual({ ok: true, startDate: null, dayCount: 4 });
  });
  it("rejects backwards or over-long dates and silly lengths", () => {
    expect(validateTripDates({ startDate: "2027-05-07", endDate: "2027-05-01" })).toEqual({
      ok: false,
      error: "datesInvalid",
    });
    expect(validateTripDates({ startDate: "2027-01-01", endDate: "2027-12-31" })).toEqual({
      ok: false,
      error: "datesInvalid",
    });
    expect(validateTripDates({ startDate: "2027-05-01" })).toEqual({
      ok: false,
      error: "datesInvalid",
    });
    expect(validateTripDates({ dayCount: 0 })).toEqual({ ok: false, error: "dayCountInvalid" });
  });
});
