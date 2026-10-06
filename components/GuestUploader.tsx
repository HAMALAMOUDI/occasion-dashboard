"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { CircleCheck, Download, FileSpreadsheet, LoaderCircle } from "lucide-react";
import { postJson } from "@/lib/client";
import { extractGuestRows } from "@/lib/guest-import";
import type { Messages } from "@/lib/messages";
import type { InviteSummary } from "@/lib/rsvp";
import { useLocale, useT } from "./I18nProvider";

function describeInviteSummary(t: Messages["upload"], s: InviteSummary, skippedRows: number, festive: boolean) {
  const parts: string[] = [];
  if (s.invalid) parts.push(t.needChecking(s.invalid));
  if (s.failed) parts.push(t.didntSend(s.failed));
  if (s.duplicates) parts.push(t.duplicates(s.duplicates));
  if (skippedRows) parts.push(t.missing(skippedRows));
  return {
    headline: s.sent ? t.sent(s.sent, festive) : s.added ? t.added(s.added) : t.noneAdded,
    details: parts.join(" · "),
  };
}

// Reads the spreadsheet in the browser, so the server only ever receives plain rows.
async function readGuestFile(file: File, t: Messages["upload"]) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/browser");
    return extractGuestRows(await readSheet(file));
  }
  if (lower.endsWith(".csv")) {
    const parsed = Papa.parse<string[]>((await file.text()).replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
    return extractGuestRows(parsed.data);
  }
  throw new Error(lower.endsWith(".xls") ? t.xls : t.wrongType);
}

export default function GuestUploader({ eventId, festive, onUploaded }: { eventId: string; festive: boolean; onUploaded: () => void }) {
  const t = useT().upload;
  const locale = useLocale();
  const [result, setResult] = useState<{ headline: string; details: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const { rows, skipped } = await readGuestFile(file, t);
      if (rows.length === 0) throw new Error(t.noGuests);

      const res = await postJson<InviteSummary>(`/api/events/${eventId}/guests`, { rows });
      if (!res.ok) throw new Error(res.error);
      setResult(describeInviteSummary(t, res.data, skipped, festive));
      onUploaded();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t.unreadable);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
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
        className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-7 text-center transition ${
          dragging ? "border-pine bg-pine-soft" : "border-line bg-surface hover:border-pine/40 hover:bg-pine-soft/40"
        } ${busy ? "pointer-events-none opacity-70" : ""}`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-pine-soft text-pine">
          {busy ? <LoaderCircle size={20} className="animate-spin" /> : <FileSpreadsheet size={20} />}
        </span>
        <p className="mt-3 font-medium">{busy ? t.sending : t.drop}</p>
        <p className="mt-1 text-xs text-muted">{t.help}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
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
          href={locale === "ar" ? "/guest-list-template-ar.xlsx" : "/guest-list-template.xlsx"}
          download
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-pine"
        >
          <Download size={13} /> {t.template}
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
