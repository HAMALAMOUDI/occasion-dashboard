"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clapperboard } from "lucide-react";
import ClipPlayer, { DownloadClipButton } from "./ClipPlayer";
import { useT } from "./I18nProvider";
import { requestJson } from "@/lib/client";
import { clipTextForEvent } from "@/lib/clips/content";
import type { ClipNames, Event } from "@/lib/types";

const EMPTY_NAMES: ClipNames = { a: "", b: "", line: "" };

// The event's animated invitation: play it, download it as a video, change or remove it.
// Cards that feature names (the royal style) also get a names editor with a live preview.
export default function ClipPanel({ event, onChange }: { event: Event; onChange: () => void }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [names, setNames] = useState<ClipNames>(event.clip?.names ?? EMPTY_NAMES);
  const [status, setStatus] = useState<{ kind: "idle" } | { kind: "saved" } | { kind: "error"; msg: string }>({ kind: "idle" });

  async function remove() {
    setBusy(true);
    await requestJson("PATCH", `/api/events/${event.id}`, { clip: null });
    setBusy(false);
    onChange();
  }

  async function saveNames(e: React.FormEvent) {
    e.preventDefault();
    if (!event.clip) return;
    setBusy(true);
    const res = await requestJson("PATCH", `/api/events/${event.id}`, {
      clip: { style: event.clip.style, names: names.a.trim() ? names : null },
    });
    setBusy(false);
    setStatus(res.ok ? { kind: "saved" } : { kind: "error", msg: res.error });
    if (res.ok) onChange();
  }

  const set = (k: keyof ClipNames) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setNames((n) => ({ ...n, [k]: e.target.value }));
    setStatus({ kind: "idle" });
  };

  const hasNames = event.clip?.style === "royal" || event.clip?.style === "palace";
  // While editing, the preview shows the names as typed.
  const text = event.clip ? clipTextForEvent(event, hasNames && names.a.trim() ? names : undefined) : null;
  const ar = event.language === "ar";

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 p-5 pb-3">
        <Clapperboard size={17} className="text-brass" />
        <h3 className="font-medium">{t.clips.panelTitle}</h3>
      </div>
      {event.clip && text ? (
        <>
          <ClipPlayer
            spec={{ style: event.clip.style, occasion: event.occasionType, text }}
            label={`${t.clips.styles[event.clip.style]} — ${event.name}`}
          />
          <div className="flex flex-wrap items-center gap-2 p-4">
            <DownloadClipButton
              spec={{ style: event.clip.style, occasion: event.occasionType, text }}
              filename={`hikayati-${event.eventDate}-${event.clip.style}`}
            />
            <Link href={`/designs/animated?event=${event.id}`} className="btn-secondary btn-sm">
              {t.clips.change}
            </Link>
            <button onClick={remove} disabled={busy} className="btn btn-sm text-decline hover:bg-decline-bg">
              {t.clips.remove}
            </button>
          </div>
          <p className="px-4 pb-4 -mt-2 text-xs text-muted">{t.clips.styles[event.clip.style]}</p>
          {hasNames && (
            <form onSubmit={saveNames} className="border-t border-line p-4 space-y-3">
              <h4 className="text-sm font-medium">{t.clips.namesTitle}</h4>
              <div>
                <label htmlFor="clip-line" className="label">
                  {t.clips.nameLine}
                </label>
                <input id="clip-line" value={names.line} onChange={set("line")} maxLength={60} placeholder={t.clips.nameLineHint} dir={ar ? "rtl" : "ltr"} className="input" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="clip-name-a" className="label">
                    {t.clips.nameA}
                  </label>
                  <input id="clip-name-a" value={names.a} onChange={set("a")} maxLength={60} dir={ar ? "rtl" : "ltr"} className="input" />
                </div>
                <div>
                  <label htmlFor="clip-name-b" className="label">
                    {t.clips.nameB}
                  </label>
                  <input id="clip-name-b" value={names.b} onChange={set("b")} maxLength={60} dir={ar ? "rtl" : "ltr"} className="input" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={busy} className="btn-primary btn-sm">
                  {t.clips.saveNames}
                </button>
                {status.kind === "saved" && (
                  <span className="inline-flex items-center gap-1 text-xs text-accept">
                    <Check size={13} /> {t.clips.namesSaved}
                  </span>
                )}
                {status.kind === "error" && <span className="text-xs text-decline">{status.msg}</span>}
              </div>
            </form>
          )}
        </>
      ) : (
        <div className="px-5 pb-5">
          <p className="text-xs text-muted">{t.clips.panelEmpty}</p>
          <Link href={`/designs/animated?event=${event.id}`} className="btn-secondary btn-sm mt-3">
            {t.clips.add}
          </Link>
        </div>
      )}
    </div>
  );
}
