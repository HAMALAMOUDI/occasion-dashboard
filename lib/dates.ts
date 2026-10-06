// Calendar-date helpers shared by the server (reminder scheduling) and the UI
// (countdowns). Event dates are stored as plain YYYY-MM-DD calendar dates.

export const DEFAULT_TIMEZONE = "Asia/Riyadh";

function todayIn(timeZone: string, now: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now); // YYYY-MM-DD
}

const toUtcMidnight = (ymd: string) => Date.parse(`${ymd.slice(0, 10)}T00:00:00Z`);

// Whole days from "today" in `timeZone` until the event date (negative = past).
export function daysUntil(eventDate: string, timeZone = DEFAULT_TIMEZONE, now = new Date()): number {
  return Math.round((toUtcMidnight(eventDate) - toUtcMidnight(todayIn(timeZone, now))) / 86_400_000);
}

export function partOfDay(timeZone = DEFAULT_TIMEZONE, now = new Date()): "morning" | "afternoon" | "evening" {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", hourCycle: "h23" }).format(now));
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
