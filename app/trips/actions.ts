"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  validateCreateTrip,
  type CreateTripError,
  type CreateTripInput,
} from "@/lib/trips/create-trip";
import { createClient } from "@/lib/supabase/server";
import {
  validateTripDates,
  type TripDatesError,
  type TripDatesInput,
} from "@/lib/trips/trip-dates";

export type CreateTripState = { error?: CreateTripError | "saveFailed" | "signedOut" };

export async function createTrip(input: CreateTripInput): Promise<CreateTripState> {
  const result = validateCreateTrip(input);
  if (!result.ok) return { error: result.error };
  const { trip } = result;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "signedOut" };

  // Cities first would be nicer, but they need the trip id. The day-sync trigger
  // creates the days; the city trigger then fills in each day's city.
  const { data: created, error: tripError } = await supabase
    .from("trips")
    .insert({
      owner_id: user.id,
      title: trip.title,
      stage: trip.stage,
      start_date: trip.startDate,
      day_count: trip.dayCount,
    })
    .select("id")
    .single();
  if (tripError || !created) {
    console.error("[createTrip] trip insert failed", tripError);
    return { error: "saveFailed" };
  }

  const { error: citiesError } = await supabase
    .from("trip_cities")
    .insert(trip.cities.map((c) => ({ ...c, trip_id: created.id })));
  if (citiesError) {
    console.error("[createTrip] cities insert failed", citiesError);
    // Don't leave a half-created trip behind.
    await supabase.from("trips").delete().eq("id", created.id);
    return { error: "saveFailed" };
  }

  redirect(`/trips/${created.id}`);
}

export type RenameTripResult =
  | { ok: true; title: string }
  | { ok: false; error: "titleRequired" | "titleTooLong" | "forbidden" | "saveFailed" };

/** Rename a trip. Row-level security limits this to the owner and editors. */
export async function renameTrip(tripId: string, rawTitle: string): Promise<RenameTripResult> {
  const title = rawTitle.trim();
  if (!title) return { ok: false, error: "titleRequired" };
  if (title.length > 120) return { ok: false, error: "titleTooLong" };
  if (!/^[0-9a-f-]{36}$/i.test(tripId)) return { ok: false, error: "forbidden" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .update({ title })
    .eq("id", tripId)
    .select("id");
  if (error) {
    console.error("[renameTrip] failed", error.code, error.message);
    return { ok: false, error: "saveFailed" };
  }
  if (!data?.length) return { ok: false, error: "forbidden" };
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
  return { ok: true, title };
}

export type UpdateDatesResult =
  { ok: true } | { ok: false; error: TripDatesError | "forbidden" | "saveFailed" };

/**
 * Set or change a trip's dates/length. Shrinking removes the last days; the database moves
 * their items to the wishlist (see migration 2). Giving an idea trip dates moves it to planning.
 */
export async function updateTripDates(
  tripId: string,
  input: TripDatesInput,
): Promise<UpdateDatesResult> {
  const parsed = validateTripDates(input);
  if (!parsed.ok) return parsed;
  if (!/^[0-9a-f-]{36}$/i.test(tripId)) return { ok: false, error: "forbidden" };

  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("stage")
    .eq("id", tripId)
    .maybeSingle();
  if (!trip) return { ok: false, error: "forbidden" };

  const { data, error } = await supabase
    .from("trips")
    .update({
      start_date: parsed.startDate,
      day_count: parsed.dayCount,
      ...(parsed.startDate && trip.stage === "idea" ? { stage: "planning" } : {}),
    })
    .eq("id", tripId)
    .select("id");
  if (error) {
    console.error("[updateTripDates] failed", error.code, error.message);
    return { ok: false, error: "saveFailed" };
  }
  if (!data?.length) return { ok: false, error: "forbidden" };
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
  return { ok: true };
}
