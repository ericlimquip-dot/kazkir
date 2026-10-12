"use server";

import { redirect } from "next/navigation";
import {
  validateCreateTrip,
  type CreateTripError,
  type CreateTripInput,
} from "@/lib/trips/create-trip";
import { createClient } from "@/lib/supabase/server";

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
