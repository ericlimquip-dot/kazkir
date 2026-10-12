import { z } from "zod";
import { ITEM_STATUSES, ITEM_TYPES } from "./types";

// Empty form fields arrive as "" — treat them as "not set".
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .optional()
  .or(z.literal("").transform(() => undefined));

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const TRANSPORT_MODES = ["train", "bus", "transfer", "ferry", "car", "other"] as const;
export const MAX_TOUR_STOPS = 20;

const tourStop = z.object({
  time,
  name: z.string().trim().min(1).max(120),
  note: optionalText(300),
});

/** Type-specific fields, stored in items.details. */
export const DETAILS_SCHEMAS = {
  flight: z.object({
    flightNumber: optionalText(12),
    fromAirport: optionalText(60),
    toAirport: optionalText(60),
    departTerminal: optionalText(20),
    arriveTerminal: optionalText(20),
    bookingCode: optionalText(40),
    // Overnight flights land the next day (or the one after, for long hauls).
    arriveDayOffset: z.coerce.number().int().min(0).max(2).optional(),
  }),
  stay: z.object({
    nights: z.coerce.number().int().min(1).max(90).default(1),
    checkInTime: time,
    checkOutTime: time,
    bookingCode: optionalText(40),
    contact: optionalText(60),
  }),
  tour: z.object({
    operator: optionalText(80),
    contact: optionalText(60), // phone / WhatsApp
    pickupTime: time,
    pickupPlace: optionalText(160),
    inclusions: optionalText(600),
    cancelBy: isoDate,
    stops: z.array(tourStop).max(MAX_TOUR_STOPS).default([]),
  }),
  place: z.object({}),
  food: z.object({}),
  transport: z.object({
    mode: z.enum(TRANSPORT_MODES).default("other"),
    from: optionalText(120),
    to: optionalText(120),
    bookingCode: optionalText(40),
  }),
  note: z.object({}),
} as const;

const baseItem = z.object({
  id: z.uuid().optional(),
  tripId: z.uuid(),
  dayId: z.uuid().nullable(),
  type: z.enum(ITEM_TYPES),
  title: z.string().trim().min(1).max(200),
  status: z.enum(ITEM_STATUSES).default("planned"),
  startTime: time,
  endTime: time,
  location: optionalText(200),
  costAmount: z
    // "" must be checked first: z.coerce.number() would turn it into 0.
    .union([z.literal("").transform(() => undefined), z.coerce.number().min(0).max(1e12)])
    .optional(),
  costCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  costBasis: z.enum(["per_person", "shared"]).default("per_person"),
  notes: optionalText(2000),
  details: z.record(z.string(), z.unknown()).default({}),
});

export type ItemInput = z.input<typeof baseItem>;

export type ValidItem = Omit<z.output<typeof baseItem>, "details"> & {
  details: Record<string, unknown>;
};

/** Validates the common fields, then the details for the chosen type. Pure. */
export function parseItem(
  input: unknown,
): { ok: true; item: ValidItem } | { ok: false; fields: string[] } {
  const base = baseItem.safeParse(input);
  if (!base.success) {
    return {
      ok: false,
      fields: [...new Set(base.error.issues.map((i) => String(i.path[0] ?? "form")))],
    };
  }
  const details = DETAILS_SCHEMAS[base.data.type].safeParse(base.data.details);
  if (!details.success) {
    return {
      ok: false,
      fields: [...new Set(details.error.issues.map((i) => `details.${i.path.join(".")}`))],
    };
  }
  // A cost needs a currency; a lone currency is ignored.
  const costAmount = base.data.costAmount;
  if (costAmount !== undefined && !base.data.costCurrency)
    return { ok: false, fields: ["costCurrency"] };
  return {
    ok: true,
    item: {
      ...base.data,
      costCurrency: costAmount === undefined ? undefined : base.data.costCurrency,
      details: stripUndefined(details.data as Record<string, unknown>),
    },
  };
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
