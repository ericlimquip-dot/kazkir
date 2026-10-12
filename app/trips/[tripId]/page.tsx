import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { PlanBoard, type BoardDay } from "@/components/trip/plan-board";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { COMMON_CURRENCIES } from "@/lib/money/format";
import { getIdrRates, pickRates } from "@/lib/money/rates";
import { createClient } from "@/lib/supabase/server";
import { dateOfDay, endDateOf, formatDateRange, formatDayDate } from "@/lib/trips/dates";
import { STAGE_TONE } from "@/lib/trips/stage";
import type { Day, Item, MemberRole, Trip, TripCity } from "@/lib/trips/types";

const TABS = ["plan", "ideas", "money", "people"] as const;
type Tab = (typeof TABS)[number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tripId } = await params;
  if (!UUID.test(tripId)) notFound();
  const { tab: tabParam } = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as Tab)
    : "plan";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/trips/${tripId}`);

  const [tripRes, citiesRes, daysRes, itemsRes, roleRes, allRates] = await Promise.all([
    supabase
      .from("trips")
      .select("id, owner_id, title, stage, start_date, day_count, created_at")
      .eq("id", tripId)
      .maybeSingle(),
    supabase.from("trip_cities").select("*").eq("trip_id", tripId).order("sort_key"),
    supabase.from("days").select("*").eq("trip_id", tripId).order("day_index"),
    supabase.from("items").select("*").eq("trip_id", tripId).order("sort_key"),
    supabase
      .from("trip_members")
      .select("role")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .maybeSingle(),
    getIdrRates(),
  ]);
  // RLS hides trips you're not a member of, so "not found" covers "not allowed" too.
  const trip = tripRes.data as Trip | null;
  if (!trip) notFound();
  const cities = (citiesRes.data ?? []) as TripCity[];
  const days = (daysRes.data ?? []) as Day[];
  const items = (itemsRes.data ?? []) as Item[];

  const t = await getTranslations("Trip");
  const tStage = await getTranslations("Trips");
  const locale = await getLocale();
  const cityById = new Map(cities.map((c) => [c.id, c]));
  const role = (roleRes.data?.role ?? "viewer") as MemberRole;
  const canEdit = role === "owner" || role === "editor";
  const canContribute = canEdit || role === "contributor";
  const rates = pickRates(allRates, [
    ...cities.map((c) => c.currency),
    ...items.map((i) => i.cost_currency).filter((c): c is string => !!c),
    ...COMMON_CURRENCIES,
  ]);
  const boardDays: BoardDay[] = days.map((day) => {
    const date = dateOfDay(trip.start_date, day.day_index);
    const city = day.city_id ? cityById.get(day.city_id) : undefined;
    return {
      id: day.id,
      dayIndex: day.day_index,
      title: `${t("day", { n: day.day_index })}${date ? ` · ${formatDayDate(date, locale)}` : ""}`,
      cityName: city?.name ?? null,
      currency: city?.currency ?? null,
    };
  });

  return (
    <main className="min-h-dvh bg-surface-warm px-4 pb-16 pt-6 ipad:px-10">
      <div className="mx-auto flex max-w-237.5 flex-col gap-5">
        <Link
          href="/trips"
          className="self-start text-[14px] font-medium text-muted-teal hover:underline"
        >
          ← {t("back")}
        </Link>

        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="animate-section-rise text-[clamp(1.75rem,4vw,2.25rem)] font-medium leading-[1.12] tracking-[-0.04em] text-ink-strong motion-reduce:animate-none">
              {trip.title}
            </h1>
            <Chip tone={STAGE_TONE[trip.stage]}>{tStage(`stage.${trip.stage}`)}</Chip>
          </div>
          <p className="text-[14px] font-medium text-muted">
            {cities.map((c) => c.name).join(" → ")}
            {cities.length > 0 ? " · " : ""}
            {trip.start_date
              ? formatDateRange(trip.start_date, endDateOf(trip.start_date, trip.day_count), locale)
              : tStage("noDates", { count: trip.day_count })}
          </p>
        </header>

        <nav
          aria-label={trip.title}
          className="flex gap-1 overflow-x-auto rounded-2xl bg-white/70 p-1 shadow-card"
        >
          {TABS.map((id) => (
            <Link
              key={id}
              href={id === "plan" ? `/trips/${trip.id}` : `/trips/${trip.id}?tab=${id}`}
              aria-current={tab === id ? "page" : undefined}
              className={cn(
                "flex min-h-10 shrink-0 items-center rounded-xl border px-4 text-[15px] font-medium tracking-[-0.01em] text-ink",
                tab === id
                  ? "border-sky-300 bg-sky-100 shadow-active"
                  : "border-transparent hover:bg-hover",
              )}
            >
              {t(`tabs.${id}`)}
            </Link>
          ))}
        </nav>

        {tab === "plan" ? (
          <PlanBoard
            tripId={trip.id}
            days={boardDays}
            items={items}
            canEdit={canEdit}
            canContribute={canContribute}
            fallbackCurrency={cities[0]?.currency ?? "IDR"}
            rates={rates}
          />
        ) : (
          <EmptyState title={t(`tabs.${tab}`)} description={t("comingSoon")} />
        )}
      </div>
    </main>
  );
}
