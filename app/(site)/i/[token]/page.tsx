import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { CalendarDays, MapPin, Navigation } from "lucide-react";
import DesignFrame from "@/components/DesignFrame";
import Countdown from "@/components/invite/Countdown";
import ReplyForm from "@/components/invite/ReplyForm";
import { Wordmark } from "@/components/landing/SiteChrome";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/i18n";
import { mapLinkFor } from "@/lib/invite";
import { messages } from "@/lib/messages";
import { hostLine, occasion } from "@/lib/occasions";

export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;

async function load(token: string) {
  const guest = await db.getGuestByToken(token);
  const event = guest && (await db.getEvent(guest.eventId));
  return guest && event ? { guest, event } : null;
}

// Personal pages stay out of search engines and link previews show only the occasion's name.
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const found = await load((await params).token);
  return { title: found ? found.event.name : "Hikayati", robots: { index: false, follow: false } };
}

// One guest's invitation: the card, a countdown, where and when, what the
// hosts want them to know, and their reply with the entry pass.
// Everything is in the invitation's language, not the visitor's.
export default async function InvitePage({ params }: { params: Params }) {
  const { token } = await params;
  const found = await load(token);
  if (!found) notFound();
  const { guest, event } = found;
  const lang = event.language;
  const t = messages[lang].invite;
  const o = occasion(event.occasionType);
  const d = event.details;
  const map = mapLinkFor(d, event.venue);
  const asksReply = o.rsvp && guest.status !== "invalid";
  const pass =
    guest.status === "accepted" && guest.barcodeValue ? await QRCode.toString(guest.barcodeValue, { type: "svg", margin: 1 }) : null;

  const info = [
    d?.dressCode && { label: t.dressCode, value: d.dressCode },
    d?.gifts && { label: t.gifts, value: d.gifts },
    d?.note && { label: t.note, value: d.note },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-ivory px-safe pb-16 pt-10">
      <main className="mx-auto max-w-[34rem]">
        <header className="text-center">
          <p className="text-[1.0625rem] text-ink-soft">{t.dear(guest.name)}</p>
          <p className="mt-1 text-[0.9375rem] uppercase tracking-[0.16em] text-ink-soft rtl:tracking-normal">{t.invitedTo}</p>
          <h1 className="mt-3 font-editorial text-[clamp(2.5rem,10vw,3.75rem)] font-medium leading-[1.05] text-ink-deep">{event.name}</h1>
          <p className="mt-3 text-[1.0625rem] text-ink-soft">{hostLine(o, lang, event.inviterName)}</p>
        </header>

        {event.design && (
          <div className="mx-auto mt-10 w-[min(100%,22rem)]">
            <DesignFrame src={`/api/invite/${encodeURIComponent(token)}/card`} title={event.name} className="shadow-[0_24px_60px_-24px_rgb(31_30_27/0.45)] ring-1 ring-ink-deep/10" />
          </div>
        )}

        <div className="mt-10">
          <Countdown date={event.eventDate} labels={{ ...t.countdown, today: t.today, passed: t.passed }} />
        </div>

        <section className="mt-10 grid gap-6 border-t border-ink-deep/15 pt-8 sm:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 text-[0.9375rem] text-ink-soft">
              <CalendarDays size={16} /> {t.when}
            </h2>
            <p className="mt-2 text-[1.125rem] text-ink-deep">{formatDate(event.eventDate, lang, "long")}</p>
          </div>
          {event.venue && (
            <div>
              <h2 className="flex items-center gap-2 text-[0.9375rem] text-ink-soft">
                <MapPin size={16} /> {t.where}
              </h2>
              <p className="mt-2 text-[1.125rem] text-ink-deep">{event.venue}</p>
              {map && (
                <a href={map} target="_blank" rel="noopener noreferrer" className="tap-control mt-2 inline-flex items-center gap-1.5 text-[0.9375rem] text-ink-deep underline underline-offset-4 hover:no-underline">
                  <Navigation size={14} /> {t.directions}
                </a>
              )}
            </div>
          )}
        </section>

        {d && d.schedule.length > 0 && (
          <section aria-labelledby="schedule-title" className="mt-10 border-t border-ink-deep/15 pt-8">
            <h2 id="schedule-title" className="font-editorial text-[2rem] font-medium">
              {t.schedule}
            </h2>
            <ol className="mt-4">
              {d.schedule.map((s, i) => (
                <li key={i} className="grid grid-cols-[6rem_1fr] gap-4 border-b border-ink-deep/10 py-3 text-[1.0625rem]">
                  <span className="tabular-nums text-ink-soft">{s.time}</span>
                  <span className="text-ink-deep">{s.title}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {info.length > 0 && (
          <section className="mt-10 space-y-6 border-t border-ink-deep/15 pt-8">
            {info.map((x) => (
              <div key={x.label}>
                <h2 className="text-[0.9375rem] text-ink-soft">{x.label}</h2>
                <p className="mt-1 whitespace-pre-line text-[1.0625rem] leading-7 text-ink-deep">{x.value}</p>
              </div>
            ))}
          </section>
        )}

        {asksReply && (
          <div className="mt-10">
            <ReplyForm
              token={token}
              seats={guest.seats}
              lang={lang}
              initial={{ status: guest.status, attending: guest.attending, pass, barcodeValue: guest.barcodeValue }}
            />
          </div>
        )}

        <footer className="mt-16 flex flex-col items-center gap-2 text-[0.875rem] text-ink-soft">
          <Link href="/" className="tap-control">
            <Wordmark />
          </Link>
          {t.madeWith}
        </footer>
      </main>
    </div>
  );
}
