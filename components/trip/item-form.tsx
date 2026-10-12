"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { saveItem } from "@/app/trips/[tripId]/item-actions";
import { Button } from "@/components/ui/button";
import { COMMON_CURRENCIES, parseAmount } from "@/lib/money/format";
import type { IdrRates } from "@/lib/money/rates";
import { CostField } from "./cost-field";
import { cn } from "@/lib/cn";
import { MAX_TOUR_STOPS, TRANSPORT_MODES } from "@/lib/trips/item-schema";
import {
  ITEM_STATUSES,
  ITEM_TYPE_EMOJI,
  ITEM_TYPES,
  type Item,
  type ItemStatus,
  type ItemType,
} from "@/lib/trips/types";

export const INPUT =
  "min-h-11 w-full rounded-xl border border-line bg-white px-3 text-[16px] text-ink outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100";

export type DayOption = { id: string; label: string; currency: string | null };

type Stop = { key: number; time: string; name: string; note: string };

type Draft = {
  type: ItemType;
  title: string;
  dayId: string; // "" = wishlist
  status: ItemStatus;
  startTime: string;
  endTime: string;
  location: string;
  costAmount: string;
  costCurrency: string;
  costBasis: "per_person" | "shared";
  notes: string;
  details: Record<string, string>;
  stops: Stop[];
};

function draftFrom(
  item: Item | null,
  type: ItemType,
  dayId: string | null,
  currency: string,
): Draft {
  const d = (item?.details ?? {}) as Record<string, unknown>;
  const stops = Array.isArray(d.stops)
    ? (d.stops as { time?: string; name: string; note?: string }[])
    : [];
  const details: Record<string, string> = {};
  for (const [k, v] of Object.entries(d))
    if (k !== "stops" && k !== "location" && v != null) details[k] = String(v);
  return {
    type: item?.type ?? type,
    title: item?.title ?? "",
    dayId: (item ? item.day_id : dayId) ?? "",
    status: item?.status ?? (type === "note" ? "idea" : "planned"),
    startTime: item?.start_time?.slice(0, 5) ?? "",
    endTime: item?.end_time?.slice(0, 5) ?? "",
    location: typeof d.location === "string" ? d.location : "",
    costAmount: item?.cost_amount != null ? String(item.cost_amount) : "",
    costCurrency: item?.cost_currency ?? currency,
    costBasis: item?.cost_basis ?? "per_person",
    notes: item?.notes ?? "",
    details,
    stops: stops.map((s, i) => ({ key: i, time: s.time ?? "", name: s.name, note: s.note ?? "" })),
  };
}

