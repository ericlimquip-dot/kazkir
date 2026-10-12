import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-static";

export default async function OfflinePage() {
  const t = await getTranslations("Offline");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-warm px-4">
      <EmptyState className="w-full max-w-100" title={t("title")} description={t("description")} />
    </main>
  );
}
