"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { CircleCheck, Download, FileSpreadsheet, LoaderCircle } from "lucide-react";
import { postJson } from "@/lib/client";
import { extractGuestRows } from "@/lib/guest-import";
import type { InviteSummary } from "@/lib/rsvp";

export function describeInviteSummary(s: InviteSummary, skippedRows = 0) {
  const parts: string[] = [];
  if (s.invalid) parts.push(`${s.invalid} number${s.invalid === 1 ? "" : "s"} need checking`);
  if (s.failed) parts.push(`${s.failed} didn't send yet — use "Retry" below`);
  if (s.duplicates) parts.push(`${s.duplicates} already on your list, skipped`);
  if (skippedRows) parts.push(`${skippedRows} row${skippedRows === 1 ? "" : "s"} missing a name or number, skipped`);
  return {
    headline: s.sent
      ? `${s.sent} invitation${s.sent === 1 ? "" : "s"} on their way 🎉`
      : s.added
        ? `Added ${s.added} guest${s.added === 1 ? "" : "s"}`
        : "No new guests added",
    details: parts.join(" · "),
  };
}

// Reads the spreadsheet in the browser, so the server only ever receives plain rows.
async function readGuestFile(file: File) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/browser");
    return extractGuestRows(await readSheet(file));
  }
  if (lower.endsWith(".csv")) {
    const parsed = Papa.parse<string[]>((await file.text()).replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
    return extractGuestRows(parsed.data);
  }
  throw new Error(
    lower.endsWith(".xls")
      ? "That's an older Excel format (.xls). In Excel choose File → Save As → Excel Workbook (.xlsx), then upload again."
      : "Please upload an Excel file (.xlsx). CSV files work too.",
  );
}

export default function GuestUploader({ eventId, onUploaded }: { eventId: string; onUploaded: () => void }) {
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
      const { rows, skipped } = await readGuestFile(file);
      if (rows.length === 0) throw new Error("We couldn't find any guests in that file. Each row needs a name and a mobile number.");

      const res = await postJson<InviteSummary>(`/api/events/${eventId}/guests`, { rows });
      if (!res.ok) throw new Error(res.error);
      setResult(describeInviteSummary(res.data, skipped));
      onUploaded();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "We couldn't read that file. Try saving it again as .xlsx.");
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
        <p className="mt-3 font-medium">{busy ? "Sending invitations…" : "Drop your Excel guest list here, or click to choose"}</p>
        <p className="mt-1 text-xs text-muted">
          Two columns: <span className="font-medium">Name</span> and <span className="font-medium">Mobile number</span>. Local numbers like
          05… are fine, and guests already on your list are skipped.
        </p>
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
        <a href="/guest-list-template.xlsx" download className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-pine">
          <Download size={13} /> Download the Excel template
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
