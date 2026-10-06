"use client";

import { GuestStatus } from "@/lib/types";
import { useT } from "./I18nProvider";

const STYLES: Record<GuestStatus, { bg: string; text: string; dot: string }> = {
  accepted: { bg: "bg-accept-bg", text: "text-accept", dot: "bg-accept" },
  declined: { bg: "bg-decline-bg", text: "text-decline", dot: "bg-decline" },
  pending: { bg: "bg-pending-bg", text: "text-pending", dot: "bg-pending" },
  no_response: { bg: "bg-pending-bg", text: "text-pending", dot: "bg-pending" },
  invalid: { bg: "bg-invalid-bg", text: "text-invalid", dot: "bg-invalid" },
};

// `rsvp: false` (condolences): a sent message means "Notified", not "Waiting to hear".
export default function StatusBadge({ status, rsvp = true }: { status: GuestStatus; rsvp?: boolean }) {
  const t = useT();
  const s = rsvp ? STYLES[status] : status === "no_response" ? STYLES.accepted : STYLES[status];
  const label = !rsvp && status in t.statusNoRsvp ? t.statusNoRsvp[status as keyof typeof t.statusNoRsvp] : t.status[status];
  return (
    <span className={`${s.bg} ${s.text} inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}
