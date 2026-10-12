import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { listCountries } from "@/lib/geo/countries";
import { NewTripForm } from "./new-trip-form";

export default async function NewTripPage() {
  const t = await getTranslations("NewTrip");
  const countries = listCountries(await getLocale());

  return (
    <main className="min-h-dvh bg-surface-warm px-4 py-8 ipad:px-10">
      <div className="mx-auto flex max-w-160 flex-col gap-5">
        <Link
          href="/trips"
          className="self-start text-[14px] font-medium text-muted-teal hover:underline"
        >
          ← {t("back")}
        </Link>
        <h1 className="animate-section-rise text-[clamp(1.75rem,4vw,2.25rem)] font-medium leading-[1.12] tracking-[-0.04em] text-ink-strong motion-reduce:animate-none">
          {t("title")}
        </h1>
        <Card className="animate-section-rise p-5 motion-reduce:animate-none [animation-delay:80ms]">
          <NewTripForm countries={countries} />
        </Card>
      </div>
    </main>
  );
}
