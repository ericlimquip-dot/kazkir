"use client";

import { PlanBoard, type BoardDay } from "@/components/trip/plan-board";
import { TripDates } from "@/components/trip/trip-dates";
import { TripTitle } from "@/components/trip/trip-title";
import type { Item } from "@/lib/trips/types";

// Sample data for the developer gallery. Saving won't work here (no real trip), but every
// screen of the item flow can be opened and checked without signing in.
const TRIP = "00000000-0000-4000-8000-000000000001";
const DAYS: BoardDay[] = [
  {
    id: "00000000-0000-4000-8000-0000000000d1",
    dayIndex: 1,
    title: "Day 1 · Sat, 1 May",
    cityName: "Almaty",
    currency: "KZT",
    timezone: "Asia/Almaty",
  },
  {
    id: "00000000-0000-4000-8000-0000000000d2",
    dayIndex: 2,
    title: "Day 2 · Sun, 2 May",
    cityName: "Almaty",
    currency: "KZT",
    timezone: "Asia/Almaty",
  },
  {
    id: "00000000-0000-4000-8000-0000000000d3",
    dayIndex: 3,
    title: "Day 3 · Mon, 3 May",
    cityName: "Bishkek",
    currency: "KGS",
    timezone: "Asia/Bishkek",
  },
];

const base = {
  trip_id: TRIP,
  timezone: "Asia/Almaty",
  end_time: null,
  cost_amount: null,
  cost_currency: null,
  cost_basis: "per_person" as const,
  notes: null,
};

const ITEMS: Item[] = [
  {
    ...base,
    id: "00000000-0000-4000-8000-0000000000a1",
    day_id: DAYS[0].id,
    sort_key: "a0",
    type: "flight",
    title: "Jakarta → Almaty",
    status: "booked",
    start_time: "08:15:00",
    end_time: "13:40:00",
    details: {
      fromAirport: "CGK",
      toAirport: "ALA",
      flightNumber: "KC 932",
      bookingCode: "X7K2PQ",
      departTimezone: "Asia/Jakarta",
      arriveTimezone: "Asia/Almaty",
    },
  },
  {
    ...base,
    id: "00000000-0000-4000-8000-0000000000a2",
    day_id: DAYS[0].id,
    sort_key: "a1",
    type: "stay",
    title: "Hotel Kazakhstan",
    status: "booked",
    start_time: null,
    details: { nights: 2, checkInTime: "14:00", contact: "+7 727 291 9101" },
  },
  {
    ...base,
    id: "00000000-0000-4000-8000-0000000000a3",
    day_id: DAYS[1].id,
    sort_key: "a0",
    type: "tour",
    title: "Charyn Canyon day tour",
    status: "planned",
    start_time: "07:30:00",
    cost_amount: 25000,
    cost_currency: "KZT",
    details: {
      operator: "Steppe Tours",
      contact: "+7 701 555 0123",
      pickupTime: "07:30",
      pickupPlace: "Hotel lobby",
      inclusions: "Transport, lunch, guide",
      cancelBy: "2027-04-28",
      stops: [
        { time: "10:00", name: "Charyn Canyon" },
        { time: "13:30", name: "Kolsai Lake 1" },
      ],
    },
  },
  {
    ...base,
    id: "00000000-0000-4000-8000-0000000000a4",
    day_id: null,
    sort_key: "a0",
    type: "place",
    title: "Big Almaty Lake",
    status: "idea",
    start_time: null,
    details: { location: "Ile-Alatau National Park" },
  },
];

export function PlanDemo() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <TripTitle tripId={TRIP} title="Central Asia with the team" canEdit />
        <TripDates
          tripId={TRIP}
          summary="Almaty → Bishkek · 7 days · no dates yet"
          startDate={null}
          dayCount={7}
          stage="idea"
          canEdit
        />
      </div>
      <PlanBoard
        tripId={TRIP}
        days={DAYS}
        items={ITEMS}
        canEdit
        canContribute
        fallbackCurrency="KZT"
        startDate="2027-05-01"
        fallbackTimezone="Asia/Almaty"
        rates={{ KZT: 39.48, KGS: 207.25, USD: 17860, EUR: 20000, IDR: 1 }}
      />
    </div>
  );
}
