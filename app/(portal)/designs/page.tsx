"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X } from "lucide-react";
import DesignFrame from "@/components/DesignFrame";
import DesignTabs from "@/components/designs/DesignTabs";
import { designSrc } from "@/lib/designs/urls";
import { useLocale, useT } from "@/components/I18nProvider";
import {
  CATEGORIES_FOR_OCCASION,
  CATEGORY_LABELS,
  DESIGN_CATEGORIES,
  DESIGN_STYLES,
  LAYOUT_NAMES,
  defaultPaletteIndex,
  isDesignCategory,
  palettesFor,
  type DesignCategory,
  type DesignStyle,
} from "@/lib/designs/catalog";
import { occasion } from "@/lib/occasions";
import type { Event } from "@/lib/types";

const TOTAL = DESIGN_STYLES.length * DESIGN_CATEGORIES.length * 20;
const layoutLabel = (n: number, name: string) => `${String(n).padStart(2, "0")} · ${name}`;

function Gallery() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const targetId = params.get("event");

  const [events, setEvents] = useState<Event[]>([]);
  const target = events.find((e) => e.id === targetId) ?? null;
  // Explicit pick, else the URL, else the category that suits the event being designed for.
  const [picked, setCategory] = useState<DesignCategory | null>(() => {
    const c = params.get("category");
    return isDesignCategory(c) ? c : null;
  });
  const category: DesignCategory = picked ?? (target && CATEGORIES_FOR_OCCASION[target.occasionType][0]) ?? "wedding";
  const [style, setStyle] = useState<DesignStyle>(params.get("style") === "modern" ? "modern" : "classic");
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Event[]) => setEvents(list.filter((e) => occasion(e.occasionType).rsvp)))
      .catch(() => setEvents([]));
  }, []);

  const names = LAYOUT_NAMES[style];

  return (
    <div className="animate-fade-up">
      {target && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl bg-pine-soft px-4 py-3 text-sm text-pine">
          <span className="font-medium">{t.designs.choosingFor(target.name)}</span>
          <Link href={`/events/${target.id}`} className="inline-flex items-center gap-1 text-xs hover:underline">
            <X size={14} /> {t.designs.cancel}
          </Link>
        </div>
      )}

      <DesignTabs />
      <p className="text-muted">{t.designs.eyebrow}</p>
      <h1 className="font-serif text-3xl sm:text-4xl mt-1">{t.designs.title}</h1>
      <p className="text-muted mt-2 mb-6 max-w-2xl">{t.designs.subtitle(TOTAL)}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 [scrollbar-width:none]" role="tablist">
          {DESIGN_CATEGORIES.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                category === c ? "bg-ink text-white" : "bg-surface border border-line text-muted hover:text-ink"
              }`}
            >
              {CATEGORY_LABELS[c][locale]}
            </button>
          ))}
        </div>
        <div className="inline-flex shrink-0 self-start rounded-full border border-line bg-paper p-1" role="radiogroup">
          {DESIGN_STYLES.map((s) => (
            <button
              key={s}
              role="radio"
              aria-checked={style === s}
              onClick={() => setStyle(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${style === s ? "bg-surface text-pine shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {t.designs[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {names.map((name, i) => {
          const n = i + 1;
          const label = layoutLabel(n, name[locale]);
          return (
            <button
              key={`${style}-${category}-${n}`}
              onClick={() => setOpen(n)}
              className="group text-start"
              aria-label={t.designs.preview(label)}
            >
              <DesignFrame
                src={designSrc({ style, category, layout: n })}
                title={label}
                className="rounded-xl shadow-sm ring-1 ring-line transition group-hover:-translate-y-0.5 group-hover:shadow-md"
              />
              <span className="mt-2 block text-sm font-medium text-muted group-hover:text-ink">{label}</span>
            </button>
          );
        })}
      </div>

      {open !== null && (
        <DesignDialog
          style={style}
          category={category}
          layout={open}
          events={events}
          target={target}
          onClose={() => setOpen(null)}
          onUse={(eventId, palette) =>
            router.push(
              `/events/${eventId}/design?${new URLSearchParams({ style, category, layout: String(open), palette: String(palette) })}`
            )
          }
        />
      )}
    </div>
  );
}

function DesignDialog({
  style,
  category,
  layout,
  events,
  target,
  onClose,
  onUse,
}: {
  style: DesignStyle;
  category: DesignCategory;
  layout: number;
  events: Event[];
  target: Event | null;
  onClose: () => void;
  onUse: (eventId: string, palette: number) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const palettes = palettesFor(style, category, layout);
  const [palette, setPalette] = useState(defaultPaletteIndex(style, category, layout));
  const label = layoutLabel(layout, LAYOUT_NAMES[style][layout - 1][locale]);

  const [recommended, others] = useMemo(() => {
    const fits = (e: Event) => CATEGORIES_FOR_OCCASION[e.occasionType].includes(category);
    return [events.filter(fits), events.filter((e) => !fits(e))];
  }, [events, category]);
  const [eventId, setEventId] = useState(target?.id ?? recommended[0]?.id ?? others[0]?.id ?? "");
  const chosen = events.find((e) => e.id === eventId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="card max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-b-none p-5 sm:rounded-2xl sm:p-6 animate-fade-up"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">
              {CATEGORY_LABELS[category][locale]} · {t.designs[style]}
            </p>
            <h2 className="font-serif text-2xl mt-1">{label}</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-paper" aria-label={t.designs.close}>
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-6 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
          <DesignFrame src={designSrc({ style, category, layout, palette })} title={label} className="rounded-xl ring-1 ring-line" />

          <div className="flex flex-col gap-5">
            <div>
              <p className="label">{t.designs.colours}</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.designs.colours}>
                {palettes.map((p, i) => (
                  <button
                    key={i}
                    role="radio"
                    aria-checked={palette === i}
                    aria-label={`${t.designs.colours} ${i + 1}`}
                    onClick={() => setPalette(i)}
                    className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-full ring-offset-2 transition ${
                      palette === i ? "ring-2 ring-pine" : "ring-1 ring-line hover:ring-ink/30"
                    }`}
                    style={{ background: `linear-gradient(135deg, ${p.bg} 0 50%, ${p.accent} 50% 100%)` }}
                  >
                    {palette === i && <Check size={14} strokeWidth={3} style={{ color: p.on }} />}
                  </button>
                ))}
              </div>
            </div>

            {events.length === 0 ? (
              <p className="rounded-xl bg-paper px-4 py-3 text-sm text-muted">
                {t.designs.noEvents}{" "}
                <Link href="/events/new" className="font-medium text-pine underline">
                  {t.nav.newEvent}
                </Link>
              </p>
            ) : (
              <div>
                <label htmlFor="design-event" className="label">
                  {t.designs.useFor}
                </label>
                <select id="design-event" value={eventId} onChange={(e) => setEventId(e.target.value)} className="input">
                  {!eventId && <option value="">{t.designs.pickEvent}</option>}
                  {recommended.length > 0 && (
                    <optgroup label={t.designs.recommended}>
                      {recommended.map((e) => (
                        <option key={e.id} value={e.id}>
                          {occasion(e.occasionType).emoji} {e.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {others.length > 0 && (
                    <optgroup label={t.designs.otherEvents}>
                      {others.map((e) => (
                        <option key={e.id} value={e.id}>
                          {occasion(e.occasionType).emoji} {e.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {chosen?.language === "en" && <p className="mt-2 text-xs text-muted">{t.designs.arabicOnly}</p>}
              </div>
            )}

            <div className="mt-auto flex gap-2">
              <button disabled={!eventId} onClick={() => onUse(eventId, palette)} className="btn-primary btn-md flex-1">
                {t.designs.use}
              </button>
              <button onClick={onClose} className="btn-secondary btn-md">
                {t.designs.close}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DesignsPage() {
  return (
    <Suspense>
      <Gallery />
    </Suspense>
  );
}
