"use client";

import { Event } from "@/lib/types";
import { useState } from "react";
import { postJson } from "@/lib/client";

type Kind = "week" | "day";

const REMINDERS: { kind: Kind; title: string; schedule: string; field: "reminderWeekSentAt" | "reminderDaySentAt" }[] = [
  { kind: "week", title: "7-day reminder", schedule: "Sends automatically 7 days before", field: "reminderWeekSentAt" },
  { kind: "day", title: "Same-day reminder", schedule: "Sends automatically on the event day", field: "reminderDaySentAt" },
];

export default function ReminderPanel({ event, onChange }: { event: Event; onChange: () => void }) {
  const [busy, setBusy] = useState<Kind | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function trigger(kind: Kind, alreadySent: boolean) {
    if (alreadySent && !window.confirm("This reminder was already sent. Send it to every accepted guest again?")) return;
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
        text: sent === 0 && failed === 0 ? "No accepted guests to remind yet." : `Sent to ${sent} guests${failed ? `, ${failed} failed` : ""}.`,
        isError: failed > 0,
      });
    }
    onChange();
  }

  return (
    <div className="border border-line rounded-lg p-4">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        {REMINDERS.map((r, i) => {
          const sentAt = event[r.field];
          return (
            <div key={r.kind} className="contents">
              {i > 0 && <div className="hidden sm:block w-px bg-line self-stretch" />}
              <div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-ink/60">
                  {sentAt ? `Sent ${new Date(sentAt).toLocaleString()}` : r.schedule}
                </p>
              </div>
              <button
                onClick={() => trigger(r.kind, Boolean(sentAt))}
                disabled={busy !== null}
                className="text-sm px-3 py-1.5 rounded-md border border-line hover:bg-line/30 disabled:opacity-50"
              >
                {busy === r.kind ? "Sending…" : sentAt ? "Send again" : "Send now"}
              </button>
            </div>
          );
        })}
      </div>
      {message && <p className={`text-xs mt-3 ${message.isError ? "text-decline" : "text-accept"}`}>{message.text}</p>}
    </div>
  );
}
