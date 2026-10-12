import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE, isLocale, localeFromAcceptLanguage, type Locale } from "./config";

/** Locale comes from the cookie, then the browser's Accept-Language, then English. */
async function resolveLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
