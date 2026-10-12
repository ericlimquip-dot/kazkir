"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { CountryOption } from "@/lib/geo/countries";
import { cn } from "@/lib/cn";
import { createTrip, type CreateTripState } from "../actions";

type CityDraft = { key: number; name: string; countryCode: string; timezone: string };

const INPUT =
  "min-h-11 w-full rounded-xl border border-line bg-white px-3 text-[16px] text-ink outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100";

export function NewTripForm({ countries }: { countries: CountryOption[] }) {
  const t = useTranslations("NewTrip");
  const [title, setTitle] = useState("");
  const [cities, setCities] = useState<CityDraft[]>([
    { key: 0, name: "", countryCode: "", timezone: "" },
  ]);
  const [hasDates, setHasDates] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dayCount, setDayCount] = useState("5");
  const [state, setState] = useState<CreateTripState>({});
  const [pending, startTransition] = useTransition();

  const byCode = new Map(countries.map((c) => [c.code, c]));

  const updateCity = (key: number, patch: Partial<CityDraft>) =>
    setCities((list) => list.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await createTrip({
        title,
        cities: cities.map(({ name, countryCode, timezone }) => ({ name, countryCode, timezone })),
        ...(hasDates ? { startDate, endDate } : { dayCount: Number(dayCount) }),
      });
      // On success the action redirects, so we only get here on errors.
      setState(result);
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      <Field label={t("name")}>
        {(id) => (
          <input
            id={id}
            className={INPUT}
            value={title}
            maxLength={120}
            required
            placeholder={t("namePlaceholder")}
            onChange={(e) => setTitle(e.target.value)}
          />
        )}
      </Field>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-[15px] font-medium text-ink">{t("destinations")}</legend>
        <p className="-mt-1 text-[13px] font-medium text-muted-grey">{t("destinationsHint")}</p>
        {cities.map((city, index) => {
          const country = byCode.get(city.countryCode);
          return (
            <div
              key={city.key}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-3"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[13px] font-medium text-muted-teal">
                  {index + 1}
                </span>
                <input
                  aria-label={t("city")}
                  className={INPUT}
                  value={city.name}
                  maxLength={80}
                  placeholder={t("cityPlaceholder")}
                  onChange={(e) => updateCity(city.key, { name: e.target.value })}
                />
                {cities.length > 1 ? (
                  <button
                    type="button"
                    aria-label={t("removeCity", { city: city.name || String(index + 1) })}
                    onClick={() => setCities((list) => list.filter((c) => c.key !== city.key))}
                    className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-hover"
                  >
                    ×
                  </button>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 ipad:flex-row">
                <select
                  aria-label={t("country")}
                  className={cn(INPUT, "ipad:flex-1")}
                  value={city.countryCode}
                  onChange={(e) => {
                    const next = byCode.get(e.target.value);
                    updateCity(city.key, {
                      countryCode: e.target.value,
                      timezone: next?.timezones[0] ?? "",
                    });
                  }}
                >
                  <option value="">{t("chooseCountry")}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {country && country.timezones.length > 1 ? (
                  <select
                    aria-label={t("timezone")}
                    className={cn(INPUT, "ipad:flex-1")}
                    value={city.timezone}
                    onChange={(e) => updateCity(city.key, { timezone: e.target.value })}
                  >
                    {country.timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>
          );
        })}
        {cities.length < 12 ? (
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() =>
              setCities((list) => [
                ...list,
                {
                  key: Math.max(...list.map((c) => c.key)) + 1,
                  name: "",
                  countryCode: list.at(-1)?.countryCode ?? "",
                  timezone: list.at(-1)?.timezone ?? "",
                },
              ])
            }
          >
            + {t("addCity")}
          </Button>
        ) : null}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-[15px] font-medium text-ink">{t("when")}</legend>
        <div role="radiogroup" className="inline-flex gap-1 self-start rounded-2xl bg-hover p-1">
          {[
            { value: false, label: t("notYet") },
            { value: true, label: t("knowDates") },
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
            <Field label={t("startDate")}>
              {(id) => (
                <input
                  id={id}
                  type="date"
                  className={INPUT}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              )}
            </Field>
            <Field label={t("endDate")}>
              {(id) => (
                <input
                  id={id}
                  type="date"
                  className={INPUT}
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              )}
            </Field>
          </div>
        ) : (
          <Field label={t("dayCount")}>
            {(id) => (
              <input
                id={id}
                type="number"
                inputMode="numeric"
                min={1}
                max={90}
                className={cn(INPUT, "w-28")}
                value={dayCount}
                onChange={(e) => setDayCount(e.target.value)}
              />
            )}
          </Field>
        )}
      </fieldset>

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-[#f1c9c1] bg-[#fdf1ee] px-3 py-2 text-[14px] font-medium text-[#a23b2a]"
        >
          {t(`errors.${state.error}`)}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full ipad:w-auto ipad:self-start">
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-muted">
        {label}
      </label>
      {children(id)}
    </div>
  );
}
