"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BillingRecord } from "@/lib/types";

type Row = BillingRecord & { eventName: string };

export default function BillingOverviewPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  const totalDue = rows.reduce((sum, r) => sum + r.conversationsUsed * r.ratePerConversation, 0);

  return (
    <div>
      <h1 className="font-serif text-2xl mb-1">Billing</h1>
      <p className="text-sm text-ink/60 mb-6">
        WhatsApp conversation costs and invoice status across every event.
      </p>

      <div className="border border-line rounded-lg p-4 mb-6">
        <p className="text-xs text-ink/60 mb-1">Total across all events</p>
        <p className="font-serif text-2xl">{totalDue.toFixed(2)} SAR</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink/60">No billing records yet.</p>
      ) : (
        <div className="border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-line/30 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Event</th>
                <th className="px-4 py-2 font-medium">Conversations</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-2.5">
                    <Link href={`/events/${r.eventId}`} className="underline">
                      {r.eventName}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{r.conversationsUsed}</td>
                  <td className="px-4 py-2.5">{(r.conversationsUsed * r.ratePerConversation).toFixed(2)} SAR</td>
                  <td className="px-4 py-2.5 capitalize">{r.invoiceStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
