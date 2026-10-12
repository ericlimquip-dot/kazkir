"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition, type ReactNode } from "react";
import { deleteItem, setItemStatus } from "@/app/trips/[tripId]/item-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatIdr, formatMoney, toIdr } from "@/lib/money/format";
import type { IdrRates } from "@/lib/money/rates";
import { formatDate } from "@/lib/trips/dates";
import { whenRows, type WhenRow } from "@/lib/trips/when";
import { zoneParts } from "@/lib/trips/zones";
import { ITEM_STATUSES, ITEM_TYPE_EMOJI, type Item, type ItemStatus } from "@/lib/trips/types";
import { Vouchers } from "./vouchers";

/** wa.me only accepts digits with the country code. */
function whatsappLink(contact: string): string | null {
  const digits = contact.replace(/[^\d+]/g, "");
  if (!digits.startsWith("+") || digits.length < 8) return null;
  return `https://wa.me/${digits.slice(1)}`;
}

export function ItemDetail({
  item,
  dayLabel,
  dayIndex,
  dayTitleAt,
  autoDone,
  canEdit,
  canContribute,
  rates,
  onEdit,
  onDeleted,
  onChanged,
}: {
  item: Item;
  dayLabel: string;
  dayIndex: number | null;
  dayTitleAt: (n: number) => string;
  autoDone: boolean;
  canEdit: boolean;
  canContribute: boolean;
  rates: IdrRates;
  onEdit: () => void;
  onDeleted: () => void;
  onChanged: () => void;
}) {
  const t = useTranslations("Item");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<ItemStatus>(autoDone ? "done" : item.status);
  const [error, setError] = useState<string | null>(null);
  const d = item.details as Record<
    string,
    string | number | { time?: string; name: string }[] | undefined
  >;
  const text = (key: string) =>
    typeof d[key] === "string" || typeof d[key] === "number" ? String(d[key]) : undefined;

  const changeStatus = (next: ItemStatus) => {
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      const res = await setItemStatus(item.trip_id, item.id, next);
      if (!res.ok) {
        setStatus(previous);
        setError(t(`errors.${res.error}`));
      } else onChanged();
    });
  };

  const remove = () => {
    if (!window.confirm(t("confirmDelete", { title: item.title }))) return;
    startTransition(async () => {
      const res = await deleteItem(item.trip_id, item.id);
      if (res.ok) onDeleted();
      else setError(t(`errors.${res.error}`));
    });
  };

  const contact = text("contact");
  const wa = contact ? whatsappLink(contact) : null;
  const stops = Array.isArray(d.stops) ? d.stops : [];

  const rows: [string, ReactNode][] = [];
  const add = (label: string, value: ReactNode | undefined) => {
    if (value !== undefined && value !== "") rows.push([label, value]);
  };
  // Every time comes with its date and the place it's local to:
  // "Day 2 · Sun, 2 May · 12:00 Almaty time (GMT+5)".
  const zoneText = (tz: string) => {
    const { name, offset, indonesian } = zoneParts(tz);
    return t(indonesian ? "zoneIndonesian" : "zone", { name, offset });
  };
  const moment = (m: WhenRow, time = m.time) =>
    `${dayTitleAt(m.dayIndex)}${time ? ` · ${time}${m.timezone ? ` ${zoneText(m.timezone)}` : ""}` : ""}`;
  const moments = whenRows(item, dayIndex);
  if (moments.length === 0) add(t("fields.day"), dayLabel);
  for (const m of moments) {
    add(t(`when.${m.kind}`), moment(m));
  }
  const lastMoment = moments.at(-1);
  add(t("fields.location"), text("location"));
  if (item.type === "flight") {
    const route = [text("fromAirport"), text("toAirport")].filter(Boolean).join(" → ");
    add(t("fields.fromAirport"), route || undefined);
    add(t("fields.flightNumber"), text("flightNumber"));
    add(t("fields.departTerminal"), text("departTerminal"));
    add(t("fields.arriveTerminal"), text("arriveTerminal"));
  }
  if (item.type === "stay") {
    add(t("fields.nights"), text("nights"));
  }
  if (item.type === "tour") {
    add(t("fields.operator"), text("operator"));
    add(t("fields.pickupPlace"), text("pickupPlace"));
    add(t("fields.inclusions"), text("inclusions"));
    add(t("fields.cancelBy"), text("cancelBy") && formatDate(text("cancelBy")!, locale));
  }
  if (item.type === "transport") {
    const mode = text("mode");
    add(t("fields.mode"), mode ? t(`fields.modes.${mode}`) : undefined);
    add(t("fields.from"), [text("from"), text("to")].filter(Boolean).join(" → ") || undefined);
  }
  add(t("fields.bookingCode"), text("bookingCode"));
  if (contact) {
    add(
      t("fields.contact"),
      <span className="flex flex-wrap items-center gap-2">
        <a href={`tel:${contact.replace(/[^\d+]/g, "")}`} className="text-muted-teal underline">
          {contact}
        </a>
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[#e7f8ee] px-2 py-0.5 text-[13px] text-[#1c7c45]"
          >
            {t("whatsapp")}
          </a>
        ) : null}
      </span>,
    );
  }
  if (item.cost_amount != null && item.cost_currency) {
    const idr = toIdr(Number(item.cost_amount), item.cost_currency, rates);
    add(
      t("fields.cost"),
      `${formatMoney(Number(item.cost_amount), item.cost_currency, locale)}${idr !== null && item.cost_currency !== "IDR" ? ` (≈ ${formatIdr(idr)})` : ""} · ${
        item.cost_basis === "shared" ? t("fields.costShared") : t("fields.costBasis")
      }`,
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-[14px] font-medium text-muted">
        <span aria-hidden="true" className="text-[20px]">
          {ITEM_TYPE_EMOJI[item.type]}
        </span>
        {t(`types.${item.type}`)}
      </div>

      {autoDone && lastMoment ? (
        <p className="rounded-2xl bg-[#ecf8ef] px-3 py-2 text-[13px] font-medium text-[#2f6b3f]">
          {t("autoDone", {
            when: moment(lastMoment, lastMoment.time?.split("–").pop()),
          })}
        </p>
      ) : null}

      <div
        role="radiogroup"
        aria-label={t("fields.status")}
        className="flex flex-wrap gap-1 rounded-2xl bg-hover p-1"
      >
        {ITEM_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={status === s}
            disabled={!canEdit || pending}
            onClick={() => changeStatus(s)}
            className={cn(
              "min-h-10 flex-1 rounded-xl border px-2 text-[13px] font-medium disabled:cursor-default",
              status === s
                ? "border-sky-300 bg-sky-100 text-ink shadow-active"
                : "border-transparent text-muted-grey",
              canEdit && "cursor-pointer",
            )}
          >
            {t(`status.${s}`)}
          </button>
        ))}
      </div>

      {rows.length > 0 ? (
        <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-2.5 text-[14px]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-medium text-muted-grey">{label}</dt>
              <dd className="font-medium text-ink [overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {stops.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-[13px] font-medium text-muted">{t("fields.stops")}</h3>
          <ol className="flex flex-col gap-1.5 border-l-2 border-sky-300 pl-4">
            {stops.map((stop, i) => (
              <li key={i} className="text-[14px] font-medium text-ink">
                {stop.time ? <span className="mr-2 text-muted-grey">{stop.time}</span> : null}
                {stop.name}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {item.notes ? (
        <p className="whitespace-pre-wrap rounded-2xl bg-hover p-3 text-[14px] font-medium text-ink">
          {item.notes}
        </p>
      ) : null}

      {item.type !== "note" ? (
        <Vouchers
          tripId={item.trip_id}
          itemId={item.id}
          canUpload={canContribute}
          canManageAll={canEdit}
        />
      ) : null}

      {error ? (
        <p role="alert" className="text-[13px] font-medium text-[#a23b2a]">
          {error}
        </p>
      ) : null}

      {canEdit ? (
        <div className="flex gap-2 border-t border-line pt-4">
          <Button className="flex-1" onClick={onEdit}>
            {t("edit")}
          </Button>
          <Button variant="ghost" onClick={remove} disabled={pending} className="text-[#a23b2a]">
            {pending ? t("deleting") : t("delete")}
          </Button>
        </div>
      ) : (
        <p className="text-[13px] font-medium text-muted-grey">{t("readOnly")}</p>
      )}
    </div>
  );
}
