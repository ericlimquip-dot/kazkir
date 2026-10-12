import { generateKeyBetween } from "fractional-indexing";

type Ordered = { id: string; sort_key: string; start_time: string | null };

/**
 * Sort key for an item joining a day's list (already sorted by sort_key).
 * Timed items slot in before the first later-timed item; untimed items go to the end.
 * Keys are fractional, so drag-and-drop (M3) can insert between any two items.
 */
export function sortKeyFor(
  list: Ordered[],
  startTime: string | undefined,
  excludeId?: string,
): string {
  const others = list.filter((i) => i.id !== excludeId);
  const time = startTime?.slice(0, 5);
  let index = others.length;
  if (time) {
    const later = others.findIndex((i) => i.start_time !== null && i.start_time.slice(0, 5) > time);
    if (later !== -1) index = later;
  }
  const before = index > 0 ? others[index - 1].sort_key : null;
  const after = index < others.length ? others[index].sort_key : null;
  try {
    return generateKeyBetween(before, after);
  } catch {
    // Duplicate or out-of-order keys (e.g. rows still on the column default): append instead.
    const last = others.reduce<string | null>(
      (max, i) => (max === null || i.sort_key > max ? i.sort_key : max),
      null,
    );
    return generateKeyBetween(last, null);
  }
}
