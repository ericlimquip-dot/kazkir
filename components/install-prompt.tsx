"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Mode = "hidden" | "ios" | "android";

const DISMISS_KEY = "kazkir.installPrompt.dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = navigator.userAgent;
  // iPadOS reports itself as Mac; touch support tells them apart.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Walks people through installing Kazkir. Push notifications on iPhone only work once installed,
 * so this matters more than a typical install banner.
 */
export function InstallPrompt() {
  const t = useTranslations("Install");
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || readDismissed()) return;
    if (isIos()) {
      // Deferred to the next frame: browser-only checks can't run during server render.
      const frame = requestAnimationFrame(() => setMode("ios"));
      return () => cancelAnimationFrame(frame);
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (mode === "hidden") return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Private mode: the prompt simply shows again next time.
    }
    setMode("hidden");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setMode("hidden");
  };

  return (
    <Card className="animate-section-rise flex items-center gap-4 p-4 motion-reduce:animate-none">
      <div className="relative hidden h-24 w-12 shrink-0 iphone:block" aria-hidden="true">
        <Image
          src="/originkit/features-01/phone-frame.svg"
          alt=""
          fill
          className="object-contain"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-[16px] font-medium tracking-[-0.01em] text-ink">{t("title")}</p>
        {mode === "ios" ? (
          <ol className="list-decimal pl-4 text-[13px] font-medium leading-relaxed text-muted">
            <li>{t("iosStep1")}</li>
            <li>{t("iosStep2")}</li>
            <li>{t("iosStep3")}</li>
          </ol>
        ) : (
          <p className="text-[13px] font-medium text-muted">{t("androidBody")}</p>
        )}
        <div className="mt-1 flex gap-2">
          {mode === "android" ? (
            <Button size="sm" onClick={install}>
              {t("install")}
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={dismiss}>
            {t("later")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
