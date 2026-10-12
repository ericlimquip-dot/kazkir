import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ChipTone = "neutral" | "sky" | "amber" | "green";

const TONES: Record<ChipTone, string> = {
  neutral: "border-line bg-white text-muted-grey",
  sky: "border-sky-300 bg-sky-100 text-muted-teal",
  amber: "border-[#f3dca8] bg-[#fff6e3] text-[#7a5a14]",
  green: "border-[#bfe3c9] bg-[#ecf8ef] text-[#2f6b3f]",
};

export function Chip({
  tone = "neutral",
  children,
  className,
}: {
  tone?: ChipTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-medium tracking-[-0.01em]",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
