"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, RefreshCw, UserRound } from "lucide-react";
import { Event, Guest, Stats, BillingRecord, CardTemplate } from "@/lib/types";
import StatsGrid from "@/components/StatsGrid";
import GuestTable from "@/components/GuestTable";
import GuestUploader from "@/components/GuestUploader";
import AddGuestForm from "@/components/AddGuestForm";
import ReminderPanel from "@/components/ReminderPanel";
import BillingPanel from "@/components/BillingPanel";
import InvitePreview from "@/components/InvitePreview";
import RsvpBar from "@/components/RsvpBar";
import { formatEventDateLong, postJson } from "@/lib/client";
import { countdownLabel, daysUntil } from "@/lib/dates";

interface EventDetail {
  event: Event;
  guests: Guest[];
  stats: Stats;
  billing: BillingRecord | null;
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading">
      <div className="h-4 w-24 rounded bg-line" />
      <div className="h-10 w-2/3 rounded-lg bg-line" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-line/70" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-line/60" />
    </div>
  );
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
        if (r.status === 404) throw new Error("We couldn't find this event — it may have been removed.");
        if (!r.ok) throw new Error(`Something went wrong loading this event (${r.status}).`);
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
      <div className="card px-6 py-14 text-center">
        <p className="font-serif text-2xl">Hmm, that didn&apos;t work</p>
        <p className="text-muted mt-2">{loadError}</p>
        <Link href="/" className="btn-secondary btn-md mt-6">
          <ArrowLeft size={15} /> Back to your events
        </Link>
      </div>
    );
  }
  if (!detail) return <Skeleton />;

  const { event, guests, stats, billing } = detail;
  const template = templates.find((t) => t.id === event.templateId);
  const unsentCount = guests.filter((g) => g.status === "pending").length;
  const days = daysUntil(event.eventDate);
  const replied = stats.accepted + stats.declined;
  const replyRate = stats.total ? Math.round((replied / stats.total) * 100) : 0;

  async function retryInvites() {
    setRetrying(true);
    await postJson(`/api/events/${event.id}/invites/retry`);
    setRetrying(false);
    refresh();
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft size={15} /> All events
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="eyebrow">{event.occasionType}</span>
              <span className="rounded-full bg-brass-soft px-2.5 py-0.5 text-xs font-medium text-[#8a6326]">{countdownLabel(days)}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl mt-2 break-words">{event.name}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={15} /> {formatEventDateLong(event.eventDate)}
              </span>
              {event.venue && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} /> {event.venue}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <UserRound size={15} /> Hosted by {event.inviterName}
              </span>
            </div>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="card mt-6 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm">
                <span className="font-semibold">{replied}</span> of {stats.total} guests have replied
              </p>
              <p className="font-serif text-2xl text-pine">{replyRate}%</p>
            </div>
            <RsvpBar stats={stats} className="mt-3 h-2.5" />
          </div>
        )}
      </div>

      <StatsGrid stats={stats} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8 min-w-0">
          <section>
            <h2 className="font-serif text-xl mb-1">Add guests</h2>
            <p className="text-sm text-muted mb-4">Each new guest gets a personal WhatsApp invitation straight away.</p>
            <AddGuestForm eventId={event.id} onAdded={refresh} />
            <div className="my-4 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" /> or upload a whole list <span className="h-px flex-1 bg-line" />
            </div>
            <GuestUploader eventId={event.id} onUploaded={refresh} />
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-serif text-xl">
                Guest list <span className="text-muted text-base">({guests.length})</span>
              </h2>
              {unsentCount > 0 && (
                <button onClick={retryInvites} disabled={retrying} className="btn-secondary btn-sm">
                  <RefreshCw size={13} className={retrying ? "animate-spin" : ""} />
                  {retrying ? "Retrying…" : `Retry ${unsentCount} unsent`}
                </button>
              )}
            </div>
            <GuestTable guests={guests} onChange={refresh} />
          </section>
        </div>

        <aside className="space-y-5">
          <section>
            <h2 className="eyebrow mb-3">What guests receive</h2>
            <InvitePreview event={event} template={template} guestName={guests[0]?.name.split(" ")[0]} />
          </section>
          <ReminderPanel event={event} comingCount={stats.accepted} onChange={refresh} />
          {billing && <BillingPanel billing={billing} onChange={refresh} />}
        </aside>
      </div>
    </div>
  );
}
