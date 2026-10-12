"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { updateTripDates, type UpdateDatesResult } from "@/app/trips/actions";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";
import { daysBetween, endDateOf } from "@/lib/trips/dates";
import type { TripStage } from "@/lib/trips/types";
import { INPUT } from "./item-form";

/**
 * The "Almaty → Bishkek · 5 days · no dates yet" line under the trip name. Owners and
 * editors can tap to set dates, change them, or change the length of an undated trip.
 */
export function TripDates({
  tripId,
  summary,
  startDate,
  dayCount,
  stage,
  canEdit,
}: {
  tripId: string;
  summary: string;
  startDate: string | null;
  dayCount: number;
  stage: TripStage;
  canEdit: boolean;
}) {
  const t = useTranslations("Trip");
  const tNew = useTranslations("NewTrip");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Undated trips open on "I know the dates": that's usually why you tapped.
  const [hasDates, setHasDates] = useState(true);
  const [start, setStart] = useState(startDate ?? "");
  const [end, setEnd] = useState(startDate ? endDateOf(startDate, dayCount) : "");
  const [count, setCount] = useState(String(dayCount));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const startId = useId();
  const endId = useId();
  const countId = useId();

  const openEditor = () => {
    setHasDates(true);
    setStart(startDate ?? "");
    setEnd(startDate ? endDateOf(startDate, dayCount) : "");
    setCount(String(dayCount));
    setError(null);
    setOpen(true);
  };

  // Picking a first day on an undated trip keeps its length: 5 days stays 5 days.
  const onStart = (value: string) => {
    setStart(value);
    if (value && (!end || end < value)) setEnd(endDateOf(value, dayCount));
  };

  const newCount = hasDates
    ? start && end && end >= start
      ? daysBetween(start, end)
      : null
    : Number.parseInt(count, 10) || null;
  const removedFrom = newCount !== null && newCount < dayCount ? newCount + 1 : null;

  const save = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const res: UpdateDatesResult = await updateTripDates(
        tripId,
        hasDates ? { startDate: start, endDate: end } : { dayCount: Number.parseInt(count, 10) },
      );
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error === "forbidden" ? t("renameForbidden") : tNew(`errors.${res.error}`));
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-[14px] font-medium text-muted">{summary}</p>
        {canEdit ? (
          <button
            type="button"
            onClick={openEditor}
            className="min-h-9 cursor-pointer rounded-lg px-2 text-[14px] font-medium text-muted-teal underline-offset-2 hover:bg-hover hover:underline focus-visible:outline-2 focus-visible:outline-ink"
          >
            {startDate ? t("changeDates") : t("setDates")}
          </button>
        ) : null}
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("datesTitle")}
        closeLabel={t("cancel")}
      >
        <form onSubmit={save} className="flex flex-col gap-4" noValidate>
          <div role="radiogroup" className="inline-flex gap-1 self-start rounded-2xl bg-hover p-1">
            {[
              { value: true, label: tNew("knowDates") },
              { value: false, label: tNew("notYet") },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                role="radio"
                aria-checked={hasDates === opt.value}
                onClick={() => setHasDates(opt.value)}
                className={cn(
                  "min-h-10 cursor-pointer rounded-xl border px-4 text-[14px] font-medium",
                  hasDates === opt.value
                    ? "border-sky-300 bg-sky-100 text-ink shadow-active"
                    : "border-transparent text-muted-grey",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {hasDates ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={startId} className="text-[13px] font-medium text-muted">
                  {tNew("startDate")}
                </label>
                <input
                  id={startId}
                  type="date"
                  className={INPUT}
                  value={start}
                  onChange={(e) => onStart(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={endId} className="text-[13px] font-medium text-muted">
                  {tNew("endDate")}
                </label>
                <input
                  id={endId}
                  type="date"
                  className={INPUT}
                  value={end}
                  min={start || undefined}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
              {newCount !== null ? (
                <p className="col-span-2 text-[13px] font-medium text-muted-teal">
                  {t("dayTotal", { count: newCount })}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={countId} className="text-[13px] font-medium text-muted">
                {tNew("dayCount")}
              </label>
              <input
                id={countId}
                type="number"
                inputMode="numeric"
                min={1}
                max={90}
                className={cn(INPUT, "w-28")}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
          )}

          {removedFrom !== null ? (
            <p
              role="status"
              className="rounded-xl border border-[#f3dca8] bg-[#fff6e3] px-3 py-2 text-[13px] font-medium text-[#7a5a14]"
            >
              {removedFrom === dayCount
                ? t("shrinkWarningOne", { day: dayCount })
                : t("shrinkWarning", { from: removedFrom, to: dayCount })}
            </p>
          ) : null}
          {hasDates && stage === "idea" ? (
            <p className="text-[13px] font-medium text-muted-grey">{t("stageNote")}</p>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-[#f1c9c1] bg-[#fdf1ee] px-3 py-2 text-[14px] font-medium text-[#a23b2a]"
            >
              {error}
            </p>
          ) : null}

          <div className="flex gap-2 border-t border-line pt-4">
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? t("saving") : t("save")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
