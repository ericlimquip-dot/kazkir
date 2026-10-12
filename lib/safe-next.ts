/** Only allow same-site relative redirects after sign-in (blocks open redirects like "//evil.com"). */
export function safeNextPath(next: string | null | undefined, fallback = "/trips"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
