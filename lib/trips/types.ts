// Row shapes for the tables M2 reads. Mirrors supabase/migrations (design.md §14).

export const TRIP_STAGES = ["idea", "planning", "booked", "ongoing", "done"] as const;
export type TripStage = (typeof TRIP_STAGES)[number];

export const ITEM_TYPES = ["flight", "stay", "tour", "place", "food", "transport", "note"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_STATUSES = ["idea", "planned", "booked", "done"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export type MemberRole = "owner" | "editor" | "contributor" | "viewer";

export type Trip = {
  id: string;
  owner_id: string;
  title: string;
  stage: TripStage;
  start_date: string | null; // YYYY-MM-DD
  day_count: number;
  created_at: string;
};

export type TripCity = {
  id: string;
  trip_id: string;
  name: string;
  country_code: string;
  timezone: string;
  currency: string;
  sort_key: string;
};

export type Day = {
  id: string;
  trip_id: string;
  day_index: number;
  city_id: string | null;
  note: string | null;
};

export type Item = {
  id: string;
  trip_id: string;
  day_id: string | null;
  sort_key: string;
  type: ItemType;
  title: string;
  status: ItemStatus;
  start_time: string | null; // HH:MM:SS
  end_time: string | null;
  timezone: string | null;
  cost_amount: number | null;
  cost_currency: string | null;
  cost_basis: "per_person" | "shared";
  notes: string | null;
  details: Record<string, unknown>;
};

export const ITEM_TYPE_EMOJI: Record<ItemType, string> = {
  flight: "✈️",
  stay: "🏨",
  tour: "🚐",
  place: "📍",
  food: "🍜",
  transport: "🚆",
  note: "📝",
};
