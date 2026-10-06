"use client";

import { Stats } from "@/lib/types";
import { CircleCheck, CircleX, Clock, PhoneOff, Send } from "lucide-react";
import { useT } from "./I18nProvider";

export default function StatsGrid({ stats, rsvp = true }: { stats: Stats; rsvp?: boolean }) {
  const t = useT();
  const pct = (n: number) => (stats.total ? Math.round((n / stats.total) * 100) : 0);
  // Announcements count deliveries; everything else counts replies. Stats.pending
  // includes both "not sent" and "sent, no reply", which for announcements means "notified".
  const cells = rsvp
    ? [
        { label: t.status.accepted, value: stats.accepted, icon: CircleCheck, bg: "bg-accept-bg", text: "text-accept" },
        { label: t.status.declined, value: stats.declined, icon: CircleX, bg: "bg-decline-bg", text: "text-decline" },
        { label: t.status.no_response, value: stats.pending, icon: Clock, bg: "bg-pending-bg", text: "text-pending" },
        { label: t.status.invalid, value: stats.invalid, icon: PhoneOff, bg: "bg-invalid-bg", text: "text-invalid" },
      ]
    : [
        { label: t.stats.notified, value: stats.pending - stats.notSent, icon: Send, bg: "bg-accept-bg", text: "text-accept" },
        { label: t.stats.numberIssue, value: stats.invalid, icon: PhoneOff, bg: "bg-invalid-bg", text: "text-invalid" },
      ];

  return (
    <div className={`grid grid-cols-2 gap-3 ${rsvp ? "lg:grid-cols-4" : ""}`}>
      {cells.map(({ label, value, icon: Icon, bg, text }) => (
        <div key={label} className="card p-4">
          <div className="flex items-center justify-between">
            <span className={`grid h-8 w-8 place-items-center rounded-full ${bg} ${text}`}>
              <Icon size={16} className="rtl:-scale-x-100" />
            </span>
            {stats.total > 0 && <span className="text-xs text-muted">{pct(value)}%</span>}
          </div>
          <p className="font-serif text-3xl mt-3">{value}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}
