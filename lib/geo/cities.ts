import "server-only";
import cityTimezones from "city-timezones";

export type CityMatch = {
  name: string;
  countryCode: string;
  province: string;
  timezone: string;
};

type Indexed = CityMatch & { key: string; asciiKey: string; pop: number };

/** Lower-case, strip accents and punctuation so "Almaty", "almaty" and "Álmaty" all match. */
export function normalise(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

let index: Indexed[] | null = null;

function getIndex(): Indexed[] {
  if (!index) {
    index = cityTimezones.cityMapping
      // A handful of rows (Kosovo, Somaliland) have no ISO code (-99); skip them.
      .filter((c) => typeof c.iso2 === "string" && /^[a-z]{2}$/i.test(c.iso2) && c.timezone)
      .map((c) => ({
        name: String(c.city),
        countryCode: c.iso2.toUpperCase(),
        province: typeof c.province === "string" ? c.province : "",
        timezone: c.timezone,
        key: normalise(c.city),
        asciiKey: normalise(c.city_ascii ?? c.city),
        pop: Number(c.pop) || 0,
      }))
      // Biggest first, so ties in ranking go to the city people most likely mean.
      .sort((a, b) => b.pop - a.pop);
  }
  return index;
}

/**
 * Ranking: cities in the preferred country first, then prefix matches before matches later in
 * the name, then bigger cities first. With an empty query, returns the country's largest cities.
 * The country never hides other countries' cities: trips often cross borders.
 */
export function searchCities(
  query: string,
  opts: { country?: string; limit?: number } = {},
): CityMatch[] {
  const q = normalise(query);
  const country = opts.country?.toUpperCase();
  const limit = Math.min(opts.limit ?? 8, 20);
  if (!q && !country) return [];

  const buckets: Indexed[][] = [[], [], [], []]; // [home prefix, other prefix, home inner, other inner]
  for (const city of getIndex()) {
    const home = country !== undefined && city.countryCode === country;
    if (!q) {
      if (home) buckets[0].push(city);
    } else if (city.key.startsWith(q) || city.asciiKey.startsWith(q)) {
      buckets[home ? 0 : 1].push(city);
    } else if (q.length >= 3 && (city.key.includes(` ${q}`) || city.asciiKey.includes(` ${q}`))) {
      buckets[home ? 2 : 3].push(city);
    }
    if (buckets[0].length >= limit) break;
  }

  const seen = new Set<string>();
  const results: CityMatch[] = [];
  for (const c of buckets.flat()) {
    // The dataset has a few duplicates (same city, several rows).
    const id = `${c.key}|${c.countryCode}`;
    if (seen.has(id)) continue;
    seen.add(id);
    results.push({
      name: c.name,
      countryCode: c.countryCode,
      province: c.province,
      timezone: c.timezone,
    });
    if (results.length >= limit) break;
  }
  return results;
}
