import { describe, expect, it } from "vitest";
import { effectiveStatus, endMoment, whenRows, zonedTimeToUtc } from "@/lib/trips/when";

const item = (type: string, extra: Record<string, unknown> = {}) =>
  ({ type, start_time: null, end_time: null, details: {}, ...extra }) as Parameters<
    typeof whenRows
  >[0];

describe("whenRows", () => {
  it("dates a stay's check-in and check-out", () => {
    const stay = item("stay", {
      details: { nights: 3, checkInTime: "14:00", checkOutTime: "12:00" },
    });
    expect(whenRows(stay, 2)).toEqual([
      { kind: "checkIn", dayIndex: 2, time: "14:00" },
      { kind: "checkOut", dayIndex: 5, time: "12:00" },
    ]);
  });

  it("handles overnight flights", () => {
    const flight = item("flight", {
      start_time: "23:45:00",
      end_time: "06:10:00",
      details: { arriveDayOffset: 1 },
    });
    expect(whenRows(flight, 1)).toEqual([
      { kind: "departs", dayIndex: 1, time: "23:45" },
      { kind: "arrives", dayIndex: 2, time: "06:10" },
    ]);
    expect(whenRows(item("flight", { start_time: "08:15:00" }), 1)).toEqual([
      { kind: "departs", dayIndex: 1, time: "08:15" },
    ]);
  });

  it("shows a tour's pickup and its time range", () => {
    const tour = item("tour", {
      start_time: "08:00:00",
      end_time: "18:00:00",
      details: { pickupTime: "07:30" },
    });
    expect(whenRows(tour, 2)).toEqual([
      { kind: "pickup", dayIndex: 2, time: "07:30" },
      { kind: "when", dayIndex: 2, time: "08:00–18:00" },
    ]);
  });

  it("gives other items one 'when', and nothing for the wishlist", () => {
    expect(whenRows(item("food", { start_time: "19:00:00" }), 3)).toEqual([
      { kind: "when", dayIndex: 3, time: "19:00" },
    ]);
    expect(whenRows(item("place"), null)).toEqual([]);
  });
});

describe("time zones", () => {
  it("converts local wall time to UTC", () => {
    // Almaty is UTC+5 (since 2024); Jakarta UTC+7.
    expect(new Date(zonedTimeToUtc("2027-05-02", "12:00", "Asia/Almaty")).toISOString()).toBe(
      "2027-05-02T07:00:00.000Z",
    );
    expect(new Date(zonedTimeToUtc("2027-05-02", "12:00", "Asia/Jakarta")).toISOString()).toBe(
      "2027-05-02T05:00:00.000Z",
    );
  });
});

describe("auto-done", () => {
  const stay = {
    type: "stay" as const,
    status: "booked" as const,
    start_time: null,
    end_time: null,
    timezone: "Asia/Almaty",
    details: { nights: 2, checkOutTime: "12:00" },
  };
  const checkout = Date.parse("2027-05-03T07:00:00Z"); // 12:00 Almaty on day 3

  it("ends a stay at check-out", () => {
    expect(endMoment(stay, 1, "2027-05-01")).toBe(checkout);
    expect(effectiveStatus(stay, 1, "2027-05-01", checkout - 60_000)).toEqual({
      status: "booked",
      auto: false,
    });
    expect(effectiveStatus(stay, 1, "2027-05-01", checkout)).toEqual({
      status: "done",
      auto: true,
    });
  });

  it("un-dones when the stay is extended", () => {
    const extended = { ...stay, details: { nights: 3, checkOutTime: "12:00" } };
    expect(effectiveStatus(extended, 1, "2027-05-01", checkout)).toEqual({
      status: "booked",
      auto: false,
    });
  });

  it("leaves ideas, undated trips and the wishlist alone", () => {
    expect(
      effectiveStatus({ ...stay, status: "idea" }, 1, "2027-05-01", checkout + DAY).status,
    ).toBe("idea");
    expect(effectiveStatus(stay, 1, null, checkout + DAY).auto).toBe(false);
    expect(effectiveStatus(stay, null, "2027-05-01", checkout + DAY).auto).toBe(false);
  });

  it("ends untimed items at the end of their day", () => {
    const place = {
      type: "place" as const,
      status: "planned" as const,
      start_time: null,
      end_time: null,
      timezone: "UTC",
      details: {},
    };
    expect(new Date(endMoment(place, 2, "2027-05-01")!).toISOString()).toBe(
      "2027-05-02T23:59:00.000Z",
    );
  });
});

const DAY = 24 * 60 * 60 * 1000;

describe("flights across time zones", () => {
  const flight = {
    type: "flight" as const,
    status: "booked" as const,
    start_time: "08:15:00",
    end_time: "13:40:00",
    timezone: "Asia/Almaty",
    details: { departTimezone: "Asia/Jakarta", arriveTimezone: "Asia/Almaty" },
  };

  it("departs in the origin's zone and arrives in the destination's", () => {
    expect(whenRows(flight, 1)).toEqual([
      { kind: "departs", dayIndex: 1, time: "08:15", timezone: "Asia/Jakarta" },
      { kind: "arrives", dayIndex: 1, time: "13:40", timezone: "Asia/Almaty" },
    ]);
  });

  it("finishes at the arrival time in the arrival zone", () => {
    expect(new Date(endMoment(flight, 1, "2027-05-01")!).toISOString()).toBe(
      "2027-05-01T08:40:00.000Z",
    );
  });

  it("falls back to the item's zone when none was chosen", () => {
    expect(whenRows({ ...flight, details: {} }, 1)[0].timezone).toBe("Asia/Almaty");
  });
});
