"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, MessageCircle, ReceiptText, Wallet } from "lucide-react";
import { BillingRecord } from "@/lib/types";
import { formatSar } from "@/lib/client";

type Row = BillingRecord & { eventName: string };

const STATUS_STYLE: Record<BillingRecord["invoiceStatus"], string> = {
  draft: "bg-paper text-muted",
  issued: "bg-brass-soft text-[#8a6326]",
  paid: "bg-accept-bg text-accept",
};

export default function BillingOverviewPage() {
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
      <p className="text-muted">Billing</p>
      <h1 className="font-serif text-3xl sm:text-4xl mt-1">What your invitations cost</h1>
      <p className="text-muted mt-2 mb-8 max-w-xl">
        You only pay for the WhatsApp conversations your events actually use — invites, reminders, and entry passes.
      </p>

      <div className="grid gap-3 sm:grid-cols-3 mb-10">
        {[
          { label: "Total across all events", value: formatSar(totalDue), icon: Wallet },
          { label: "Not yet invoiced", value: formatSar(unbilled), icon: ReceiptText },
          { label: "WhatsApp conversations", value: conversations.toLocaleString(), icon: MessageCircle },
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

      <h2 className="eyebrow mb-3">By event</h2>
      {rows === null ? (
        <div className="h-40 animate-pulse rounded-2xl bg-line/60" />
      ) : list.length === 0 ? (
        <div className="card px-6 py-10 text-center text-muted">Nothing to bill yet — costs appear here once invitations go out.</div>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {list.map((r) => (
            <li key={r.id}>
              <Link href={`/events/${r.eventId}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-paper">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{r.eventName}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {r.conversationsUsed} conversation{r.conversationsUsed === 1 ? "" : "s"}
                  </p>
                </div>
                <span className={`hidden sm:inline rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLE[r.invoiceStatus]}`}>
                  {r.invoiceStatus}
                </span>
                <span className="font-medium tabular-nums">{formatSar(cost(r))}</span>
                <ChevronRight size={16} className="text-ink/30" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
