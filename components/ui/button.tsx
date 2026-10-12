import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "soft" | "ghost";
  size?: "sm" | "md";
};

const VARIANTS = {
  primary: "bg-ink text-white hover:bg-black",
  secondary: "border border-line bg-white text-ink hover:bg-hover",
  soft: "border border-sky-300 bg-sky-100 text-ink shadow-active hover:brightness-[0.98]",
  ghost: "text-ink hover:bg-hover",
} as const;

const SIZES = {
  sm: "min-h-9 px-3 text-[13px]",
  md: "min-h-11 px-4 text-[15px]",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-xl font-medium tracking-[-0.01em]",
        "transition-[background-color,border-color,box-shadow,filter] duration-300 ease-out-soft motion-reduce:transition-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
