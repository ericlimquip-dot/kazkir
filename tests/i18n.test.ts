import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import id from "@/messages/id.json";
import { isLocale, localeFromAcceptLanguage } from "@/i18n/config";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("messages", () => {
  it("English and Bahasa Indonesia have the same keys", () => {
    expect(keys(id).sort()).toEqual(keys(en).sort());
  });

  it("has no empty strings", () => {
    for (const messages of [en, id]) {
      const flat = keys(messages);
      for (const key of flat) {
        const value = key
          .split(".")
          .reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], messages);
        expect(value, key).not.toBe("");
      }
    }
  });
});

describe("locale helpers", () => {
  it("accepts only supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("id")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("detects Indonesian from Accept-Language, including the legacy 'in' code", () => {
    expect(localeFromAcceptLanguage("id-ID,id;q=0.9,en;q=0.8")).toBe("id");
    expect(localeFromAcceptLanguage("in-ID")).toBe("id");
    expect(localeFromAcceptLanguage("en-US,id;q=0.5")).toBe("en");
    expect(localeFromAcceptLanguage(null)).toBe("en");
  });
});
