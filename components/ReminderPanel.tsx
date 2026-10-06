"use client";

import { Event } from "@/lib/types";
import { useState } from "react";
import { BellRing, CalendarClock, CircleCheck } from "lucide-react";
import { postJson } from "@/lib/client";
import { daysUntil } from "@/lib/dates";
import { formatDate, formatDateTime } from "@/lib/i18n";
import { useLocale, useT } from "./I18nProvider";

type Kind = "week" | "day";

function shiftDate(ymd: string, days: number) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const REMINDERS: { kind: Kind; offset: number; field: "reminderWeekSentAt" | "reminderDaySentAt" }[] = [
  { kind: "week", offset: -7, field: "reminderWeekSentAt" },
  { kind: "day", offset: 0, field: "reminderDaySentAt" },
];

export default function ReminderPanel({ event, comingCount, onChange }: { event: Event; comingCount: number; onChange: () => void }) {
  const t = useT();
  const locale = useLocale();
  const [busy, setBusy] = useState<Kind | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function trigger(kind: Kind, alreadySent: boolean) {
    if (alreadySent && !window.confirm(t.reminders.confirmResend)) return;
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
        text: sent === 0 && failed === 0 ? t.reminders.noOne : t.reminders.sentTo(sent, failed),
        isError: failed > 0,
      });
    }
    onChange();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <BellRing size={17} className="text-brass" />
        <h3 className="font-medium">{t.reminders.title}</h3>
      </div>
      <p className="text-xs text-muted mt-1">{t.reminders.subtitle(comingCount)}</p>

      <ul className="mt-4 space-y-2.5">
        {REMINDERS.map((r) => {
          const sentAt = event[r.field];
          const scheduled = shiftDate(event.eventDate, r.offset);
          return (
            <li key={r.kind} className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3.5 py-3">
              <div className="flex items-center gap-3 min-w-0">
                {sentAt ? (
                  <CircleCheck size={18} className="shrink-0 text-accept" />
                ) : (
                  <CalendarClock size={18} className="shrink-0 text-muted" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t.reminders[r.kind]}</p>
                  <p className="text-xs text-muted">
                    {sentAt
                      ? t.reminders.sentAt(formatDateTime(sentAt, locale))
                      : daysUntil(scheduled) <= 0
                        ? t.reminders.dueNow
                        : t.reminders.scheduledFor(formatDate(scheduled, locale))}
                  </p>
                </div>
              </div>
              <button onClick={() => trigger(r.kind, Boolean(sentAt))} disabled={busy !== null} className="btn-secondary btn-sm shrink-0">
                {busy === r.kind ? t.reminders.sending : sentAt ? t.reminders.resend : t.reminders.sendNow}
              </button>
            </li>
          );
        })}
      </ul>
      {message && <p className={`text-xs mt-3 ${message.isError ? "text-decline" : "text-accept"}`}>{message.text}</p>}
    </div>
  );
}
