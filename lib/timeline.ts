import type { Guest } from "./types";

// Day-by-day running totals for the event page's "Replies over time" chart:
// how many guests had been invited, and how many had said yes or no, by the
// end of each day from the first invitation to today.

export interface TimelinePoint {
  day: string; // YYYY-MM-DD
  invited: number;
  coming: number;
  notComing: number;
}

const DAY_MS = 86_400_000;
const addDays = (ymd: string, n: number) => new Date(Date.parse(ymd) + n * DAY_MS).toISOString().slice(0, 10);

// `dayOf` turns a timestamp into the organizer's calendar day (YYYY-MM-DD).
export function replyTimeline(guests: Guest[], today: string, dayOf: (iso: string) => string): TimelinePoint[] {
  const sent = guests.filter((g) => g.inviteSentAt).map((g) => ({ g, sentDay: dayOf(g.inviteSentAt!) }));
  if (sent.length === 0) return [];
  let start = sent.reduce((min, s) => (s.sentDay < min ? s.sentDay : min), sent[0].sentDay);
  const end = today > start ? today : start;
  if (start === end) start = addDays(end, -1); // a line needs two days

  // A reply with no timestamp (e.g. an older record) counts from the day it was sent.
  const replyDay = (g: Guest, sentDay: string) => (g.respondedAt ? dayOf(g.respondedAt) : sentDay);
  const points: TimelinePoint[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    let invited = 0, coming = 0, notComing = 0;
    for (const { g, sentDay } of sent) {
      if (sentDay <= day) invited++;
      if (g.status === "accepted" && replyDay(g, sentDay) <= day) coming++;
      if (g.status === "declined" && replyDay(g, sentDay) <= day) notComing++;
    }
    points.push({ day, invited, coming, notComing });
  }
  return points;
}

// Up to ~4 round tick values from 0 covering `max` (0, 5, 10, 15 …).
export function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag);
  const ticks = [];
  for (let v = 0; v < max + step; v += step) ticks.push(v);
  return ticks;
}
