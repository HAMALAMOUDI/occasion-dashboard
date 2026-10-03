"use client";

import { Event } from "@/lib/types";
import { useState } from "react";

export default function ReminderPanel({ event, onChange }: { event: Event; onChange: () => void }) {
  const [busy, setBusy] = useState<"week" | "day" | null>(null);

  async function trigger(kind: "week" | "day") {
    setBusy(kind);
    await fetch(`/api/events/${event.id}/remind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    setBusy(null);
    onChange();
  }

  return (
    <div className="border border-line rounded-lg p-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">7-day reminder</p>
        <p className="text-xs text-ink/60">
          {event.reminderWeekSentAt ? `Sent ${new Date(event.reminderWeekSentAt).toLocaleString()}` : "Not sent yet"}
        </p>
      </div>
      <button
        onClick={() => trigger("week")}
        disabled={busy !== null}
        className="text-sm px-3 py-1.5 rounded-md border border-line hover:bg-line/30 disabled:opacity-50"
      >
        {busy === "week" ? "Sending…" : "Send now"}
      </button>
      <div className="hidden sm:block w-px bg-line self-stretch" />
      <div>
        <p className="text-sm font-medium">Same-day reminder</p>
        <p className="text-xs text-ink/60">
          {event.reminderDaySentAt ? `Sent ${new Date(event.reminderDaySentAt).toLocaleString()}` : "Not sent yet"}
        </p>
      </div>
      <button
        onClick={() => trigger("day")}
        disabled={busy !== null}
        className="text-sm px-3 py-1.5 rounded-md border border-line hover:bg-line/30 disabled:opacity-50"
      >
        {busy === "day" ? "Sending…" : "Send now"}
      </button>
    </div>
  );
}
