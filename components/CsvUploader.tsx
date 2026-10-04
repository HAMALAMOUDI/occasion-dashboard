"use client";

import { useRef, useState } from "react";
import { postJson } from "@/lib/client";
import type { InviteSummary } from "@/lib/rsvp";

function describe(s: InviteSummary) {
  const parts = [`Added ${s.added} guests — ${s.sent} invites sent`];
  if (s.invalid) parts.push(`${s.invalid} invalid numbers`);
  if (s.failed) parts.push(`${s.failed} failed to send (retry below)`);
  if (s.duplicates) parts.push(`${s.duplicates} duplicates skipped`);
  return parts.join(", ") + ".";
}

export default function CsvUploader({ eventId, onUploaded }: { eventId: string; onUploaded: () => void }) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setStatus(null);

    const result = await postJson<InviteSummary>(`/api/events/${eventId}/guests`, { csv: await file.text() });
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus(describe(result.data));
    onUploaded();
  }

  return (
    <div className="border border-dashed border-line rounded-lg p-4">
      <label className="block text-sm font-medium mb-1">Guest list CSV</label>
      <p className="text-xs text-ink/60 mb-3">
        Columns: name, phone. Local numbers (05…) are converted to international format, duplicates are skipped, and
        each new guest gets an invite immediately.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="text-sm"
      />
      {busy && <p className="text-xs text-ink/60 mt-2">Uploading and sending invites…</p>}
      {status && <p className="text-xs text-accept mt-2">{status}</p>}
      {error && <p className="text-xs text-decline mt-2">{error}</p>}
    </div>
  );
}
