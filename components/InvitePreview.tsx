import { CardTemplate, Event } from "@/lib/types";
import { dir, formatDate, formatHijri } from "@/lib/i18n";
import { messages } from "@/lib/messages";
import { hostLine, occasion } from "@/lib/occasions";

type PreviewEvent = Pick<Event, "name" | "occasionType" | "inviterName" | "eventDate" | "venue" | "language">;

// The occasion card and the WhatsApp message it arrives with — in the event's
// invitation language, whatever language the organizer is using the portal in.
export function OccasionCard({ event, template, guestName }: { event: PreviewEvent; template?: CardTemplate; guestName?: string }) {
  const lang = event.language;
  const t = messages[lang].card;
  const o = occasion(event.occasionType);
  const solemn = o.tone === "solemn";
  return (
    <div
      lang={lang}
      dir={dir(lang)}
      className="relative w-full aspect-[4/5] overflow-hidden rounded-xl p-6 text-white flex flex-col justify-between shadow-lg"
      style={{ backgroundColor: template?.previewColor ?? (solemn ? "#3d4245" : "#1f5a45") }}
    >
      <div className="pointer-events-none absolute inset-3 rounded-lg border border-white/25" />
      {!solemn && <div className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-white/10" />}
      <p className="relative text-[11px] uppercase tracking-[0.2em] opacity-80 rtl:tracking-normal rtl:text-xs">
        {o.emoji} {o.label[lang]}
      </p>
      <div className="relative">
        {guestName && <p className="text-sm opacity-90 mb-3">{t.to(guestName)}</p>}
        <p className="text-sm opacity-90">{o.cardLine[lang]}</p>
        <p className="font-serif text-2xl leading-tight mt-1">{event.name || t.eventFallback}</p>
        {event.inviterName && <p className="text-sm mt-3 opacity-90">{hostLine(o, lang, event.inviterName)}</p>}
        {event.eventDate && (
          <p className="text-xs mt-4 opacity-80">
            {formatDate(event.eventDate, lang, "long")}
            <span className="block opacity-80">{formatHijri(event.eventDate, lang)}</span>
          </p>
        )}
        {event.venue && <p className="text-xs opacity-80">{event.venue}</p>}
      </div>
    </div>
  );
}

export default function InvitePreview({ event, template, guestName }: { event: PreviewEvent; template?: CardTemplate; guestName?: string }) {
  const lang = event.language;
  const t = messages[lang].card;
  const rsvp = occasion(event.occasionType).rsvp;
  const name = guestName || t.sampleGuest;
  const eventName = event.name || t.eventFallback;
  return (
    <div className="rounded-2xl bg-chat-bg p-4 sm:p-5" lang={lang} dir={dir(lang)}>
      {/* An incoming message, as the guest sees it. */}
      <div className="me-auto max-w-[19rem] rounded-xl rounded-ss-sm bg-surface p-1.5 shadow-sm">
        <OccasionCard event={event} template={template} guestName={name} />
        <p className="px-2 pt-2.5 text-[13px] leading-relaxed text-ink">
          {rsvp ? t.message(name, eventName, event.venue) : t.announcement(name, eventName, event.venue)}
        </p>
        <p className="px-2 pb-1 text-end text-[10px] text-muted">9:41</p>
      </div>
      {rsvp && (
        <div className="me-auto mt-1 grid max-w-[19rem] grid-cols-2 gap-1">
          <span className="rounded-lg bg-surface py-2 text-center text-[13px] font-medium text-[#027eb5] shadow-sm">{t.accept}</span>
          <span className="rounded-lg bg-surface py-2 text-center text-[13px] font-medium text-[#027eb5] shadow-sm">{t.decline}</span>
        </div>
      )}
    </div>
  );
}
