"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { TabList } from "@/components/ui/tab-list";

/** Showcase of the M0 building blocks. */
export function GalleryView() {
  const t = useTranslations("Gallery");
  const common = useTranslations("Common");
  const [day, setDay] = useState("day-1");
  const [tab, setTab] = useState("plan");
  const [sheetOpen, setSheetOpen] = useState(false);

  const days = [
    { id: "day-1", n: 1, icon: "🏙️", count: 4 },
    { id: "day-2", n: 2, icon: "🍜", count: 3 },
    { id: "day-3", n: 3, icon: "🚐", count: 0 },
  ].map((d) => ({
    id: d.id,
    icon: d.icon,
    label: t("dayLabel", { n: d.n }),
    description: `${t("dayUndated")} · ${t("dayItems", { count: d.count })}`,
  }));

  return (
    <main className="min-h-dvh bg-surface-warm px-4 py-10 ipad:px-10">
      <div className="mx-auto flex max-w-237.5 flex-col gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="animate-section-rise text-[clamp(2rem,4vw,2.5rem)] font-medium leading-[1.12] tracking-[-0.04em] text-ink-strong motion-reduce:animate-none">
              {t("title")}
            </h1>
            <p className="text-[16px] font-medium tracking-[-0.02em] text-muted">{t("intro")}</p>
          </div>
          <LocaleSwitcher />
        </header>

        <Section title={t("buttons")}>
          <div className="flex flex-wrap gap-3">
            <Button>{t("primary")}</Button>
            <Button variant="secondary">{t("secondary")}</Button>
            <Button variant="soft">{t("soft")}</Button>
            <Button variant="ghost">{t("ghost")}</Button>
          </div>
        </Section>

        <Section title={t("chips")}>
          <div className="flex flex-wrap gap-2">
            <Chip>{t("statusIdea")}</Chip>
            <Chip tone="sky">{t("statusPlanned")}</Chip>
            <Chip tone="amber">{t("statusBooked")}</Chip>
            <Chip tone="green">{t("statusDone")}</Chip>
          </div>
        </Section>

        <Section title={t("tabs")}>
          <TabList
            label={t("tabs")}
            orientation="horizontal"
            idPrefix="trip-tab"
            activeId={tab}
            onSelect={setTab}
            items={[
              { id: "plan", label: t("tabPlan") },
              { id: "ideas", label: t("tabIdeas") },
              { id: "money", label: t("tabMoney") },
              { id: "people", label: t("tabPeople") },
            ]}
          />
        </Section>

        <Section title={t("days")}>
          <Card className="ipad-landscape:max-w-100">
            <TabList
              label={t("days")}
              idPrefix="day"
              activeId={day}
              onSelect={setDay}
              items={days}
            />
          </Card>
        </Section>

        <Section title={t("empty")}>
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={<Button variant="secondary">{t("emptyAction")}</Button>}
          />
        </Section>

        <Section title={t("sheet")}>
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            {t("openSheet")}
          </Button>
          <Sheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title={t("sheetTitle")}
            closeLabel={common("close")}
          >
            <div className="flex flex-col items-start gap-3">
              <Chip tone="sky">{t("statusPlanned")}</Chip>
              <p className="text-[15px] font-medium text-muted">{t("sheetBody")}</p>
            </div>
          </Sheet>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.04em] text-muted-grey">
        {title}
      </h2>
      {children}
    </section>
  );
}
