"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { currencyName, formatIdr, parseAmount, toIdr } from "@/lib/money/format";
import type { IdrRates } from "@/lib/money/rates";

export type CostBasis = "per_person" | "shared";

/**
 * Estimated cost: currency + amount in one box, with the Rupiah equivalent underneath.
 * The currency defaults to the local money of the day's city, because that's what prices
 * on the ground are in; Rupiah is always one tap away.
 */
export function CostField({
  amount,
  currency,
  basis,
  currencies,
  localCurrency,
  rates,
  invalid,
  onChange,
}: {
  amount: string;
  currency: string;
  basis: CostBasis;
  currencies: string[];
  localCurrency: string | null;
  rates: IdrRates;
  invalid: boolean;
  onChange: (patch: { costAmount?: string; costCurrency?: string; costBasis?: CostBasis }) => void;
}) {
  const t = useTranslations("Item.fields");
  const locale = useLocale();
  const amountId = useId();
  const hintId = useId();

  const parsed = parseAmount(amount);
  const idr = parsed !== null && parsed > 0 ? toIdr(parsed, currency, rates) : null;
  const options = currencies.includes(currency) ? currencies : [currency, ...currencies];

  let hint: string;
  if (idr !== null && currency !== "IDR") {
    hint =
      basis === "shared"
        ? t("approxShared", { amount: formatIdr(idr) })
        : t("approxPerPerson", { amount: formatIdr(idr) });
  } else if (currency === localCurrency && currency !== "IDR") {
    hint = t("localCurrencyHint", { currency: currencyName(currency, locale) });
  } else {
    hint = currencyName(currency, locale);
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-[13px] font-medium text-muted">
        <label htmlFor={amountId}>{t("cost")}</label>
      </legend>
      <div
        className={cn(
          "flex min-h-12 items-stretch overflow-hidden rounded-xl border border-line bg-white focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100",
          invalid && "border-[#e3a091]",
        )}
      >
        <select
          aria-label={t("currency")}
          value={currency}
          onChange={(e) => onChange({ costCurrency: e.target.value })}
          className="shrink-0 cursor-pointer border-r border-line bg-hover px-3 text-[15px] font-medium text-ink outline-none"
        >
          {options.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <input
          id={amountId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          aria-describedby={hintId}
          value={amount}
          onChange={(e) => onChange({ costAmount: e.target.value.replace(/[^\d.,\s]/g, "") })}
          className="min-w-0 flex-1 bg-transparent px-3 text-[17px] font-medium tabular-nums text-ink outline-none"
        />
      </div>
      <p
        id={hintId}
        aria-live="polite"
        className={cn(
          "text-[13px] font-medium",
          idr !== null ? "text-muted-teal" : "text-muted-grey",
        )}
      >
        {hint}
      </p>
      <div
        role="radiogroup"
        aria-label={t("cost")}
        className="inline-flex gap-1 self-start rounded-xl bg-hover p-1"
      >
        {(["per_person", "shared"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={basis === value}
            onClick={() => onChange({ costBasis: value })}
            className={cn(
              "min-h-9 cursor-pointer rounded-lg border px-3 text-[13px] font-medium",
              basis === value
                ? "border-sky-300 bg-sky-100 text-ink"
                : "border-transparent text-muted-grey",
            )}
          >
            {value === "per_person" ? t("costBasis") : t("costShared")}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
