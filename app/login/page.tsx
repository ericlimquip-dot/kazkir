import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Card } from "@/components/ui/card";
import { safeNextPath } from "@/lib/safe-next";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const t = await getTranslations("Auth");
  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-clip px-4 py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Image
          alt=""
          src="/originkit/features-01/bg.png"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="fixed right-4 top-4 z-20">
        <LocaleSwitcher />
      </div>

      <div className="relative z-10 flex w-full max-w-100 flex-col items-center gap-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="animate-section-rise text-[clamp(2rem,4vw,2.5rem)] font-medium leading-[1.12] tracking-[-0.04em] text-ink-strong motion-reduce:animate-none">
            Kazkir
          </h1>
          <p className="animate-section-rise text-balance text-[16px] font-medium tracking-[-0.02em] text-muted motion-reduce:animate-none [animation-delay:80ms]">
            {t("tagline")}
          </p>
        </header>

        <Card className="animate-section-rise w-full p-5 motion-reduce:animate-none [animation-delay:160ms]">
          {params.error ? (
            <p role="alert" className="mb-4 text-center text-[13px] font-medium text-[#a23b2a]">
              {t("callbackError")}
            </p>
          ) : null}
          <LoginForm next={next} />
        </Card>
      </div>
    </main>
  );
}
