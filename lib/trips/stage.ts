import type { ChipTone } from "@/components/ui/chip";
import type { TripStage } from "./types";

/** Ongoing first, finished last. */
export const STAGE_ORDER: TripStage[] = ["ongoing", "booked", "planning", "idea", "done"];

export const STAGE_TONE: Record<TripStage, ChipTone> = {
  idea: "neutral",
  planning: "sky",
  booked: "amber",
  ongoing: "green",
  done: "neutral",
};
