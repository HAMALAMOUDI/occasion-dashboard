"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Info, Languages, MapPin, RefreshCw, UserRound } from "lucide-react";
import { Event, Guest, Stats, BillingRecord, CardTemplate } from "@/lib/types";
import StatsGrid from "@/components/StatsGrid";
import GuestTable from "@/components/GuestTable";
import GuestUploader from "@/components/GuestUploader";
import AddGuestForm from "@/components/AddGuestForm";
import ReminderPanel from "@/components/ReminderPanel";
import BillingPanel from "@/components/BillingPanel";
import InvitePreview from "@/components/InvitePreview";
import RsvpBar from "@/components/RsvpBar";
import { useLocale, useT } from "@/components/I18nProvider";
import { postJson } from "@/lib/client";
import { daysUntil } from "@/lib/dates";
import { formatDate, formatHijri } from "@/lib/i18n";
import { hostLine, occasion } from "@/lib/occasions";

interface EventDetail {
  event: Event;
  guests: Guest[];
  stats: Stats;
  billing: BillingRecord | null;
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true">
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
  const t = useT();
  const locale = useLocale();
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const refresh = useCallback(() => {
    fetch(`/api/events/${id}`)
      .then(async (r) => {
        if (r.status === 404) throw new Error(t.event.notFound);
        if (!r.ok) throw new Error(t.event.loadFailed(r.status));
        return r.json();
      })
      .then((d: EventDetail) => {
        setDetail(d);
        setLoadError(null);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [id, t]);

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
        <p className="font-serif text-2xl">{t.event.oops}</p>
        <p className="text-muted mt-2">{loadError}</p>
        <Link href="/" className="btn-secondary btn-md mt-6">
          <ArrowLeft size={15} className="rtl:rotate-180" /> {t.event.back}
        </Link>
      </div>
    );
  }
  if (!detail) return <Skeleton />;

  const { event, guests, stats, billing } = detail;
  const o = occasion(event.occasionType);
  const festive = o.tone !== "solemn";
  const template = templates.find((tpl) => tpl.id === event.templateId);
  const unsentCount = guests.filter((g) => g.status === "pending").length;
  const days = daysUntil(event.eventDate);
  const replied = stats.accepted + stats.declined;
  const notified = stats.pending - stats.notSent;
  const progress = o.rsvp ? replied : notified;
  const progressPct = stats.total ? Math.round((progress / stats.total) * 100) : 0;
  const progressLabel = o.rsvp ? t.event.replied(replied, stats.total) : t.event.notifiedOf(notified, stats.total);

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
          <ArrowLeft size={15} className="rtl:rotate-180" /> {t.event.allEvents}
        </Link>

        <div className="mt-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">
              {o.emoji} {o.label[locale]}
            </span>
            <span className="rounded-full bg-brass-soft px-2.5 py-0.5 text-xs font-medium text-[#8a6326]">{t.countdown(days)}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl mt-2 break-words">{event.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} /> {formatDate(event.eventDate, locale, "long")}
              <span className="text-ink/40">·</span> {formatHijri(event.eventDate, locale)}
            </span>
            {event.venue && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} /> {event.venue}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <UserRound size={15} /> {hostLine(o, locale, event.inviterName)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Languages size={15} /> {t.event.invitationLanguage(event.language === "ar" ? "العربية" : "English")}
            </span>
          </div>
        </div>

        {!o.rsvp && (
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-paper px-4 py-3 text-sm text-muted">
            <Info size={16} className="mt-0.5 shrink-0" /> {t.event.noRsvpNote}
          </p>
        )}

        {stats.total > 0 && (
          <div className="card mt-6 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm">{progressLabel}</p>
              <p className="font-serif text-2xl text-pine">{progressPct}%</p>
            </div>
            <RsvpBar stats={o.rsvp ? stats : { ...stats, accepted: notified, pending: stats.notSent }} label={progressLabel} className="mt-3 h-2.5" />
          </div>
        )}
      </div>

      <StatsGrid stats={stats} rsvp={o.rsvp} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8 min-w-0">
          <section>
            <h2 className="font-serif text-xl mb-1">{t.event.addGuests}</h2>
            <p className="text-sm text-muted mb-4">{t.event.addGuestsBody}</p>
            <AddGuestForm eventId={event.id} festive={festive} onAdded={refresh} />
            <div className="my-4 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" /> {t.event.orUpload} <span className="h-px flex-1 bg-line" />
            </div>
            <GuestUploader eventId={event.id} festive={festive} onUploaded={refresh} />
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-serif text-xl">
                {t.event.guestList} <span className="text-muted text-base">({guests.length})</span>
              </h2>
              {unsentCount > 0 && (
                <button onClick={retryInvites} disabled={retrying} className="btn-secondary btn-sm">
                  <RefreshCw size={13} className={retrying ? "animate-spin" : ""} />
                  {retrying ? t.event.retrying : t.event.retryUnsent(unsentCount)}
                </button>
              )}
            </div>
            <GuestTable guests={guests} rsvp={o.rsvp} onChange={refresh} />
          </section>
        </div>

        <aside className="space-y-5">
          <section>
            <h2 className="eyebrow mb-3">{t.event.whatGuestsReceive}</h2>
            <InvitePreview event={event} template={template} guestName={guests[0]?.name.split(" ")[0]} />
          </section>
          {o.rsvp && <ReminderPanel event={event} comingCount={stats.accepted} onChange={refresh} />}
          {billing && <BillingPanel billing={billing} onChange={refresh} />}
        </aside>
      </div>
    </div>
  );
}
