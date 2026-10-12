import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** 40px icon tile from Features 01: grey gradient when idle, white + sky border when active. */
export function IconTile({
  active = false,
  children,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-clip rounded-lg border p-2 text-[20px] leading-none",
        active ? "border-sky-400 bg-white" : "border-line bg-linear-to-r from-white to-tile-end",
        className,
      )}
    >
      {children}
    </span>
  );
}
