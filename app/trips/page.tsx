import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { InstallPrompt } from "@/components/install-prompt";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";

/** Trips home. M1 shows the signed-in shell; trip cards arrive in M2. */
export default async function TripsPage() {
  const t = await getTranslations("Trips");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/trips");

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

        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      </div>
    </main>
  );
}
