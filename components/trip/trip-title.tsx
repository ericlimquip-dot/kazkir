"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { renameTrip } from "@/app/trips/actions";
import { Button } from "@/components/ui/button";

/** Trip name; owners and editors can rename it in place. */
export function TripTitle({
  tripId,
  title,
  canEdit,
}: {
  tripId: string;
  title: string;
  canEdit: boolean;
}) {
  const t = useTranslations("Trip");
  const tErr = useTranslations("NewTrip.errors");
  const [current, setCurrent] = useState(title);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const editButton = useRef<HTMLButtonElement>(null);

  const heading =
    "text-[clamp(1.75rem,4vw,2.25rem)] font-medium leading-[1.12] tracking-[-0.04em] text-ink-strong";

  const cancel = () => {
    setEditing(false);
    setDraft(current);
    setError(null);
    requestAnimationFrame(() => editButton.current?.focus());
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (draft.trim() === current) return cancel();
    startTransition(async () => {
      const res = await renameTrip(tripId, draft);
      if (res.ok) {
        setCurrent(res.title);
        setDraft(res.title);
        setEditing(false);
        setError(null);
      } else {
        setError(res.error === "forbidden" ? t("renameForbidden") : tErr(res.error));
      }
    });
  };

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <h1
          className={`animate-section-rise motion-reduce:animate-none ${heading} [overflow-wrap:anywhere]`}
        >
          {current}
        </h1>
        {canEdit ? (
          <button
            ref={editButton}
            type="button"
            onClick={() => setEditing(true)}
            aria-label={t("rename")}
            title={t("rename")}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-[18px] text-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-ink"
          >
            <span aria-hidden="true">✏️</span>
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={save} className="flex w-full flex-col gap-2">
      <label htmlFor={`trip-title-${tripId}`} className="sr-only">
        {t("tripName")}
      </label>
      <input
        id={`trip-title-${tripId}`}
        autoFocus
        value={draft}
        maxLength={120}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
        }}
        className={`${heading} w-full rounded-xl border border-sky-300 bg-white px-3 py-1.5 outline-none ring-2 ring-sky-100`}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={cancel}>
          {t("cancel")}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-[#a23b2a]">
          {error}
        </p>
      ) : null}
    </form>
  );
}
