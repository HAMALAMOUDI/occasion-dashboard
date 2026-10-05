"use client";

import { useRef, useState } from "react";
import { CircleCheck, Download, FileUp, LoaderCircle } from "lucide-react";
import { postJson } from "@/lib/client";
import type { InviteSummary } from "@/lib/rsvp";

const SAMPLE_CSV = "name,phone\nLayla Al-Otaibi,0501234567\nFaisal Al-Harbi,+966507654321\n";

function describe(s: InviteSummary) {
  const parts: string[] = [];
  if (s.invalid) parts.push(`${s.invalid} number${s.invalid === 1 ? "" : "s"} need checking`);
  if (s.failed) parts.push(`${s.failed} didn't send yet — use "Retry" below`);
  if (s.duplicates) parts.push(`${s.duplicates} already on your list, skipped`);
  return {
    headline: s.sent ? `${s.sent} invitation${s.sent === 1 ? "" : "s"} on their way 🎉` : s.added ? `Added ${s.added} guests` : "No new guests added",
    details: parts.join(" · "),
  };
}

export default function CsvUploader({ eventId, onUploaded }: { eventId: string; onUploaded: () => void }) {
  const [result, setResult] = useState<{ headline: string; details: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);

    const res = await postJson<InviteSummary>(`/api/events/${eventId}/guests`, { csv: await file.text() });
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult(describe(res.data));
    onUploaded();
  }

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !busy) handleFile(file);
        }}
        className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragging ? "border-pine bg-pine-soft" : "border-line bg-surface hover:border-pine/40 hover:bg-pine-soft/40"
        } ${busy ? "pointer-events-none opacity-70" : ""}`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-pine-soft text-pine">
          {busy ? <LoaderCircle size={20} className="animate-spin" /> : <FileUp size={20} />}
        </span>
        <p className="mt-3 font-medium">{busy ? "Sending invitations…" : "Drop your guest list here, or click to choose"}</p>
        <p className="mt-1 text-xs text-muted">
          A CSV file with <span className="font-mono">name</span> and <span className="font-mono">phone</span> columns. Local numbers like
          05… are fine — duplicates are skipped automatically.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>

      <div className="mt-2 flex justify-end">
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`}
          download="guest-list-template.csv"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-pine"
        >
          <Download size={13} /> Download a template
        </a>
      </div>

      {result && (
        <div className="mt-3 flex gap-3 rounded-xl bg-accept-bg px-4 py-3 text-sm animate-fade-up">
          <CircleCheck size={18} className="mt-0.5 shrink-0 text-accept" />
          <div>
            <p className="font-medium text-accept">{result.headline}</p>
            {result.details && <p className="text-xs text-ink/70 mt-0.5">{result.details}</p>}
          </div>
        </div>
      )}
      {error && <p className="mt-3 rounded-xl bg-decline-bg px-4 py-3 text-sm text-decline">{error}</p>}
    </div>
  );
}
