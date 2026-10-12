import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTile } from "@/components/ui/icon-tile";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/server";
import { dateOfDay, endDateOf, formatDateRange, formatDayDate, shortTime } from "@/lib/trips/dates";
import { STAGE_TONE } from "@/lib/trips/stage";
import { ITEM_TYPE_EMOJI, type Day, type Item, type Trip, type TripCity } from "@/lib/trips/types";

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

  const [tripRes, citiesRes, daysRes, itemsRes] = await Promise.all([
    supabase
      .from("trips")
      .select("id, owner_id, title, stage, start_date, day_count, created_at")
      .eq("id", tripId)
      .maybeSingle(),
    supabase.from("trip_cities").select("*").eq("trip_id", tripId).order("sort_key"),
    supabase.from("days").select("*").eq("trip_id", tripId).order("day_index"),
    supabase.from("items").select("*").eq("trip_id", tripId).order("sort_key"),
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
          <PlanView
            days={days}
            items={items}
            startDate={trip.start_date}
            locale={locale}
            cityById={cityById}
            labels={{
              wishlist: t("wishlist"),
              wishlistHint: t("wishlistHint"),
              wishlistEmpty: t("wishlistEmpty"),
              nothingPlanned: t("nothingPlanned"),
              day: (n: number) => t("day", { n }),
              itemCount: (count: number) => t("itemCount", { count }),
            }}
          />
        ) : (
          <EmptyState title={t(`tabs.${tab}`)} description={t("comingSoon")} />
        )}
      </div>
    </main>
  );
}

type PlanLabels = {
  wishlist: string;
  wishlistHint: string;
  wishlistEmpty: string;
  nothingPlanned: string;
  day: (n: number) => string;
  itemCount: (count: number) => string;
};

function PlanView({
  days,
  items,
  startDate,
  locale,
  cityById,
  labels,
}: {
  days: Day[];
  items: Item[];
  startDate: string | null;
  locale: string;
  cityById: Map<string, TripCity>;
  labels: PlanLabels;
}) {
  const wishlist = items.filter((i) => !i.day_id);

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-labelledby="wishlist-heading"
        className="rounded-3xl border border-dashed border-sky-300 bg-white/60 p-4"
      >
        <h2 id="wishlist-heading" className="text-[16px] font-medium tracking-[-0.01em] text-ink">
          {labels.wishlist}
        </h2>
        <p className="text-[13px] font-medium text-muted-grey">{labels.wishlistHint}</p>
        {wishlist.length === 0 ? (
          <p className="mt-3 text-[14px] font-medium text-muted">{labels.wishlistEmpty}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {wishlist.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>

      <ol className="flex flex-col gap-4">
        {days.map((day) => {
          const date = dateOfDay(startDate, day.day_index);
          const city = day.city_id ? cityById.get(day.city_id) : undefined;
          const dayItems = items.filter((i) => i.day_id === day.id);
          return (
            <li key={day.id} className="rounded-3xl bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[17px] font-medium tracking-[-0.02em] text-ink">
                  {labels.day(day.day_index)}
                  {date ? (
                    <span className="text-muted"> · {formatDayDate(date, locale)}</span>
                  ) : null}
                </h2>
                <p className="text-[13px] font-medium text-muted-grey">
                  {city ? `${city.name} · ` : ""}
                  {labels.itemCount(dayItems.length)}
                </p>
              </div>
              {dayItems.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-hover px-3 py-3 text-[14px] font-medium text-muted">
                  {labels.nothingPlanned}
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {dayItems.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ItemRow({ item }: { item: Item }) {
  const time = shortTime(item.start_time);
  return (
    <li className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-white p-2.5">
      <IconTile>{ITEM_TYPE_EMOJI[item.type]}</IconTile>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-medium tracking-[-0.01em] text-ink">
          {item.title}
        </span>
        {time ? <span className="text-[13px] font-medium text-muted-grey">{time}</span> : null}
      </div>
    </li>
  );
}
