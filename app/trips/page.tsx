import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { InstallPrompt } from "@/components/install-prompt";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { endDateOf, formatDateRange } from "@/lib/trips/dates";
import { STAGE_ORDER, STAGE_TONE } from "@/lib/trips/stage";
import type { Trip, TripCity } from "@/lib/trips/types";

type TripWithCities = Trip & { trip_cities: Pick<TripCity, "name" | "sort_key">[] };

export default async function TripsPage() {
  const t = await getTranslations("Trips");
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/trips");

  const { data } = await supabase
    .from("trips")
    .select(
      "id, owner_id, title, stage, start_date, day_count, created_at, trip_cities(name, sort_key)",
    )
    .order("created_at", { ascending: false });
  const trips = (data ?? []) as TripWithCities[];

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const name = profile?.display_name || user.email || "";

  return (
    <main className="min-h-dvh bg-surface-warm px-4 py-8 ipad:px-10">
      <div className="mx-auto flex max-w-237.5 flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="animate-section-rise text-[clamp(1.75rem,4vw,2.25rem)] font-medium leading-[1.12] tracking-[-0.04em] text-ink-strong motion-reduce:animate-none">
              {t("title")}
            </h1>
            <p className="text-[14px] font-medium text-muted">{t("signedInAs", { name })}</p>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                {t("signOut")}
              </Button>
            </form>
          </div>
        </header>

        <InstallPrompt />

        <Link
          href="/trips/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-ink px-4 text-[15px] font-medium tracking-[-0.01em] text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          + {t("newTrip")}
        </Link>

        {trips.length === 0 ? (
          <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : (
          STAGE_ORDER.map((stage) => {
            const group = trips.filter((trip) => trip.stage === stage);
            if (group.length === 0) return null;
            return (
              <section key={stage} className="flex flex-col gap-3">
                <h2 className="text-[13px] font-medium uppercase tracking-[0.04em] text-muted-grey">
                  {t(`stage.${stage}`)}
                </h2>
                <div className="grid gap-3 ipad:grid-cols-2">
                  {group.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      locale={locale}
                      stageLabel={t(`stage.${stage}`)}
                      noDates={t("noDates", { count: trip.day_count })}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}

function TripCard({
  trip,
  locale,
  stageLabel,
  noDates,
}: {
  trip: TripWithCities;
  locale: string;
  stageLabel: string;
  noDates: string;
}) {
  const cities = [...trip.trip_cities]
    .sort((a, b) => a.sort_key.localeCompare(b.sort_key))
    .map((c) => c.name);
  const when = trip.start_date
    ? formatDateRange(trip.start_date, endDateOf(trip.start_date, trip.day_count), locale)
    : noDates;

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-card transition-[box-shadow,transform] duration-300 ease-out-soft hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[18px] font-medium leading-tight tracking-[-0.02em] text-ink">
          {trip.title}
        </h3>
        <Chip tone={STAGE_TONE[trip.stage]}>{stageLabel}</Chip>
      </div>
      {cities.length > 0 ? (
        <p className="text-[14px] font-medium text-muted">{cities.join(" → ")}</p>
      ) : null}
      <p className="text-[13px] font-medium text-muted-grey">{when}</p>
    </Link>
  );
}
