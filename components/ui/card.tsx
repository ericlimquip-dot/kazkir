import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Raised cards use the layered Features 01 shadow; flat cards use a border. */
  variant?: "raised" | "flat";
};

export function Card({ variant = "raised", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white p-3",
        variant === "raised" ? "shadow-card" : "border border-line-soft",
        className,
      )}
      {...props}
    />
  );
}
