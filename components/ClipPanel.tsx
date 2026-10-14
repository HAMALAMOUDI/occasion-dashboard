"use client";

import { useState } from "react";
import Link from "next/link";
import { Clapperboard } from "lucide-react";
import ClipPlayer, { DownloadClipButton } from "./ClipPlayer";
import { useT } from "./I18nProvider";
import { requestJson } from "@/lib/client";
import { clipTextForEvent } from "@/lib/clips/content";
import type { Event } from "@/lib/types";

// The event's animated invitation: play it, download it as a video, change or remove it.
export default function ClipPanel({ event, onChange }: { event: Event; onChange: () => void }) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await requestJson("PATCH", `/api/events/${event.id}`, { clip: null });
    setBusy(false);
    onChange();
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 p-5 pb-3">
        <Clapperboard size={17} className="text-brass" />
        <h3 className="font-medium">{t.clips.panelTitle}</h3>
      </div>
      {event.clip ? (
        <>
          <ClipPlayer
            spec={{ style: event.clip.style, occasion: event.occasionType, text: clipTextForEvent(event) }}
            label={`${t.clips.styles[event.clip.style]} — ${event.name}`}
          />
          <div className="flex flex-wrap items-center gap-2 p-4">
            <DownloadClipButton
              spec={{ style: event.clip.style, occasion: event.occasionType, text: clipTextForEvent(event) }}
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
