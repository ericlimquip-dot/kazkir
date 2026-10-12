"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { LOCALES, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

const SHORT: Record<Locale, string> = { en: "EN", id: "ID" };

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn("inline-flex gap-1 rounded-xl border border-line bg-white p-1", className)}
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            aria-label={code === "en" ? t("english") : t("indonesian")}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await setLocale(code);
                router.refresh();
              })
            }
            className={cn(
              "min-h-9 min-w-11 cursor-pointer rounded-lg px-2 text-[13px] font-medium tracking-[-0.01em]",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink",
              active
                ? "border border-sky-300 bg-sky-100 text-ink"
                : "border border-transparent text-muted-grey hover:bg-hover",
            )}
          >
            {SHORT[code]}
          </button>
        );
      })}
    </div>
  );
}
