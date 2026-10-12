"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseItem } from "@/lib/trips/item-schema";
import { sortKeyFor } from "@/lib/trips/ordering";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/trips/types";

export type ItemActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "invalid" | "forbidden" | "failed"; fields?: string[] };

/** Create or update an itinerary item. Row-level security limits this to owners and editors. */
export async function saveItem(input: unknown): Promise<ItemActionResult> {
  const parsed = parseItem(input);
  if (!parsed.ok) return { ok: false, error: "invalid", fields: parsed.fields };
  const item = parsed.item;
  const supabase = await createClient();

  // The item's time zone follows its day's city (null for the wishlist).
  let timezone: string | null = null;
  if (item.dayId) {
    const { data: day } = await supabase
      .from("days")
      .select("id, trip_cities(timezone)")
      .eq("id", item.dayId)
      .eq("trip_id", item.tripId)
      .maybeSingle();
    if (!day) return { ok: false, error: "invalid", fields: ["dayId"] };
    timezone = (day.trip_cities as unknown as { timezone: string } | null)?.timezone ?? null;
  }

  const row = {
    trip_id: item.tripId,
    day_id: item.dayId,
    type: item.type,
    title: item.title,
    status: item.status,
    start_time: item.startTime ?? null,
    end_time: item.endTime ?? null,
    timezone,
    cost_amount: item.costAmount ?? null,
    cost_currency: item.costCurrency ?? null,
    cost_basis: item.costBasis,
    notes: item.notes ?? null,
    details: { ...item.details, ...(item.location ? { location: item.location } : {}) },
  };

  // Where does it go in the day's list?
  let existing: { day_id: string | null; start_time: string | null } | null = null;
  if (item.id) {
    const { data } = await supabase
      .from("items")
      .select("day_id, start_time")
      .eq("id", item.id)
      .eq("trip_id", item.tripId)
      .maybeSingle();
    if (!data) return { ok: false, error: "forbidden" };
    existing = data;
  }
  const placementChanged =
    !existing ||
    existing.day_id !== item.dayId ||
    (existing.start_time?.slice(0, 5) ?? undefined) !== item.startTime;
  let sortKey: string | undefined;
  if (placementChanged) {
    const siblings = supabase
      .from("items")
      .select("id, sort_key, start_time")
      .eq("trip_id", item.tripId);
    const { data: list } = await (
      item.dayId ? siblings.eq("day_id", item.dayId) : siblings.is("day_id", null)
    ).order("sort_key");
    sortKey = sortKeyFor(list ?? [], item.startTime, item.id);
  }

  if (item.id) {
    const { data, error } = await supabase
      .from("items")
      .update({ ...row, ...(sortKey ? { sort_key: sortKey } : {}) })
      .eq("id", item.id)
      .eq("trip_id", item.tripId)
      .select("id");
    if (error) return failed("update", error);
    if (!data?.length) return { ok: false, error: "forbidden" };
    revalidatePath(`/trips/${item.tripId}`);
    return { ok: true, id: item.id };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("items")
    .insert({ ...row, sort_key: sortKey, created_by: user?.id })
    .select("id")
    .single();
  if (error)
    return error.code === "42501" ? { ok: false, error: "forbidden" } : failed("insert", error);
  revalidatePath(`/trips/${item.tripId}`);
  return { ok: true, id: data.id };
}

export async function setItemStatus(
  tripId: string,
  itemId: string,
  status: ItemStatus,
): Promise<ItemActionResult> {
  if (!(ITEM_STATUSES as readonly string[]).includes(status))
    return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .update({ status })
    .eq("id", itemId)
    .eq("trip_id", tripId)
    .select("id");
  if (error) return failed("status", error);
  if (!data?.length) return { ok: false, error: "forbidden" };
  revalidatePath(`/trips/${tripId}`);
  return { ok: true, id: itemId };
}

export async function deleteItem(tripId: string, itemId: string): Promise<ItemActionResult> {
  const supabase = await createClient();
  // Voucher files go too; their attachment rows cascade with the item.
  const { data: files } = await supabase
    .from("attachments")
    .select("storage_path")
    .eq("item_id", itemId);
  const { data, error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("trip_id", tripId)
    .select("id");
  if (error) return failed("delete", error);
  if (!data?.length) return { ok: false, error: "forbidden" };
  if (files?.length)
    await supabase.storage.from("trip-files").remove(files.map((f) => f.storage_path));
  revalidatePath(`/trips/${tripId}`);
  return { ok: true, id: itemId };
}

function failed(op: string, error: { code?: string; message: string }): ItemActionResult {
  console.error(`[items] ${op} failed`, error.code, error.message);
  return { ok: false, error: "failed" };
}
