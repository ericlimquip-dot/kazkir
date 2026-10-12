"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Chip, type ChipTone } from "@/components/ui/chip";
import { IconTile } from "@/components/ui/icon-tile";
import { Sheet } from "@/components/ui/sheet";
import { dateOfDay, formatDayDate, shortTime } from "@/lib/trips/dates";
import { effectiveStatus } from "@/lib/trips/when";
import { ITEM_TYPE_EMOJI, type Item, type ItemStatus } from "@/lib/trips/types";
import { formatIdr, formatMoney, toIdr } from "@/lib/money/format";
import type { IdrRates } from "@/lib/money/rates";
import { ItemDetail } from "./item-detail";
import { ItemForm, type DayOption } from "./item-form";

export type BoardDay = {
  id: string;
  dayIndex: number;
  title: string; // "Day 2 · Wed, 3 Mar"
  cityName: string | null;
  currency: string | null;
};

type SheetState =
  | { kind: "closed" }
  | { kind: "new"; dayId: string | null }
  | { kind: "view"; id: string }
  | { kind: "edit"; id: string };

const STATUS_TONE: Record<ItemStatus, ChipTone> = {
  idea: "neutral",
  planned: "sky",
  booked: "amber",
  done: "green",
};

/** A stay's later nights and its check-out day, shown as light rows on the following days. */
type Continuation = { item: Item; label: string };

