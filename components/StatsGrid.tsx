"use client";

import { Stats } from "@/lib/types";
import { CircleCheck, CircleX, Clock, PhoneOff, Send } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/i18n";
import { useLocale, useT } from "./I18nProvider";

// Whole percentages that add up to 100 (largest remainder), so 750/250/750/250
// reads 38/12/38/12, not 38/13/38/13 = 102%.
function percentages(values: number[], total: number) {
  if (!total) return values.map(() => 0);
  const exact = values.map((v) => (v / total) * 100);
  const result = exact.map(Math.floor);
  const target = Math.round(exact.reduce((a, b) => a + b, 0));
  const missing = target - result.reduce((a, b) => a + b, 0);
  // Ties go to the larger count, so a bigger group never shows a smaller percentage.
  const byRemainder = exact.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0] || values[b[1]] - values[a[1]]);
  for (let k = 0; k < missing; k++) result[byRemainder[k][1]]++;
  return result;
}

export default function StatsGrid({ stats, rsvp = true }: { stats: Stats; rsvp?: boolean }) {
  const t = useT();
  const locale = useLocale();
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
        { label: t.stats.notified, value: stats.pending - stats.notSent, icon: Send, bg: "bg-accept-bg", text: "text-accept", mirror: true },
        { label: t.stats.numberIssue, value: stats.invalid, icon: PhoneOff, bg: "bg-invalid-bg", text: "text-invalid" },
      ];
  // Announcements' cells leave out "not sent yet", so it joins the rounding as a hidden share.
  const pcts = percentages([...cells.map((c) => c.value), ...(rsvp ? [] : [stats.notSent])], stats.total);

  return (
    // A description list, so screen readers hear "Coming: 2, 20%" rather than "20%, 2, Coming".
    <dl className={`grid grid-cols-2 gap-3 ${rsvp ? "lg:grid-cols-4" : ""}`}>
      {cells.map(({ label, value, icon: Icon, bg, text, mirror }, i) => (
        <div key={label} className="card flex flex-col p-4">
          <dt className="order-last text-sm text-muted">{label}</dt>
          {/* Read as value then share; shown as icon and share above the value. */}
          <dd className="flex flex-col-reverse">
            <span className="mt-3 font-serif text-3xl tabular-nums">{formatNumber(value, locale)}</span>
            <span className="flex items-center justify-between">
              <span className={`grid h-8 w-8 place-items-center rounded-full ${bg} ${text}`} aria-hidden>
                {/* Only directional icons mirror in Arabic; a clock or a check never does. */}
                <Icon size={16} className={mirror ? "rtl:-scale-x-100" : undefined} />
              </span>
              {stats.total > 0 && <span className="text-xs text-muted tabular-nums">{formatPercent(pcts[i], locale)}</span>}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
