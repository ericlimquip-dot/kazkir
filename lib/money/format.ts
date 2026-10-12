import type { IdrRates } from "./rates";

/** Currencies offered in pickers besides the trip's own. */
export const COMMON_CURRENCIES = ["IDR", "USD", "EUR"] as const;

export function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/** Amount in Rupiah, rounded to Rp 100 — an estimate shouldn't look more precise than it is. */
export function toIdr(amount: number, currency: string, rates: IdrRates): number | null {
  if (currency === "IDR") return amount;
  const rate = rates[currency];
  if (!rate || !Number.isFinite(amount)) return null;
  return Math.round((amount * rate) / 100) * 100;
}

/** "Rp 987.000" — Rupiah always uses Indonesian formatting, whatever the app language. */
export function formatIdr(amount: number): string {
  return formatMoney(amount, "IDR", "id-ID");
}

/** Name of a currency in the viewer's language, e.g. "Kazakhstani Tenge" / "Tenge Kazakhstan". */
export function currencyName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Parses "25000", "25.000", "25,5" or "1,250.50" typed by people from different countries. */
export function parseAmount(input: string): number | null {
  const s = input.replace(/\s/g, "");
  if (!s) return null;
  if (!/^[\d.,]+$/.test(s)) return null;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  const decimalSep = lastDot > lastComma ? "." : ",";
  const decimalIdx = Math.max(lastDot, lastComma);
  const decimals = decimalIdx === -1 ? 0 : s.length - decimalIdx - 1;
  // A single separator followed by exactly 3 digits is a thousands separator ("25.000" = 25000).
  const separators = (s.match(/[.,]/g) ?? []).length;
  const isThousands =
    decimalIdx !== -1 && decimals === 3 && (separators > 1 || s.indexOf(decimalSep) === decimalIdx);
  let normalised: string;
  if (decimalIdx === -1 || isThousands) normalised = s.replace(/[.,]/g, "");
  else normalised = s.slice(0, decimalIdx).replace(/[.,]/g, "") + "." + s.slice(decimalIdx + 1);
  const n = Number(normalised);
  return Number.isFinite(n) ? n : null;
}