export function PlanBoard({
  tripId,
  days,
  items,
  canEdit,
  canContribute,
  fallbackCurrency,
  rates,
  startDate,
  fallbackTimezone,
}: {
  tripId: string;
  days: BoardDay[];
  items: Item[];
  canEdit: boolean;
  canContribute: boolean;
  fallbackCurrency: string;
  rates: IdrRates;
  startDate: string | null;
  fallbackTimezone: string;
}) {
  const t = useTranslations("Item");
  const tTrip = useTranslations("Trip");
  const router = useRouter();
  const [sheet, setSheet] = useState<SheetState>({ kind: "closed" });
  const locale = useLocale();
  // Re-evaluated every minute so items flip to "done" as their end time passes.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const close = () => setSheet({ kind: "closed" });
  const refresh = () => router.refresh();

  const dayOptions: DayOption[] = days.map((d) => ({
    id: d.id,
    dayIndex: d.dayIndex,
    label: d.title,
    currency: d.currency,
  }));
  /** "Day 3 · Mon, 3 May", also past the trip's last day (stay check-outs, overnight arrivals). */
  const dayTitleAt = (n: number) => {
    const date = dateOfDay(startDate, n);
    return date ? `${tTrip("day", { n })} · ${formatDayDate(date, locale)}` : tTrip("day", { n });
  };
  const statusOf = (item: Item) =>
    effectiveStatus(
      item,
      item.day_id ? (dayById.get(item.day_id)?.dayIndex ?? null) : null,
      startDate,
      now,
      fallbackTimezone,
    );
  const dayById = new Map(days.map((d) => [d.id, d]));
  const dayByIndex = new Map(days.map((d) => [d.dayIndex, d]));

  const continuations = new Map<string, Continuation[]>();
  for (const item of items) {
    if (item.type !== "stay" || !item.day_id) continue;
    const start = dayById.get(item.day_id);
    const nights = Number((item.details as { nights?: number }).nights ?? 1);
    if (!start || nights < 1) continue;
    for (let j = 1; j <= nights; j++) {
      const day = dayByIndex.get(start.dayIndex + j);
      if (!day) break;
      const checkOutTime = (item.details as { checkOutTime?: string }).checkOutTime;
      const label =
        j < nights
          ? t("night", { n: j + 1, total: nights })
          : `${t("checkOut")}${checkOutTime ? ` ${checkOutTime}` : ""}`;
      continuations.set(day.id, [...(continuations.get(day.id) ?? []), { item, label }]);
    }
  }

  const current =
    sheet.kind === "view" || sheet.kind === "edit"
      ? items.find((i) => i.id === sheet.id)
      : undefined;
  const sheetTitle =
    sheet.kind === "new"
      ? t("addTo", {
          where: sheet.dayId ? (dayById.get(sheet.dayId)?.title ?? "") : tTrip("wishlist"),
        })
      : (current?.title ?? "");

  const wishlist = items.filter((i) => !i.day_id);

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-labelledby="wishlist-heading"
        className="rounded-3xl border border-dashed border-sky-300 bg-white/60 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="wishlist-heading"
              className="text-[16px] font-medium tracking-[-0.01em] text-ink"
            >
              {tTrip("wishlist")}
            </h2>
            <p className="text-[13px] font-medium text-muted-grey">{tTrip("wishlistHint")}</p>
          </div>
          {canEdit ? (
            <AddButton label={t("add")} onClick={() => setSheet({ kind: "new", dayId: null })} />
          ) : null}
        </div>
        {wishlist.length === 0 ? (
          <p className="mt-3 text-[14px] font-medium text-muted">{tTrip("wishlistEmpty")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {wishlist.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                status={statusOf(item).status}
                statusLabel={t(`status.${statusOf(item).status}`)}
                rates={rates}
                onOpen={() => setSheet({ kind: "view", id: item.id })}
              />
            ))}
          </ul>
        )}
      </section>

      <ol className="flex flex-col gap-4">
        {days.map((day) => {
          const dayItems = items.filter((i) => i.day_id === day.id);
          const extra = continuations.get(day.id) ?? [];
          return (
            <li key={day.id} className="rounded-3xl bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[17px] font-medium tracking-[-0.02em] text-ink">
                    {day.title}
                  </h2>
                  <p className="text-[13px] font-medium text-muted-grey">
                    {day.cityName ? `${day.cityName} · ` : ""}
                    {tTrip("itemCount", { count: dayItems.length })}
                  </p>
                </div>
                {canEdit ? (
                  <AddButton
                    label={t("add")}
                    onClick={() => setSheet({ kind: "new", dayId: day.id })}
                  />
                ) : null}
              </div>
              {dayItems.length === 0 && extra.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-hover px-3 py-3 text-[14px] font-medium text-muted">
                  {tTrip("nothingPlanned")}
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {extra.map(({ item, label }) => (
                    <li key={`${item.id}-cont`}>
                      <button
                        type="button"
                        onClick={() => setSheet({ kind: "view", id: item.id })}
                        className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-3 text-left text-[14px] font-medium text-muted hover:bg-hover"
                      >
                        <span aria-hidden="true">{ITEM_TYPE_EMOJI.stay}</span>
                        <span className="truncate">{item.title}</span>
                        <span className="ml-auto shrink-0 text-[12px] text-muted-grey">
                          {label}
                        </span>
                      </button>
                    </li>
                  ))}
                  {dayItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      status={statusOf(item).status}
                      statusLabel={t(`status.${statusOf(item).status}`)}
                      rates={rates}
                      onOpen={() => setSheet({ kind: "view", id: item.id })}
                    />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      <Sheet
        open={sheet.kind !== "closed"}
        onClose={close}
        title={sheetTitle}
        closeLabel={t("cancel")}
      >
        {sheet.kind === "new" ? (
          <ItemForm
            key={`new-${sheet.dayId}`}
            tripId={tripId}
            item={null}
            defaultDayId={sheet.dayId}
            days={dayOptions}
            fallbackCurrency={fallbackCurrency}
            rates={rates}
            dayTitleAt={dayTitleAt}
            onSaved={() => {
              close();
              refresh();
            }}
            onCancel={close}
          />
        ) : null}
        {sheet.kind === "edit" && current ? (
          <ItemForm
            key={`edit-${current.id}`}
            tripId={tripId}
            item={current}
            defaultDayId={current.day_id}
            days={dayOptions}
            fallbackCurrency={fallbackCurrency}
            rates={rates}
            dayTitleAt={dayTitleAt}
            onSaved={(id) => {
              setSheet({ kind: "view", id });
              refresh();
            }}
            onCancel={() => setSheet({ kind: "view", id: current.id })}
          />
        ) : null}
        {sheet.kind === "view" && current ? (
          <ItemDetail
            key={`view-${current.id}-${current.status}`}
            item={current}
            dayIndex={current.day_id ? (dayById.get(current.day_id)?.dayIndex ?? null) : null}
            dayTitleAt={dayTitleAt}
            autoDone={statusOf(current).auto}
            dayLabel={
              current.day_id ? (dayById.get(current.day_id)?.title ?? "") : tTrip("wishlist")
            }
            canEdit={canEdit}
            canContribute={canContribute}
            rates={rates}
            onEdit={() => setSheet({ kind: "edit", id: current.id })}
            onDeleted={() => {
              close();
              refresh();
            }}
            onChanged={refresh}
          />
        ) : null}
      </Sheet>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-sky-300 bg-sky-100 px-3 text-[14px] font-medium text-ink shadow-active hover:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <span aria-hidden="true">+</span> {label}
    </button>
  );
}

function ItemRow({
  item,
  status,
  statusLabel,
  rates,
  onOpen,
}: {
  item: Item;
  status: ItemStatus;
  statusLabel: string;
  rates: IdrRates;
  onOpen: () => void;
}) {
  const locale = useLocale();
  const start = shortTime(item.start_time);
  const end = shortTime(item.end_time);
  // Rupiah first: it's what the group budgets in; the local price stays for paying on the spot.
  let cost: string | null = null;
  if (item.cost_amount != null && item.cost_currency) {
    const local = formatMoney(Number(item.cost_amount), item.cost_currency, locale);
    const idr = toIdr(Number(item.cost_amount), item.cost_currency, rates);
    cost = idr !== null && item.cost_currency !== "IDR" ? `≈ ${formatIdr(idr)} (${local})` : local;
  }
  const meta = [
    start ? (end ? `${start}–${end}` : start) : null,
    typeof item.details.location === "string" ? item.details.location : null,
    cost,
  ].filter(Boolean);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-white p-2.5 text-left transition-colors duration-300 ease-out-soft hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <IconTile>{ITEM_TYPE_EMOJI[item.type]}</IconTile>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-medium tracking-[-0.01em] text-ink">
            {item.title}
          </span>
          {meta.length > 0 ? (
            <span className="truncate text-[13px] font-medium text-muted-grey">
              {meta.join(" · ")}
            </span>
          ) : null}
        </span>
        <Chip tone={STATUS_TONE[status]} className="shrink-0">
          {statusLabel}
        </Chip>
      </button>
    </li>
  );
}
