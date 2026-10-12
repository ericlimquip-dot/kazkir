import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Warm gradient panel with the dotted grid, used for empty lists and previews. */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-clip rounded-panel border border-line-soft bg-surface-warm px-6 py-10 text-center",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40"
      />
      <div className="relative flex flex-col items-center gap-2">
        <p className="text-[17px] font-medium tracking-[-0.02em] text-ink">{title}</p>
        {description ? (
          <p className="max-w-80 text-pretty text-[14px] font-medium text-muted">{description}</p>
        ) : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}
