export const LOCALES = ["en", "id"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Pick a supported locale from an Accept-Language header; "in" is the legacy code for Indonesian. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  const first = (header ?? "").trim().toLowerCase();
  return /^(id|in)\b/.test(first) ? "id" : DEFAULT_LOCALE;
}
