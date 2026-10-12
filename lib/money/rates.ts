import "server-only";

/** Rupiah per 1 unit of each currency, e.g. { KZT: 39.48, IDR: 1 }. */
export type IdrRates = Record<string, number>;

const SOURCE = "https://open.er-api.com/v6/latest/USD"; // ExchangeRate-API open access, daily, no key

/**
 * Daily rates, cached by Next for 12 hours. Returns {} if the source is unreachable,
 * in which case the app simply doesn't show Rupiah estimates.
 */
export async function getIdrRates(): Promise<IdrRates> {
  try {
    const res = await fetch(SOURCE, { next: { revalidate: 60 * 60 * 12 } });
    if (!res.ok) return {};
    const body = (await res.json()) as { result?: string; rates?: Record<string, number> };
    const usd = body.rates;
    if (body.result !== "success" || !usd?.IDR) return {};
    // Fetched in USD and crossed, because tiny "per Rupiah" numbers lose precision.
    const out: IdrRates = {};
    for (const [code, perUsd] of Object.entries(usd)) {
      if (perUsd > 0) out[code] = usd.IDR / perUsd;
    }
    return out;
  } catch (error) {
    console.warn("[rates] unavailable", error instanceof Error ? error.message : error);
    return {};
  }
}

/** Only the currencies a page needs, to keep what's sent to the browser small. */
export function pickRates(rates: IdrRates, codes: Iterable<string>): IdrRates {
  const out: IdrRates = {};
  for (const code of codes) if (rates[code]) out[code] = rates[code];
  return out;
}
