"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Event, Guest, Stats, BillingRecord, CardTemplate } from "@/lib/types";
import StatsGrid from "@/components/StatsGrid";
import GuestTable from "@/components/GuestTable";
import CsvUploader from "@/components/CsvUploader";
import ReminderPanel from "@/components/ReminderPanel";
import BillingPanel from "@/components/BillingPanel";
import Link from "next/link";
import { formatEventDate, postJson } from "@/lib/client";

interface EventDetail {
  event: Event;
  guests: Guest[];
  stats: Stats;
  billing: BillingRecord | null;
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const refresh = useCallback(() => {
    fetch(`/api/events/${id}`)
      .then(async (r) => {
        if (r.status === 404) throw new Error("This event doesn't exist or was removed.");
        if (!r.ok) throw new Error(`Could not load event (${r.status}).`);
        return r.json();
      })
      .then((d: EventDetail) => {
        setDetail(d);
        setLoadError(null);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [id]);

  useEffect(() => {
    refresh();
    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, [refresh]);

  if (loadError && !detail) {
    return (
      <p className="text-sm text-decline">
        {loadError}{" "}
        <Link href="/" className="underline text-ink">
          Back to events
        </Link>
      </p>
    );
  }
  if (!detail) return <p className="text-sm text-ink/60">Loading…</p>;
  const { event, guests, stats, billing } = detail;
  const template = templates.find((t) => t.id === event.templateId);
  const sampleGuest = guests[0];
  const unsentCount = guests.filter((g) => g.status === "pending").length;

  async function retryInvites() {
    setRetrying(true);
    await postJson(`/api/events/${event.id}/invites/retry`);
    setRetrying(false);
    refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl">{event.name}</h1>
        <p className="text-sm text-ink/60 mt-1">
          {formatEventDate(event.eventDate)} {event.venue && `· ${event.venue}`} · {stats.total} invited
        </p>
      </div>

      <section>
        <h2 className="text-sm font-medium mb-3">Live stats</h2>
        <StatsGrid stats={stats} />
      </section>

      {template && (
        <section>
          <h2 className="text-sm font-medium mb-3">Occasion card preview</h2>
          <div
            className="w-full max-w-xs rounded-lg overflow-hidden text-paper p-6 flex flex-col justify-between aspect-[3/4]"
            style={{ backgroundColor: template.previewColor }}
          >
            <p className="text-xs uppercase tracking-wide opacity-80 capitalize">{event.occasionType}</p>
            <div>
              <p className="font-serif text-xl leading-snug">{event.name}</p>
              <p className="text-sm mt-3 opacity-90">You&apos;re invited by</p>
              <p className="text-sm">{event.inviterName}</p>
              {sampleGuest && (
                <>
                  <p className="text-sm mt-3 opacity-90">Dear</p>
                  <p className="text-sm">{sampleGuest.name}</p>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-ink/50 mt-2">
            Rendered per guest at send time — inviter, guest name, and occasion swap in automatically.
          </p>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium mb-3">Guest list</h2>
        <CsvUploader eventId={event.id} onUploaded={refresh} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Guests ({guests.length})</h2>
          {unsentCount > 0 && (
            <button
              onClick={retryInvites}
              disabled={retrying}
              className="text-xs px-2.5 py-1 rounded-md border border-line hover:bg-line/30 disabled:opacity-50"
            >
              {retrying ? "Retrying…" : `Retry ${unsentCount} unsent invite${unsentCount === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
        <GuestTable guests={guests} onChange={refresh} />
      </section>

      <section>
        <h2 className="text-sm font-medium mb-3">Reminders</h2>
        <ReminderPanel event={event} onChange={refresh} />
      </section>

      {billing && (
        <section>
          <h2 className="text-sm font-medium mb-3">Billing for this event</h2>
          <BillingPanel billing={billing} onChange={refresh} />
        </section>
      )}
    </div>
  );
}