/** New items start with a type picker; existing items open straight into their fields. */
export function ItemForm({
  tripId,
  item,
  defaultDayId,
  days,
  fallbackCurrency,
  rates,
  onSaved,
  onCancel,
}: {
  tripId: string;
  item: Item | null;
  defaultDayId: string | null;
  days: DayOption[];
  fallbackCurrency: string;
  rates: IdrRates;
  onSaved: (id: string) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("Item");
  const currencyFor = (dayId: string | null) =>
    days.find((d) => d.id === dayId)?.currency ?? fallbackCurrency;
  const currencyOptions = [
    ...new Set([
      ...days.map((d) => d.currency).filter((c): c is string => !!c),
      ...COMMON_CURRENCIES,
    ]),
  ];
  const [draft, setDraft] = useState<Draft | null>(
    item ? draftFrom(item, item.type, item.day_id, currencyFor(item.day_id)) : null,
  );
  const [error, setError] = useState<{ message: string; fields: string[] } | null>(null);
  const [pending, startTransition] = useTransition();

  if (!draft) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[15px] font-medium text-ink">{t("chooseType")}</p>
        <div className="grid grid-cols-2 gap-2 iphone:grid-cols-3">
          {ITEM_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                setDraft(draftFrom(null, type, defaultDayId, currencyFor(defaultDayId)))
              }
              className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-white text-[14px] font-medium text-ink hover:border-sky-300 hover:bg-sky-100/40 focus-visible:outline-2 focus-visible:outline-ink"
            >
              <span aria-hidden="true" className="text-[24px]">
                {ITEM_TYPE_EMOJI[type]}
              </span>
              {t(`types.${type}`)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const setDetail = (key: string, value: string) =>
    set({ details: { ...draft.details, [key]: value } });
  const bad = (field: string) =>
    error?.fields.some((f) => f === field || f.startsWith(`${field}.`)) ?? false;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const details: Record<string, unknown> = { ...draft.details };
    if (draft.type === "tour") {
      details.stops = draft.stops
        .filter((s) => s.name.trim())
        .map(({ time, name, note }) => ({ time, name, note }));
    }
    startTransition(async () => {
      const result = await saveItem({
        id: item?.id,
        tripId,
        dayId: draft.dayId || null,
        type: draft.type,
        title: draft.title,
        status: draft.status,
        startTime: draft.startTime,
        endTime: draft.endTime,
        location: draft.location,
        // "25.000" means twenty-five thousand here; send a plain number (or the raw text so
        // validation can flag it).
        costAmount: draft.costAmount.trim()
          ? (parseAmount(draft.costAmount) ?? draft.costAmount)
          : "",
        costCurrency: draft.costAmount.trim() ? draft.costCurrency : "",
        costBasis: draft.costBasis,
        notes: draft.notes,
        details,
      });
      if (result.ok) onSaved(result.id);
      else setError({ message: t(`errors.${result.error}`), fields: result.fields ?? [] });
    });
  };

  const type = draft.type;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex items-center gap-2 text-[14px] font-medium text-muted">
        <span aria-hidden="true" className="text-[20px]">
          {ITEM_TYPE_EMOJI[type]}
        </span>
        {t(`types.${type}`)}
      </div>

      <Field label={t("fields.title")} invalid={bad("title")}>
        {(id) => (
          <input
            id={id}
            className={INPUT}
            value={draft.title}
            maxLength={200}
            required
            autoFocus={!item}
            placeholder={t(`fields.titlePlaceholder.${type}`)}
            onChange={(e) => set({ title: e.target.value })}
          />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("fields.day")}>
          {(id) => (
            <select
              id={id}
              className={INPUT}
              value={draft.dayId}
              onChange={(e) =>
                set({
                  dayId: e.target.value,
                  ...(draft.costAmount
                    ? {}
                    : { costCurrency: currencyFor(e.target.value || null) }),
                })
              }
            >
              <option value="">{t("fields.wishlist")}</option>
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label={t("fields.status")}>
          {(id) => (
            <select
              id={id}
              className={INPUT}
              value={draft.status}
              onChange={(e) => set({ status: e.target.value as ItemStatus })}
            >
              {ITEM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      {type !== "note" && type !== "stay" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("fields.startTime")} invalid={bad("startTime")}>
            {(id) => (
              <input
                id={id}
                type="time"
                className={INPUT}
                value={draft.startTime}
                onChange={(e) => set({ startTime: e.target.value })}
              />
            )}
          </Field>
          <Field label={t("fields.endTime")} invalid={bad("endTime")}>
            {(id) => (
              <input
                id={id}
                type="time"
                className={INPUT}
                value={draft.endTime}
                onChange={(e) => set({ endTime: e.target.value })}
              />
            )}
          </Field>
        </div>
      ) : null}

      {type === "flight" ? (
        <div className="grid grid-cols-2 gap-3">
          <DetailInput
            label={t("fields.fromAirport")}
            name="fromAirport"
            draft={draft}
            setDetail={setDetail}
            placeholder="CGK"
          />
          <DetailInput
            label={t("fields.toAirport")}
            name="toAirport"
            draft={draft}
            setDetail={setDetail}
            placeholder="ALA"
          />
          <DetailInput
            label={t("fields.flightNumber")}
            name="flightNumber"
            draft={draft}
            setDetail={setDetail}
            placeholder="KC 932"
          />
          <DetailInput
            label={t("fields.bookingCode")}
            name="bookingCode"
            draft={draft}
            setDetail={setDetail}
          />
          <DetailInput
            label={t("fields.departTerminal")}
            name="departTerminal"
            draft={draft}
            setDetail={setDetail}
          />
          <DetailInput
            label={t("fields.arriveTerminal")}
            name="arriveTerminal"
            draft={draft}
            setDetail={setDetail}
          />
        </div>
      ) : null}

      {type === "stay" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("fields.nights")} invalid={bad("details.nights")}>
            {(id) => (
              <input
                id={id}
                type="number"
                inputMode="numeric"
                min={1}
                max={90}
                className={INPUT}
                value={draft.details.nights ?? "1"}
                onChange={(e) => setDetail("nights", e.target.value)}
              />
            )}
          </Field>
          <DetailInput
            label={t("fields.bookingCode")}
            name="bookingCode"
            draft={draft}
            setDetail={setDetail}
          />
          <DetailInput
            label={t("fields.checkInTime")}
            name="checkInTime"
            draft={draft}
            setDetail={setDetail}
            type="time"
          />
          <DetailInput
            label={t("fields.checkOutTime")}
            name="checkOutTime"
            draft={draft}
            setDetail={setDetail}
            type="time"
          />
          <div className="col-span-2">
            <DetailInput
              label={t("fields.contact")}
              name="contact"
              draft={draft}
              setDetail={setDetail}
              type="tel"
            />
          </div>
        </div>
      ) : null}

      {type === "tour" ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <DetailInput
              label={t("fields.operator")}
              name="operator"
              draft={draft}
              setDetail={setDetail}
            />
            <DetailInput
              label={t("fields.contact")}
              name="contact"
              draft={draft}
              setDetail={setDetail}
              type="tel"
            />
            <DetailInput
              label={t("fields.pickupTime")}
              name="pickupTime"
              draft={draft}
              setDetail={setDetail}
              type="time"
            />
            <DetailInput
              label={t("fields.cancelBy")}
              name="cancelBy"
              draft={draft}
              setDetail={setDetail}
              type="date"
            />
          </div>
          <DetailInput
            label={t("fields.pickupPlace")}
            name="pickupPlace"
            draft={draft}
            setDetail={setDetail}
          />
          <Field label={t("fields.inclusions")}>
            {(id) => (
              <textarea
                id={id}
                rows={2}
                maxLength={600}
                className={cn(INPUT, "py-2")}
                value={draft.details.inclusions ?? ""}
                onChange={(e) => setDetail("inclusions", e.target.value)}
              />
            )}
          </Field>
          <StopsEditor
            stops={draft.stops}
            onChange={(stops) => set({ stops })}
            invalid={bad("details.stops")}
          />
        </div>
      ) : null}

      {type === "transport" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("fields.mode")}>
            {(id) => (
              <select
                id={id}
                className={INPUT}
                value={draft.details.mode ?? "other"}
                onChange={(e) => setDetail("mode", e.target.value)}
              >
                {TRANSPORT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {t(`fields.modes.${m}`)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <DetailInput
            label={t("fields.bookingCode")}
            name="bookingCode"
            draft={draft}
            setDetail={setDetail}
          />
          <DetailInput label={t("fields.from")} name="from" draft={draft} setDetail={setDetail} />
          <DetailInput label={t("fields.to")} name="to" draft={draft} setDetail={setDetail} />
        </div>
      ) : null}

      {type !== "note" ? (
        <Field label={t("fields.location")}>
          {(id) => (
            <input
              id={id}
              className={INPUT}
              value={draft.location}
              maxLength={200}
              placeholder={t("fields.locationPlaceholder")}
              onChange={(e) => set({ location: e.target.value })}
            />
          )}
        </Field>
      ) : null}

      {type !== "note" ? (
        <CostField
          amount={draft.costAmount}
          currency={draft.costCurrency}
          basis={draft.costBasis}
          currencies={currencyOptions}
          localCurrency={days.find((d) => d.id === draft.dayId)?.currency ?? null}
          rates={rates}
          invalid={bad("costAmount") || bad("costCurrency")}
          onChange={(patch) => set(patch)}
        />
      ) : null}

      <Field label={t("fields.notes")}>
        {(id) => (
          <textarea
            id={id}
            rows={3}
            maxLength={2000}
            className={cn(INPUT, "py-2")}
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        )}
      </Field>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-[#f1c9c1] bg-[#fdf1ee] px-3 py-2 text-[14px] font-medium text-[#a23b2a]"
        >
          {error.message}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-line bg-white px-5 py-3">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? t("saving") : t("save")}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

function StopsEditor({
  stops,
  onChange,
  invalid,
}: {
  stops: Stop[];
  onChange: (s: Stop[]) => void;
  invalid: boolean;
}) {
  const t = useTranslations("Item.fields");
  const update = (key: number, patch: Partial<Stop>) =>
    onChange(stops.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  return (
    <fieldset className="flex flex-col gap-2">
      <legend
        className={cn("mb-1.5 text-[13px] font-medium", invalid ? "text-[#a23b2a]" : "text-muted")}
      >
        {t("stops")}
      </legend>
      <ol className="flex flex-col gap-2">
        {stops.map((stop, i) => (
          <li key={stop.key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 min-w-7 items-center justify-center rounded-full bg-sky-100 text-[12px] font-medium text-muted-teal"
            >
              {i + 1}
            </span>
            <input
              aria-label={t("stopTime")}
              type="time"
              className={cn(INPUT, "w-24 shrink-0 px-2")}
              value={stop.time}
              onChange={(e) => update(stop.key, { time: e.target.value })}
            />
            <input
              aria-label={t("stopName")}
              className={cn(INPUT, "min-w-0 flex-1")}
              value={stop.name}
              maxLength={120}
              onChange={(e) => update(stop.key, { name: e.target.value })}
            />
            <button
              type="button"
              aria-label={t("removeStop")}
              onClick={() => onChange(stops.filter((s) => s.key !== stop.key))}
              className="flex size-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-hover"
            >
              ×
            </button>
          </li>
        ))}
      </ol>
      {stops.length < MAX_TOUR_STOPS ? (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() =>
            onChange([
              ...stops,
              { key: Math.max(-1, ...stops.map((s) => s.key)) + 1, time: "", name: "", note: "" },
            ])
          }
        >
          + {t("addStop")}
        </Button>
      ) : null}
    </fieldset>
  );
}

function DetailInput({
  label,
  name,
  draft,
  setDetail,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  draft: Draft;
  setDetail: (key: string, value: string) => void;
  type?: "text" | "time" | "date" | "tel";
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <input
          id={id}
          type={type}
          className={INPUT}
          value={draft.details[name] ?? ""}
          placeholder={placeholder}
          maxLength={type === "text" || type === "tel" ? 160 : undefined}
          onChange={(e) => setDetail(name, e.target.value)}
        />
      )}
    </Field>
  );
}

function Field({
  label,
  invalid = false,
  children,
}: {
  label: string;
  invalid?: boolean;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1.5",
        invalid && "[&_input]:border-[#e3a091] [&_select]:border-[#e3a091]",
      )}
    >
      <label
        htmlFor={id}
        className={cn("text-[13px] font-medium", invalid ? "text-[#a23b2a]" : "text-muted")}
      >
        {label}
      </label>
      {children(id)}
    </div>
  );
}
