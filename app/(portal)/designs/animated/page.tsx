"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import ClipPlayer, { DownloadClipButton } from "@/components/ClipPlayer";
import DesignTabs from "@/components/designs/DesignTabs";
import { useLocale, useT } from "@/components/I18nProvider";
import { requestJson } from "@/lib/client";
import { clipSampleText, clipTextForEvent } from "@/lib/clips/content";
import { RECOMMENDED_STYLES, type ClipStyle } from "@/lib/clips/themes";
import { OCCASIONS, isOccasionType, occasion, type OccasionType } from "@/lib/occasions";
import type { Event } from "@/lib/types";

function Animated() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const targetId = params.get("event");
  const [events, setEvents] = useState<Event[]>([]);
  const target = events.find((e) => e.id === targetId) ?? null;
  const [picked, setPicked] = useState<OccasionType | null>(() => {
    const o = params.get("occasion");
    return isOccasionType(o) ? o : null;
  });
  const occ: OccasionType = picked ?? target?.occasionType ?? "wedding";
  const [eventId, setEventId] = useState(targetId ?? "");
  const [busy, setBusy] = useState<ClipStyle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : []))
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const chosen = events.find((e) => e.id === (eventId || targetId)) ?? null;
  // Show the chosen event's own words when it matches the occasion on screen; otherwise sample wording.
  const text = chosen && chosen.occasionType === occ ? clipTextForEvent(chosen) : clipSampleText(occ, chosen?.language ?? locale);

  async function use(style: ClipStyle) {
    if (!chosen) return;
    setBusy(style);
    setError(null);
    const res = await requestJson("PATCH", `/api/events/${chosen.id}`, { clip: { style, names: chosen.clip?.names } });
    setBusy(null);
    if (!res.ok) setError(res.error);
    else router.push(`/events/${chosen.id}`);
  }

  return (
    <div className="animate-fade-up">
      {target && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl bg-pine-soft px-4 py-3 text-sm text-pine">
          <span className="font-medium">{t.clips.choosingFor(target.name)}</span>
          <Link href={`/events/${target.id}`} className="inline-flex items-center gap-1 text-xs hover:underline">
            <X size={14} /> {t.designs.cancel}
          </Link>
        </div>
      )}
      <DesignTabs />
      <p className="text-muted">{t.clips.eyebrow}</p>
      <h1 className="font-serif text-3xl sm:text-4xl mt-1">{t.clips.title}</h1>
      <p className="text-muted mt-2 mb-6 max-w-2xl">{t.clips.subtitle}</p>

      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 mb-6 [scrollbar-width:none]" role="tablist">
        {OCCASIONS.map((o) => (
          <button
            key={o.id}
            role="tab"
            aria-selected={occ === o.id}
            onClick={() => setPicked(o.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              occ === o.id ? "bg-ink text-white" : "bg-surface border border-line text-muted hover:text-ink"
            }`}
          >
            {o.emoji} {o.label[locale]}
          </button>
        ))}
      </div>

      {events.length > 0 && !target && (
        <div className="mb-6 max-w-sm">
          <label htmlFor="clip-event" className="label">
            {t.clips.useFor}
          </label>
          <select id="clip-event" value={eventId} onChange={(e) => setEventId(e.target.value)} className="input">
            <option value="">{t.clips.pickEvent}</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {occasion(e.occasionType).emoji} {e.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && <p className="mb-4 rounded-xl bg-decline-bg px-4 py-3 text-sm text-decline">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {RECOMMENDED_STYLES[occ].map((style, i) => {
          const inUse = chosen?.clip?.style === style && chosen.occasionType === occ;
          return (
            <section key={`${occ}-${style}`} className={`card overflow-hidden ${i === 0 ? "ring-2 ring-pine/30" : ""}`}>
              <ClipPlayer
                spec={{ style, occasion: occ, text }}
                label={`${t.clips.styles[style]} — ${occasion(occ).label[locale]}`}
                autoPlay={i === 0}
              />
              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-serif text-xl">{t.clips.styles[style]}</h2>
                  {inUse ? (
                    <span className="rounded-full bg-accept-bg px-2.5 py-0.5 text-xs font-medium text-accept">{t.clips.inUse}</span>
                  ) : (
                    i === 0 && <span className="rounded-full bg-pine-soft px-2.5 py-0.5 text-xs font-medium text-pine">{t.clips.bestMatch}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{t.clips.styleHints[style]}</p>
                {!(chosen && chosen.occasionType === occ) && <p className="mt-2 text-xs text-muted">{t.clips.sample}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {chosen && (
                    <button onClick={() => use(style)} disabled={busy !== null} className="btn-primary btn-sm">
                      {t.clips.use}
                    </button>
                  )}
                  <DownloadClipButton spec={{ style, occasion: occ, text }} filename={`hikayati-${occ}-${style}`} />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function AnimatedPage() {
  return (
    <Suspense>
      <Animated />
    </Suspense>
  );
}
