import { twMerge } from "tailwind-merge";

/**
 * Join class names, skipping falsy values. Later classes win over earlier conflicting ones
 * (cn("w-full", "w-24") → "w-24"), so components can override base styles safely.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(" "));
}
