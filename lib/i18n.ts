import type { Lang } from "./occasions";

// Locale plumbing shared by server and client. The visitor's language lives in
// the `lang` cookie (set by the language toggle); without it we follow the
// browser's Accept-Language, defaulting to English.

export type Locale = Lang;
export const LOCALES: Locale[] = ["en", "ar"];
export const LOCALE_COOKIE = "lang";

export const isLocale = (value: unknown): value is Locale => value === "en" || value === "ar";

export const dir = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");

// Intl tags: Gregorian calendar and Latin digits in both languages (common in
// Saudi apps); Hijri dates are shown separately.
const INTL: Record<Locale, string> = { en: "en-GB", ar: "ar-SA-u-ca-gregory-nu-latn" };
const HIJRI: Record<Locale, string> = { en: "en-GB-u-ca-islamic-umalqura", ar: "ar-SA-u-ca-islamic-umalqura-nu-latn" };

export function localeFromAcceptLanguage(header: string | null): Locale {
  const first = header?.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("ar") ? "ar" : "en";
}

// Picks the right plural form. Arabic has six (zero, one, two, few, many, other).
type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
const rules: Record<Locale, Intl.PluralRules> = { en: new Intl.PluralRules("en"), ar: new Intl.PluralRules("ar") };
export function plural(locale: Locale, n: number, forms: PluralForms) {
  return (forms[rules[locale].select(n)] ?? forms.other).replace("{n}", String(n));
}

// ------------------------------------------------------------ formatting

// Event dates are calendar dates (YYYY-MM-DD); format in UTC so they never shift a day.
export function formatDate(ymd: string, locale: Locale, style: "medium" | "long" = "medium") {
  const opts: Intl.DateTimeFormatOptions =
    style === "long" ? { weekday: "long", day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "short", year: "numeric" };
  return new Date(ymd).toLocaleDateString(INTL[locale], { ...opts, timeZone: "UTC" });
}

export function formatHijri(ymd: string, locale: Locale) {
  return new Date(ymd).toLocaleDateString(HIJRI[locale], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function formatDateTime(iso: string, locale: Locale) {
  return new Date(iso).toLocaleString(INTL[locale], { dateStyle: "medium", timeStyle: "short" });
}

export function formatNumber(n: number, locale: Locale) {
  return n.toLocaleString(INTL[locale]);
}

export function formatSar(amount: number, locale: Locale) {
  const value = amount.toLocaleString(INTL[locale], { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return locale === "ar" ? `${value} ر.س` : `${value} SAR`;
}
