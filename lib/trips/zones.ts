// Human names for time zones: "Almaty time (GMT+5)", "WIB (GMT+7)".

const INDONESIA: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Pontianak": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
};

/** Zones offered for flights besides the trip's own cities: home first. */
export const HOME_ZONES = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] as const;

/** "Asia/Ho_Chi_Minh" → "Ho Chi Minh". */
export function zoneCity(tz: string): string {
  return (tz.split("/").pop() ?? tz).replace(/_/g, " ");
}

/** "GMT+5" at a given moment (offsets change with daylight saving). */
export function zoneOffset(tz: string, at: Date = new Date()): string {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName");
    return part?.value === "GMT" ? "GMT+0" : (part?.value ?? "");
  } catch {
    return "";
  }
}

/** Short label for lists: "WIB", "Almaty". */
export function zoneShort(tz: string): string {
  return INDONESIA[tz] ?? zoneCity(tz);
}

/**
 * Full label, e.g. { name: "Almaty", offset: "GMT+5", indonesian: false }.
 * The UI turns this into "Almaty time (GMT+5)" / "waktu Almaty (GMT+5)" or "WIB (GMT+7)".
 */
export function zoneParts(
  tz: string,
  at?: Date,
): { name: string; offset: string; indonesian: boolean } {
  const indo = INDONESIA[tz];
  return { name: indo ?? zoneCity(tz), offset: zoneOffset(tz, at), indonesian: Boolean(indo) };
}
