"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Item-detail container: bottom sheet on phones, right-side panel from ipad-landscape up.
 * Built on <dialog> for focus trapping, Escape-to-close and an accessible backdrop.
 */
export function Sheet({
  open,
  onClose,
  title,
  closeLabel = "Close",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-0 max-h-none max-w-none bg-transparent p-0 backdrop:bg-ink/30",
        "fixed inset-x-0 bottom-0 top-auto w-full",
        "ipad-landscape:inset-y-0 ipad-landscape:left-auto ipad-landscape:right-0 ipad-landscape:h-full ipad-landscape:w-110",
      )}
    >
      <div
        className={cn(
          "flex max-h-[85dvh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-card animate-section-rise motion-reduce:animate-none",
          "ipad-landscape:h-full ipad-landscape:max-h-none ipad-landscape:rounded-none ipad-landscape:rounded-l-3xl",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-[18px] font-medium tracking-[-0.02em] text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-ink"
          >
            <span aria-hidden="true" className="text-[20px]">
              ×
            </span>
            <span className="sr-only">{closeLabel}</span>
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </dialog>
  );
}
