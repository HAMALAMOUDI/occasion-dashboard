"use client";

import { BillingRecord } from "@/lib/types";
import { useState } from "react";
import { ReceiptText } from "lucide-react";
import { postJson } from "@/lib/client";
import { formatDateTime, formatSar } from "@/lib/i18n";
import { useLocale, useT } from "./I18nProvider";

export const INVOICE_STYLE: Record<BillingRecord["invoiceStatus"], string> = {
  draft: "bg-paper text-muted",
  issued: "bg-brass-soft text-[#8a6326]",
  paid: "bg-accept-bg text-accept",
};

export default function BillingPanel({ billing, onChange }: { billing: BillingRecord; onChange: () => void }) {
  const t = useT();
  const locale = useLocale();
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
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ReceiptText size={17} className="text-brass" />
          <h3 className="font-medium">{t.billing.costSoFar}</h3>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${INVOICE_STYLE[billing.invoiceStatus]}`}>
          {t.billing.status[billing.invoiceStatus]}
        </span>
      </div>

      <p className="font-serif text-3xl mt-4">{formatSar(total, locale)}</p>
      <p className="text-xs text-muted mt-1">{t.billing.conversations(billing.conversationsUsed, formatSar(billing.ratePerConversation, locale))}</p>

      {billing.invoiceStatus === "draft" ? (
        <button onClick={issueInvoice} disabled={busy} className="btn-secondary btn-md mt-4 w-full">
          {busy ? t.billing.issuing : t.billing.issue}
        </button>
      ) : (
        billing.issuedAt && <p className="text-xs text-muted mt-4">{t.billing.issuedOn(formatDateTime(billing.issuedAt, locale))}</p>
      )}
      {error && <p className="text-xs text-decline mt-2">{error}</p>}
    </div>
  );
}
