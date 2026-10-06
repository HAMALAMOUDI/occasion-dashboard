import { cache } from "react";
import { cookies, headers } from "next/headers";
import { isLocale, LOCALE_COOKIE, localeFromAcceptLanguage, type Locale } from "./i18n";
import { messages } from "./messages";

// The visitor's language: their explicit choice (cookie), else their browser's.
export const getLocale = cache(async (): Promise<Locale> => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
});

export async function getMessages() {
  return messages[await getLocale()];
}
