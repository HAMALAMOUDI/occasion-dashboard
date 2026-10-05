import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Plus, Sparkles, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser, eventsFor } from "@/lib/auth";
import { computeStats } from "@/lib/rsvp";
import { formatEventDate } from "@/lib/client";
import { countdownLabel, daysUntil, greeting } from "@/lib/dates";
import RsvpBar from "@/components/RsvpBar";
import { Event, Stats } from "@/lib/types";

export const dynamic = "force-dynamic";

const TIMEZONE = process.env.EVENT_TIMEZONE;

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const [events, templates] = await Promise.all([eventsFor(user), db.getTemplates()]);
  const rows = await Promise.all(
    events.map(async (event) => {
      const stats = computeStats(await db.getGuests(event.id));
      return { event, stats, days: daysUntil(event.eventDate, TIMEZONE), color: templates.find((t) => t.id === event.templateId)?.previewColor };
    })
  );

  const upcoming = rows.filter((r) => r.days >= 0);
  const past = rows.filter((r) => r.days < 0).reverse();
  const totals = upcoming.reduce(
    (acc, r) => ({ invited: acc.invited + r.stats.total, coming: acc.coming + r.stats.accepted, waiting: acc.waiting + r.stats.pending }),
    { invited: 0, coming: 0, waiting: 0 }
  );
  const next = upcoming[0];

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="text-muted">{greeting(TIMEZONE)} 👋</p>
          <h1 className="font-serif text-3xl sm:text-4xl mt-1">
            {next ? (
              <>
                {next.days === 0 ? "It's the big day" : "Your next celebration is"}{" "}
                <span className="text-pine">{next.days === 0 ? "today" : countdownLabel(next.days).toLowerCase()}</span>
              </>
            ) : (
              "Let's plan something lovely"
            )}
          </h1>
        </div>
        <Link href="/events/new" className="btn-primary btn-md self-start sm:self-auto">
          <Plus size={16} /> New event
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brass-soft text-brass">
            <Sparkles size={24} />
          </span>
          <h2 className="font-serif text-2xl mt-4">No events yet</h2>
          <p className="text-muted mt-2 max-w-sm mx-auto">
            Create your first event, upload your guest list, and we&apos;ll send beautiful WhatsApp invitations for you.
          </p>
          <Link href="/events/new" className="btn-primary btn-md mt-6">
            <Plus size={16} /> Create your first event
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-10">
              {[
                { label: "Guests invited", value: totals.invited },
                { label: "Coming", value: totals.coming },
                { label: "Waiting to hear", value: totals.waiting },
              ].map((t) => (
                <div key={t.label} className="card px-4 py-4 sm:px-5">
                  <p className="font-serif text-2xl sm:text-3xl">{t.value}</p>
                  <p className="text-xs sm:text-sm text-muted mt-0.5">{t.label}</p>
                </div>
              ))}
            </div>
          )}

          <EventSection title="Upcoming" rows={upcoming} />
          <EventSection title="Past events" rows={past} muted />
        </>
      )}
    </div>
  );
}

function EventSection({
  title,
  rows,
  muted = false,
}: {
  title: string;
  rows: { event: Event; stats: Stats; days: number; color?: string }[];
  muted?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className="eyebrow mb-3">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {rows.map(({ event, stats, days, color }) => {
          const responded = stats.accepted + stats.declined;
          return (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className={`card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md ${muted ? "opacity-75 hover:opacity-100" : ""}`}
            >
              <div className="h-1.5" style={{ backgroundColor: color ?? "var(--pine)" }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="eyebrow">{event.occasionType}</p>
                    <p className="font-serif text-xl mt-1 truncate">{event.name}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      days >= 0 && days <= 7 ? "bg-brass-soft text-[#8a6326]" : "bg-paper text-muted"
                    }`}
                  >
                    {countdownLabel(days)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} /> {formatEventDate(event.eventDate)}
                  </span>
                  {event.venue && (
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <MapPin size={14} className="shrink-0" /> <span className="truncate">{event.venue}</span>
                    </span>
                  )}
                </div>
                <div className="mt-5">
                  <RsvpBar stats={stats} />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={13} />
                      {stats.total === 0 ? "No guests yet" : `${stats.accepted} coming · ${responded} of ${stats.total} replied`}
                    </span>
                    <ArrowRight size={15} className="text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-pine" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
