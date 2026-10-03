"use client";

import { useRef, useState } from "react";

export default function CsvUploader({ eventId, onUploaded }: { eventId: string; onUploaded: () => void }) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setStatus(null);
    const csv = await file.text();

    const res = await fetch(`/api/events/${eventId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });

    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }

    setStatus(`Added ${data.added} guests — ${data.sent} invites sent, ${data.invalid} invalid numbers.`);
    onUploaded();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="border border-dashed border-line rounded-lg p-4">
      <label className="block text-sm font-medium mb-1">Guest list CSV</label>
      <p className="text-xs text-ink/60 mb-3">Columns: name, phone. Each row sends an invite immediately.</p>
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
