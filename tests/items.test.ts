import { describe, expect, it } from "vitest";
import { parseItem } from "@/lib/trips/item-schema";
import { sortKeyFor } from "@/lib/trips/ordering";

const base = {
  tripId: "11111111-1111-4111-8111-111111111111",
  dayId: "22222222-2222-4222-8222-222222222222",
};

describe("parseItem", () => {
  it("accepts a minimal place and fills defaults", () => {
    const r = parseItem({ ...base, type: "place", title: "  Big Almaty Lake " });
    expect(r.ok && r.item).toMatchObject({
      title: "Big Almaty Lake",
      status: "planned",
      costBasis: "per_person",
      details: {},
    });
  });

  it("turns empty form fields into 'not set'", () => {
    const r = parseItem({
      ...base,
      type: "food",
      title: "Navat",
      startTime: "",
      location: "",
      costAmount: "",
      notes: "",
    });
    expect(r.ok && r.item).toMatchObject({
      startTime: undefined,
      location: undefined,
      costAmount: undefined,
      notes: undefined,
    });
  });

  it("keeps a tour's stops and drops empty detail fields", () => {
    const r = parseItem({
      ...base,
      type: "tour",
      title: "Charyn Canyon day tour",
      costAmount: "25000",
      costCurrency: "KZT",
      details: {
        operator: "Steppe Tours",
        contact: "",
        pickupTime: "07:30",
        stops: [
          { time: "10:00", name: "Charyn Canyon" },
          { name: "Kolsai Lakes", note: "" },
        ],
      },
    });
    expect(r.ok && r.item.costAmount).toBe(25000);
    expect(r.ok && r.item.details).toEqual({
      operator: "Steppe Tours",
      pickupTime: "07:30",
      stops: [{ time: "10:00", name: "Charyn Canyon" }, { name: "Kolsai Lakes" }],
    });
  });

  it("defaults a stay to one night and rejects impossible ones", () => {
    const one = parseItem({ ...base, type: "stay", title: "Hotel Kazakhstan" });
    expect(one.ok && one.item.details).toEqual({ nights: 1 });
    expect(parseItem({ ...base, type: "stay", title: "x", details: { nights: 0 } })).toEqual({
      ok: false,
      fields: ["details.nights"],
    });
  });

  it("rejects bad input with the offending fields", () => {
    expect(parseItem({ ...base, type: "place", title: "" })).toEqual({
      ok: false,
      fields: ["title"],
    });
    expect(parseItem({ ...base, type: "place", title: "x", startTime: "25:00" })).toEqual({
      ok: false,
      fields: ["startTime"],
    });
    expect(parseItem({ ...base, type: "spaceship", title: "x" })).toEqual({
      ok: false,
      fields: ["type"],
    });
    expect(
      parseItem({ ...base, type: "place", title: "x", costAmount: "-5", costCurrency: "KZT" }),
    ).toEqual({ ok: false, fields: ["costAmount"] });
  });

  it("needs a currency when there's a cost", () => {
    expect(parseItem({ ...base, type: "food", title: "x", costAmount: "100" })).toEqual({
      ok: false,
      fields: ["costCurrency"],
    });
  });

  it("allows the wishlist (no day)", () => {
    const r = parseItem({ ...base, dayId: null, type: "place", title: "Maybe: Kolsai" });
    expect(r.ok && r.item.dayId).toBeNull();
  });
});

describe("sortKeyFor", () => {
  const list = [
    { id: "a", sort_key: "a0", start_time: "08:00:00" },
    { id: "b", sort_key: "a1", start_time: null },
    { id: "c", sort_key: "a2", start_time: "14:00:00" },
  ];

  it("appends untimed items", () => {
    expect(sortKeyFor(list, undefined) > "a2").toBe(true);
    expect(sortKeyFor([], undefined)).toBe("a0");
  });

  it("slots timed items before the first later one", () => {
    const k = sortKeyFor(list, "12:30");
    expect(k > "a1" && k < "a2").toBe(true);
    expect(sortKeyFor(list, "07:00") < "a0").toBe(true);
  });

  it("ignores the item being moved", () => {
    const k = sortKeyFor(list, "15:00", "c");
    expect(k > "a1").toBe(true);
  });
});

describe("sortKeyFor with duplicate keys", () => {
  it("falls back to appending instead of throwing", () => {
    const dupes = [
      { id: "a", sort_key: "a0", start_time: "08:00:00" },
      { id: "b", sort_key: "a0", start_time: "10:00:00" },
    ];
    expect(sortKeyFor(dupes, "09:00") > "a0").toBe(true);
  });
});
