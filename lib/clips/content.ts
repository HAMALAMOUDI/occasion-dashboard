import { formatDate, formatHijri } from "../i18n";
import { hostLine, occasion, type Lang, type OccasionType } from "../occasions";
import type { Event } from "../types";
import type { ClipText } from "./engine";

// Closing line of a clip, by the occasion's tone.
const CLOSING: Record<"celebration" | "formal" | "solemn", Record<Lang, string>> = {
  celebration: { en: "We look forward to celebrating with you", ar: "بانتظار تشريفكم" },
  formal: { en: "We look forward to welcoming you", ar: "نتشرف بحضوركم" },
  solemn: { en: "May Allah have mercy on the deceased", ar: "رحم الله الفقيد وأسكنه فسيح جناته" },
};

const SAMPLE_VENUE: Record<Lang, string> = { en: "Ritz-Carlton, Jeddah", ar: "قاعة الريتز كارلتون، جدة" };
const SAMPLE_DATE = "2026-12-17";

function build(occ: OccasionType, lang: Lang, title: string, host: string, date: string, venue: string): ClipText {
  const o = occasion(occ);
  return {
    lang,
    label: `${o.label[lang]}`,
    kicker: o.cardLine[lang],
    title,
    date: formatDate(date, lang, "long"),
    hijri: formatHijri(date, lang),
    venue,
    host: host ? hostLine(o, lang, host) : "",
    cta: CLOSING[o.tone][lang],
  };
}

// The words of an event's clip, in its invitation language.
export function clipTextForEvent(event: Pick<Event, "occasionType" | "language" | "name" | "inviterName" | "eventDate" | "venue">): ClipText {
  return build(event.occasionType, event.language, event.name, event.inviterName, event.eventDate, event.venue);
}

// Sample wording for previews and the sample video files.
export function clipSampleText(occ: OccasionType, lang: Lang): ClipText {
  const o = occasion(occ);
  return build(occ, lang, o.namePlaceholder[lang], o.hostPlaceholder[lang], SAMPLE_DATE, SAMPLE_VENUE[lang]);
}
