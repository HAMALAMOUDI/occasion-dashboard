"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, MessageCircle, ReceiptText, Wallet } from "lucide-react";
import { BillingRecord } from "@/lib/types";
import { formatNumber, formatSar } from "@/lib/i18n";
import { useLocale, useT } from "@/components/I18nProvider";
import { INVOICE_STYLE } from "@/components/BillingPanel";

type Row = BillingRecord & { eventName: string };

export default function BillingOverviewPage() {
  const t = useT();
  const locale = useLocale();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  const list = rows ?? [];
  const cost = (r: Row) => r.conversationsUsed * r.ratePerConversation;
  const totalDue = list.reduce((sum, r) => sum + cost(r), 0);
  const conversations = list.reduce((sum, r) => sum + r.conversationsUsed, 0);
  const unbilled = list.filter((r) => r.invoiceStatus === "draft").reduce((sum, r) => sum + cost(r), 0);

  return (
    <div className="animate-fade-up">
      <p className="text-muted">{t.billing.eyebrow}</p>
      <h1 className="font-serif text-3xl sm:text-4xl mt-1">{t.billing.title}</h1>
      <p className="text-muted mt-2 mb-8 max-w-xl">{t.billing.subtitle}</p>

      <div className="grid gap-3 sm:grid-cols-3 mb-10">
        {[
          { label: t.billing.total, value: formatSar(totalDue, locale), icon: Wallet },
          { label: t.billing.notInvoiced, value: formatSar(unbilled, locale), icon: ReceiptText },
          { label: t.billing.conversationsTotal, value: formatNumber(conversations, locale), icon: MessageCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brass-soft text-brass">
              <Icon size={16} />
            </span>
            <p className="font-serif text-2xl mt-3">{rows ? value : "—"}</p>
            <p className="text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="eyebrow mb-3">{t.billing.byEvent}</h2>
      {rows === null ? (
        <div className="h-40 animate-pulse rounded-2xl bg-line/60" />
      ) : list.length === 0 ? (
        <div className="card px-6 py-10 text-center text-muted">{t.billing.empty}</div>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {list.map((r) => (
            <li key={r.id}>
              <Link href={`/events/${r.eventId}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-paper">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{r.eventName}</p>
                  <p className="text-xs text-muted mt-0.5">{t.billing.conversationCount(r.conversationsUsed)}</p>
                </div>
                <span className={`hidden sm:inline rounded-full px-2.5 py-1 text-xs font-medium ${INVOICE_STYLE[r.invoiceStatus]}`}>
                  {t.billing.status[r.invoiceStatus]}
                </span>
                <span className="font-medium tabular-nums">{formatSar(cost(r), locale)}</span>
                <ChevronRight size={16} className="text-ink/30 rtl:rotate-180" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
