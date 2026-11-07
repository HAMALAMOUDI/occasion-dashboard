import type { InviteDetails } from "./types";

// The guest's invitation page (/i/<token>): what an organizer can add beyond
// the card, read from untrusted input.

const MAX_TEXT = 300;
const MAX_STEPS = 12;

const text = (v: unknown, max = MAX_TEXT) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Only plain web links, so a guest's tap can never run script.
export function safeUrl(v: unknown): string {
  const s = text(v, 500);
  if (!s) return "";
  try {
    const url = new URL(s);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function parseInviteDetails(input: unknown): InviteDetails | null {
  if (!input || typeof input !== "object") return null;
  const src = input as Record<string, unknown>;
  const mapUrl = safeUrl(src.mapUrl);
  // A map link that isn't a web link is a mistake worth reporting, not silently dropping.
  if (text(src.mapUrl) && !mapUrl) return null;
  const schedule = (Array.isArray(src.schedule) ? src.schedule : [])
    .slice(0, MAX_STEPS)
    .map((s) => ({ time: text((s as Record<string, unknown>)?.time, 40), title: text((s as Record<string, unknown>)?.title, 120) }))
    .filter((s) => s.title);
  return { mapUrl, dressCode: text(src.dressCode), gifts: text(src.gifts), note: text(src.note), schedule };
}

export const EMPTY_DETAILS: InviteDetails = { mapUrl: "", dressCode: "", gifts: "", note: "", schedule: [] };

// A map search for the venue, when the organizer hasn't pasted a map link.
export function mapLinkFor(details: InviteDetails | null, venue: string) {
  if (details?.mapUrl) return details.mapUrl;
  return venue ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}` : "";
}
