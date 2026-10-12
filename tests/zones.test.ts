import { describe, expect, it } from "vitest";
import { zoneCity, zoneOffset, zoneParts, zoneShort } from "@/lib/trips/zones";

describe("zones", () => {
  it("names zones for people", () => {
    expect(zoneCity("Asia/Ho_Chi_Minh")).toBe("Ho Chi Minh");
    expect(zoneShort("Asia/Jakarta")).toBe("WIB");
    expect(zoneShort("Asia/Makassar")).toBe("WITA");
    expect(zoneShort("Asia/Bishkek")).toBe("Bishkek");
  });

  it("gives the GMT offset, including daylight saving", () => {
    expect(zoneOffset("Asia/Almaty", new Date("2027-05-01T00:00:00Z"))).toBe("GMT+5");
    expect(zoneOffset("Europe/London", new Date("2027-01-15T00:00:00Z"))).toBe("GMT+0");
    expect(zoneOffset("Europe/London", new Date("2027-07-15T00:00:00Z"))).toBe("GMT+1");
    expect(zoneParts("Asia/Jakarta")).toMatchObject({
      name: "WIB",
      offset: "GMT+7",
      indonesian: true,
    });
  });
});
