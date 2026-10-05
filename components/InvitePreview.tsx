import { CardTemplate, Event } from "@/lib/types";
import { formatEventDateLong } from "@/lib/client";

type PreviewEvent = Pick<Event, "name" | "occasionType" | "inviterName" | "eventDate" | "venue">;

// The occasion card plus the WhatsApp message it's sent with — so organizers
// see exactly what their guests will receive.
export function OccasionCard({ event, template, guestName }: { event: PreviewEvent; template?: CardTemplate; guestName?: string }) {
  return (
    <div
      className="relative w-full aspect-[4/5] overflow-hidden rounded-xl p-6 text-white flex flex-col justify-between shadow-lg"
      style={{ backgroundColor: template?.previewColor ?? "#1f5a45" }}
    >
      <div className="pointer-events-none absolute inset-3 rounded-lg border border-white/25" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <p className="relative text-[11px] uppercase tracking-[0.2em] opacity-80">{event.occasionType}</p>
      <div className="relative">
        {guestName && <p className="text-sm opacity-90 mb-3">Dear {guestName},</p>}
        <p className="font-serif text-2xl leading-tight">{event.name || "Your event name"}</p>
        <p className="text-sm mt-3 opacity-90">
          {event.inviterName ? `${event.inviterName} would love to celebrate with you` : "Hosted by you"}
        </p>
        {event.eventDate && <p className="text-xs mt-4 opacity-80">{formatEventDateLong(event.eventDate)}</p>}
        {event.venue && <p className="text-xs opacity-80">{event.venue}</p>}
      </div>
    </div>
  );
}

export default function InvitePreview({ event, template, guestName }: { event: PreviewEvent; template?: CardTemplate; guestName?: string }) {
  const name = guestName || "Layla";
  return (
    <div className="rounded-2xl bg-chat-bg p-4 sm:p-5">
      <div className="ml-auto max-w-[19rem] rounded-xl rounded-tr-sm bg-whatsapp p-1.5 shadow-sm">
        <OccasionCard event={event} template={template} guestName={name} />
        <p className="px-2 pt-2.5 text-[13px] leading-relaxed text-ink">
          Hi {name}! You&apos;re invited to <span className="font-semibold">{event.name || "our event"}</span>
          {event.venue ? ` at ${event.venue}` : ""}. Will you be joining us?
        </p>
        <p className="px-2 pb-1 text-right text-[10px] text-muted">9:41 ✓✓</p>
      </div>
      <div className="ml-auto mt-1 grid max-w-[19rem] grid-cols-2 gap-1">
        <span className="rounded-lg bg-surface py-2 text-center text-[13px] font-medium text-[#027eb5] shadow-sm">Accept</span>
        <span className="rounded-lg bg-surface py-2 text-center text-[13px] font-medium text-[#027eb5] shadow-sm">Decline</span>
      </div>
    </div>
  );
}
