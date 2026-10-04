"use client";

import { BillingRecord } from "@/lib/types";
import { useState } from "react";
import { postJson } from "@/lib/client";

export default function BillingPanel({ billing, onChange }: { billing: BillingRecord; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = billing.conversationsUsed * billing.ratePerConversation;

  async function issueInvoice() {
    setBusy(true);
    setError(null);
    const result = await postJson(`/api/events/${billing.eventId}/billing`);
    setBusy(false);
    if (!result.ok) setError(result.error);
    onChange();
  }

  return (
    <div className="border border-line rounded-lg p-4">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-ink/60 mb-1">Conversations used</p>
          <p className="font-serif text-xl">{billing.conversationsUsed}</p>
        </div>
        <div>
          <p className="text-xs text-ink/60 mb-1">Rate per conversation</p>
          <p className="font-serif text-xl">{billing.ratePerConversation.toFixed(2)} SAR</p>
        </div>
        <div>
          <p className="text-xs text-ink/60 mb-1">Estimated total</p>
          <p className="font-serif text-xl">{total.toFixed(2)} SAR</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-line pt-3">
        <p className="text-sm">
          Invoice status: <span className="font-medium capitalize">{billing.invoiceStatus}</span>
          {billing.issuedAt && (
            <span className="text-ink/60"> — issued {new Date(billing.issuedAt).toLocaleDateString()}</span>
          )}
        </p>
        {billing.invoiceStatus === "draft" && (
          <button
            onClick={issueInvoice}
            disabled={busy}
            className="text-sm px-3 py-1.5 rounded-md border border-line hover:bg-line/30 disabled:opacity-50"
          >
            {busy ? "Issuing…" : "Issue invoice"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-decline mt-2">{error}</p>}
      <p className="text-xs text-ink/50 mt-3">
        Issuing here stands in for pushing a ZATCA-compliant (Fatoora) e-invoice — wire that up before going live with real organizers.
      </p>
    </div>
  );
}
