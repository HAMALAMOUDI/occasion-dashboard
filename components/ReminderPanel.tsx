"use client";

import { Event } from "@/lib/types";
import { useState } from "react";
import { BellRing, CalendarClock, CircleCheck } from "lucide-react";
import { formatEventDate, postJson } from "@/lib/client";
import { daysUntil } from "@/lib/dates";

type Kind = "week" | "day";

function shiftDate(ymd: string, days: number) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const REMINDERS: { kind: Kind; title: string; offset: number; field: "reminderWeekSentAt" | "reminderDaySentAt" }[] = [
  { kind: "week", title: "One week before", offset: -7, field: "reminderWeekSentAt" },
  { kind: "day", title: "On the day", offset: 0, field: "reminderDaySentAt" },
];

export default function ReminderPanel({ event, comingCount, onChange }: { event: Event; comingCount: number; onChange: () => void }) {
  const [busy, setBusy] = useState<Kind | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function trigger(kind: Kind, alreadySent: boolean) {
    if (alreadySent && !window.confirm("This reminder was already sent. Send it to everyone who's coming again?")) return;
    setBusy(kind);
    setMessage(null);
    const result = await postJson<{ sent: number; failed: number }>(`/api/events/${event.id}/remind`, {
      kind,
      force: alreadySent,
    });
    setBusy(null);
    if (!result.ok) {
      setMessage({ text: result.error, isError: true });
    } else {
      const { sent, failed } = result.data;
      setMessage({
        text: sent === 0 && failed === 0 ? "Nobody has said they're coming yet, so there was no one to remind." : `Reminder sent to ${sent} guest${sent === 1 ? "" : "s"}${failed ? ` — ${failed} didn't go through` : ""}.`,
        isError: failed > 0,
      });
    }
    onChange();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <BellRing size={17} className="text-brass" />
        <h3 className="font-medium">Reminders</h3>
      </div>
      <p className="text-xs text-muted mt-1">
        Sent automatically on WhatsApp to the {comingCount} guest{comingCount === 1 ? "" : "s"} who are coming.
      </p>

      <ul className="mt-4 space-y-2.5">
        {REMINDERS.map((r) => {
          const sentAt = event[r.field];
          return (
            <li key={r.kind} className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3.5 py-3">
              <div className="flex items-center gap-3 min-w-0">
                {sentAt ? (
                  <CircleCheck size={18} className="shrink-0 text-accept" />
                ) : (
                  <CalendarClock size={18} className="shrink-0 text-muted" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted">
                    {sentAt
                      ? `Sent ${new Date(sentAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
                      : daysUntil(shiftDate(event.eventDate, r.offset)) <= 0
                        ? "Going out with the next daily send"
                        : `Scheduled for ${formatEventDate(shiftDate(event.eventDate, r.offset))}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => trigger(r.kind, Boolean(sentAt))}
                disabled={busy !== null}
                className="btn-secondary btn-sm shrink-0"
              >
                {busy === r.kind ? "Sending…" : sentAt ? "Resend" : "Send now"}
              </button>
            </li>
          );
        })}
      </ul>
      {message && <p className={`text-xs mt-3 ${message.isError ? "text-decline" : "text-accept"}`}>{message.text}</p>}
    </div>
  );
}
