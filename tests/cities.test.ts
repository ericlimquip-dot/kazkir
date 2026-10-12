import { describe, expect, it } from "vitest";
import { normalise, searchCities } from "@/lib/geo/cities";

describe("searchCities", () => {
  it("finds a city and its country and time zone", () => {
    expect(searchCities("almaty")[0]).toMatchObject({
      name: "Almaty",
      countryCode: "KZ",
      timezone: "Asia/Almaty",
    });
    expect(searchCities("Bishk")[0]).toMatchObject({ countryCode: "KG", timezone: "Asia/Bishkek" });
  });

  it("uses the city's own time zone in multi-zone countries", () => {
    expect(searchCities("Denpasar")[0].timezone).toBe("Asia/Makassar");
  });

  it("ranks the chosen country first without hiding other countries", () => {
    const fromKz = searchCities("b", { country: "KZ" });
    expect(fromKz[0].countryCode).toBe("KZ");
    expect(searchCities("bishkek", { country: "KZ" })[0].countryCode).toBe("KG");
  });

  it("lists a country's biggest cities for an empty query", () => {
    const kg = searchCities("", { country: "KG" });
    expect(kg[0].name).toBe("Bishkek");
    expect(kg.every((c) => c.countryCode === "KG")).toBe(true);
  });

  it("ignores case and accents, and returns nothing for nothing", () => {
    expect(normalise("Álmaty ")).toBe("almaty");
    expect(searchCities("")).toEqual([]);
    expect(searchCities("zzzzqq")).toEqual([]);
  });

  it("caps the number of results", () => {
    expect(searchCities("s").length).toBeLessThanOrEqual(8);
  });
});
