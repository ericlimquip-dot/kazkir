import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";
import { formatIdr, parseAmount, toIdr } from "@/lib/money/format";

describe("cn", () => {
  it("lets later classes override conflicting earlier ones", () => {
    expect(cn("min-h-11 w-full px-3", "w-24")).toBe("min-h-11 px-3 w-24");
  });
});

describe("toIdr", () => {
  const rates = { KZT: 39.48, KGS: 207.25 };
  it("converts and rounds to Rp 100", () => {
    expect(toIdr(25000, "KZT", rates)).toBe(987000);
    expect(toIdr(1500, "KGS", rates)).toBe(310900);
  });
  it("passes Rupiah through and gives up on unknown currencies", () => {
    expect(toIdr(150000, "IDR", rates)).toBe(150000);
    expect(toIdr(10, "XYZ", rates)).toBeNull();
  });
});

describe("formatIdr", () => {
  it("uses Indonesian formatting", () => {
    expect(formatIdr(987000).replace(/\s/g, " ")).toBe("Rp 987.000");
  });
});

describe("parseAmount", () => {
  it.each([
    ["25000", 25000],
    ["25.000", 25000],
    ["25,000", 25000],
    ["1.250.000", 1250000],
    ["1,250.50", 1250.5],
    ["12,5", 12.5],
    ["12.50", 12.5],
    [" 7 500 ", 7500],
  ])("%s → %d", (input, expected) => expect(parseAmount(input)).toBe(expected));
  it("rejects nonsense", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
  });
});
