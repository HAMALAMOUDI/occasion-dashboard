"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Event, Guest, Stats, BillingRecord, CardTemplate } from "@/lib/types";
import StatsGrid from "@/components/StatsGrid";
import GuestTable from "@/components/GuestTable";
import CsvUploader from "@/components/CsvUploader";
import ReminderPanel from "@/components/ReminderPanel";
import BillingPanel from "@/components/BillingPanel";

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

  const refresh = useCallback(() => {
    fetch(`/api/events/${id}`).then((r) => r.json()).then(setDetail);
  }, [id]);

  useEffect(() => {
    refresh();
    fetch("/api/templates").then((r) => r.json()).then(setTemplates);
  }, [refresh]);

  if (!detail) return <p className="text-sm text-ink/60">Loading…</p>;
  const { event, guests, stats, billing } = detail;
  const template = templates.find((t) => t.id === event.templateId);
  const sampleGuest = guests[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl">{event.name}</h1>
        <p className="text-sm text-ink/60 mt-1">
          {new Date(event.eventDate).toLocaleDateString()} {event.venue && `· ${event.venue}`} · {stats.total} invited
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
        <h2 className="text-sm font-medium mb-3">Guests ({guests.length})</h2>
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
