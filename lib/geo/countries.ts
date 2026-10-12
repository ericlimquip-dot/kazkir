import ct from "countries-and-timezones";
import countryToCurrency from "country-to-currency";

export type CountryOption = {
  code: string; // ISO 3166-1 alpha-2
  name: string; // localized
  timezones: string[];
  currency: string;
};

/** All countries with at least one time zone, named in the viewer's language and sorted. */
export function listCountries(locale: string): CountryOption[] {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const currencies = countryToCurrency as Record<string, string>;
  return Object.values(ct.getAllCountries())
    .filter((c) => c.timezones.length > 0 && currencies[c.id])
    .map((c) => ({
      code: c.id,
      name: names.of(c.id) ?? c.name,
      timezones: c.timezones,
      currency: currencies[c.id],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export function countryDefaults(code: string): { timezone: string; currency: string } | null {
  const country = ct.getCountry(code);
  const currency = (countryToCurrency as Record<string, string>)[code];
  if (!country || !currency || country.timezones.length === 0) return null;
  return { timezone: country.timezones[0], currency };
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
