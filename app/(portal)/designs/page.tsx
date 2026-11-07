"use client";

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import DesignFrame from "@/components/DesignFrame";
import PhoneFrame from "@/components/PhoneFrame";
import DesignTabs from "@/components/designs/DesignTabs";
import { designSrc } from "@/lib/designs/urls";
import { useLocale, useT } from "@/components/I18nProvider";
import {
  CATEGORIES_FOR_OCCASION,
  CATEGORY_LABELS,
  DESIGN_CATEGORIES,
  DESIGN_COUNT,
  DESIGN_STYLES,
  LAYOUT_NAMES,
  defaultPaletteIndex,
  designCountFor,
  isDesignCategory,
  palettesFor,
  stylesFor,
  type DesignCategory,
  type DesignStyle,
} from "@/lib/designs/catalog";
import { occasion } from "@/lib/occasions";
import type { Event } from "@/lib/types";

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
  const [chosenStyle, setStyle] = useState<DesignStyle>(() => {
    const s = params.get("style") as DesignStyle;
    return DESIGN_STYLES.includes(s) ? s : DESIGN_STYLES[0];
  });
  // Not every style serves every occasion (condolences: signature only).
  const styles = stylesFor(category);
  const style = styles.includes(chosenStyle) ? chosenStyle : styles[0];
  // ?layout= (and ?palette=) open one design straight away, e.g. from the public gallery.
  const [open, setOpenState] = useState<number | null>(() => {
    const n = Number(params.get("layout"));
    return Number.isInteger(n) && n >= 1 ? n : null;
  });
  // The colour a link asked for applies to the design it opened, not to the ones browsed after it.
  const [linked] = useState(() => {
    const n = Number(params.get("palette") ?? NaN);
    return { layout: Number(params.get("layout")), palette: Number.isInteger(n) && n >= 0 ? n : null };
  });
  const names = LAYOUT_NAMES[style];
  const shown = open !== null && open <= names.length ? open : null;
  // The dialog lives on <body>, so it waits for the browser (a link can open it on the first render).
  const inBrowser = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Keep the address in step with what's on screen, so a design can be shared or reloaded.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    q.set("category", category);
    q.set("style", style);
    if (shown) q.set("layout", String(shown));
    else q.delete("layout");
    q.delete("palette");
    window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
  }, [category, style, shown]);
  const setOpen = setOpenState;

  useEffect(() => {
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Event[]) => setEvents(list))
      .catch(() => setEvents([]));
  }, []);

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
      <p className="text-muted mt-2 mb-6 max-w-2xl">{t.designs.subtitle(DESIGN_COUNT)}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 [scrollbar-width:none]" role="tablist">
          {DESIGN_CATEGORIES.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={category === c}
              onClick={() => {
                setCategory(c);
                setOpen(null);
              }}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                category === c ? "bg-ink text-white" : "bg-surface border border-line text-muted hover:text-ink"
              }`}
            >
              {CATEGORY_LABELS[c][locale]}
              <span className="ms-1.5 tabular-nums opacity-60">{designCountFor(c)}</span>
            </button>
          ))}
        </div>
        <div className="inline-flex shrink-0 self-start rounded-full border border-line bg-paper p-1" role="radiogroup">
          {styles.map((s) => (
            <button
              key={s}
              role="radio"
              aria-checked={style === s}
              onClick={() => {
                setStyle(s);
                setOpen(null);
              }}
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

      {shown !== null && inBrowser && (
        <DesignDialog
          // A fresh dialog per design, so its colours start from that design's default.
          key={`${style}-${category}-${shown}`}
          style={style}
          category={category}
          layout={shown}
          initialPalette={shown === linked.layout ? linked.palette : null}
          events={events}
          target={target}
          onMove={(n) => setOpen(n)}
          onClose={() => setOpen(null)}
          onUse={(eventId, palette) =>
            router.push(
              `/events/${eventId}/design?${new URLSearchParams({ style, category, layout: String(shown), palette: String(palette) })}`
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
  initialPalette,
  events,
  target,
  onMove,
  onClose,
  onUse,
}: {
  style: DesignStyle;
  category: DesignCategory;
  layout: number;
  initialPalette: number | null;
  events: Event[];
  target: Event | null;
  onMove: (layout: number) => void;
  onClose: () => void;
  onUse: (eventId: string, palette: number) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const palettes = palettesFor(style, category, layout);
  const [palette, setPalette] = useState(
    initialPalette !== null && initialPalette < palettes.length ? initialPalette : defaultPaletteIndex(style, category, layout)
  );
  const total = LAYOUT_NAMES[style].length;
  const label = layoutLabel(layout, LAYOUT_NAMES[style][layout - 1][locale]);
  const step = (by: number) => onMove(((layout - 1 + by + total) % total) + 1);
  // Arrow keys follow reading direction: in Arabic, left is "next".
  const forward = locale === "ar" ? "ArrowLeft" : "ArrowRight";
  const back = locale === "ar" ? "ArrowRight" : "ArrowLeft";

  const [recommended, others] = useMemo(() => {
    // Condolence designs go on condolences only, and celebration designs never do.
    const usable = events.filter((e) => !occasion(e.occasionType).rsvp === (category === "condolence"));
    const fits = (e: Event) => CATEGORIES_FOR_OCCASION[e.occasionType].includes(category);
    return [usable.filter(fits), usable.filter((e) => !fits(e))];
  }, [events, category]);
  const usable = [...recommended, ...others];
  const [eventId, setEventId] = useState(
    (target && usable.some((e) => e.id === target.id) ? target.id : null) ?? recommended[0]?.id ?? others[0]?.id ?? ""
  );
  const chosen = usable.find((e) => e.id === eventId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Leave arrow keys alone while a form control (the event picker) has focus.
      if (e.target instanceof HTMLSelectElement || e.target instanceof HTMLInputElement) return;
      if (e.key === forward) step(1);
      if (e.key === back) step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // On <body>: the page's entrance animation leaves a transform that would trap a fixed overlay.
  return createPortal(
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
              {CATEGORY_LABELS[category][locale]} · {t.designs[style]} · <span className="tabular-nums">{t.designs.position(layout, total)}</span>
            </p>
            <h2 className="font-serif text-2xl mt-1">{label}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={() => step(-1)} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-paper hover:text-ink" aria-label={t.designs.prev}>
              <ArrowLeft size={18} className="rtl:rotate-180" />
            </button>
            <button onClick={() => step(1)} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-paper hover:text-ink" aria-label={t.designs.next}>
              <ArrowRight size={18} className="rtl:rotate-180" />
            </button>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-paper" aria-label={t.designs.close}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-6 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
          <PhoneFrame className="mx-auto w-full max-w-[17rem]">
            <DesignFrame src={designSrc({ style, category, layout, palette })} title={label} />
          </PhoneFrame>

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

            {usable.length === 0 ? (
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
              <button disabled={!chosen} onClick={() => onUse(eventId, palette)} className="btn-primary btn-md flex-1">
                {t.designs.use}
              </button>
              <button onClick={onClose} className="btn-secondary btn-md">
                {t.designs.close}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function DesignsPage() {
  return (
    <Suspense>
      <Gallery />
    </Suspense>
  );
}
