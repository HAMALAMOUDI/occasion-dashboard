"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import DesignFrame, { designSrc } from "@/components/DesignFrame";
import { useLocale, useT } from "@/components/I18nProvider";
import { requestJson } from "@/lib/client";
import { formatDate } from "@/lib/i18n";
import { occasion } from "@/lib/occasions";
import {
  CATEGORY_LABELS,
  DESIGN_STYLES,
  LAYOUT_NAMES,
  SAMPLE,
  defaultPaletteIndex,
  isDesignCategory,
  palettesFor,
  sampleFields,
  type DesignFields,
  type DesignStyle,
} from "@/lib/designs/catalog";
import type { DesignChoice } from "@/lib/designs/render";
import type { Event } from "@/lib/types";

// Wording starts from the category's sample text; names, time and city start
// empty (the sample shows as a placeholder) so nobody ships "فهد و نوف" by accident.
function startingFields(category: DesignChoice["category"], previous?: DesignFields): DesignFields {
  return previous ?? { ...sampleFields(category), nameA: "", nameB: "", time: "", city: "" };
}

function Editor() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const q = useSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [choice, setChoice] = useState<DesignChoice | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ event }: { event: Event }) => {
        setEvent(event);
        // A new pick from the gallery (query string), else the saved design.
        const style = q.get("style") as DesignStyle;
        const category = q.get("category");
        const layout = Number(q.get("layout"));
        if (DESIGN_STYLES.includes(style) && isDesignCategory(category) && layout >= 1 && layout <= 20) {
          const palette = Number(q.get("palette"));
          setChoice({
            style,
            category,
            layout,
            palette: Number.isInteger(palette) && palette >= 0 ? palette : null,
            fields: startingFields(category, event.design?.fields),
          });
        } else if (event.design) {
          setChoice(event.design);
        } else {
          router.replace(`/designs?event=${id}`);
        }
      })
      .catch(() => router.replace("/"));
  }, [id, q, router]);

  const sample = choice ? SAMPLE[choice.category] : null;

  // Live preview: empty fields fall back to the sample wording so the card always looks finished.
  const previewSrc = useMemo(() => {
    if (!choice || !event || !sample) return "";
    const f = choice.fields;
    return designSrc({
      style: choice.style,
      category: choice.category,
      layout: choice.layout,
      palette: choice.palette ?? defaultPaletteIndex(choice.style, choice.category, choice.layout),
      nameA: f.nameA || sample.nameA,
      nameB: f.nameB,
      kicker: f.kicker,
      title: f.title,
      body: f.body,
      time: f.time || sample.time,
      city: f.city || sample.city,
      note: f.note,
      cta: f.cta,
      en: f.en,
      venue: event.venue || sample.venue,
      date: event.eventDate,
    });
  }, [choice, event, sample]);

  // Debounce typing so the preview doesn't reload on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setPreview(previewSrc), 350);
    return () => clearTimeout(timer);
  }, [previewSrc]);

  if (!event || !choice || !sample) return <div className="h-96 animate-pulse rounded-2xl bg-line/60" />;

  const o = occasion(event.occasionType);
  const palettes = palettesFor(choice.style, choice.category, choice.layout);
  const activePalette = choice.palette ?? defaultPaletteIndex(choice.style, choice.category, choice.layout);
  const layoutName = LAYOUT_NAMES[choice.style][choice.layout - 1][locale];
  const setField = (key: keyof DesignFields, value: string) => {
    setMessage(null);
    setChoice({ ...choice, fields: { ...choice.fields, [key]: value } });
  };

  async function save() {
    if (!choice!.fields.nameA.trim()) {
      setMessage({ text: t.designs.nameRequired, ok: false });
      return;
    }
    setBusy(true);
    const res = await requestJson("PATCH", `/api/events/${id}`, { design: choice });
    setBusy(false);
    if (!res.ok) {
      setMessage({ text: res.error, ok: false });
      return;
    }
    setMessage({ text: t.designs.saved, ok: true });
    router.push(`/events/${id}`);
  }

  async function remove() {
    if (!window.confirm(t.designs.confirmRemove)) return;
    setBusy(true);
    const res = await requestJson("PATCH", `/api/events/${id}`, { design: null });
    setBusy(false);
    if (res.ok) router.push(`/events/${id}`);
    else setMessage({ text: res.error, ok: false });
  }

  const field = (key: keyof DesignFields, label: string, opts: { hint?: string; multiline?: boolean; placeholder?: string } = {}) => (
    <div>
      <label htmlFor={`f-${key}`} className="label">
        {label}
      </label>
      {opts.multiline ? (
        <textarea
          id={`f-${key}`}
          dir="auto"
          rows={2}
          value={choice.fields[key]}
          onChange={(e) => setField(key, e.target.value)}
          placeholder={opts.placeholder ?? sample[key]}
          maxLength={200}
          className="input resize-none"
        />
      ) : (
        <input
          id={`f-${key}`}
          dir="auto"
          value={choice.fields[key]}
          onChange={(e) => setField(key, e.target.value)}
          placeholder={opts.placeholder ?? sample[key]}
          maxLength={200}
          className="input"
        />
      )}
      {opts.hint && <p className="mt-1 text-xs text-muted">{opts.hint}</p>}
    </div>
  );

  return (
    <div className="animate-fade-up">
      <Link href={`/events/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} className="rtl:rotate-180" /> {event.name}
      </Link>
      <p className="mt-4 text-muted">{t.designs.editorEyebrow}</p>
      <h1 className="font-serif text-3xl sm:text-4xl mt-1">{t.designs.editorTitle}</h1>
      <p className="mt-2 text-sm text-muted">
        {CATEGORY_LABELS[choice.category][locale]} · {t.designs[choice.style]} · {String(choice.layout).padStart(2, "0")} {layoutName}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5 min-w-0">
          {event.language === "en" && <p className="rounded-xl bg-pending-bg px-4 py-3 text-sm text-pending">{t.designs.arabicOnly}</p>}

          <section className="card p-5 sm:p-6 space-y-4">
            <h2 className="font-medium">{t.designs.names}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("nameA", t.designs.nameA, { hint: t.designs.nameAHint })}
              {field("nameB", t.designs.nameB, { hint: t.designs.nameBHint })}
            </div>
          </section>

          <section className="card p-5 sm:p-6 space-y-4">
            <h2 className="font-medium">{t.designs.wording}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("title", t.designs.titleField)}
              {field("kicker", t.designs.kicker)}
            </div>
            {field("body", t.designs.body, { multiline: true })}
            <div className="grid gap-4 sm:grid-cols-3">
              {field("note", t.designs.note)}
              {field("cta", t.designs.cta)}
              {field("en", t.designs.en)}
            </div>
          </section>

          <section className="card p-5 sm:p-6 space-y-4">
            <h2 className="font-medium">{t.designs.details}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("time", t.designs.time)}
              {field("city", t.designs.city)}
            </div>
            <p className="text-xs text-muted">
              {t.designs.fromEvent} {formatDate(event.eventDate, locale, "long")}
              {event.venue ? ` · ${event.venue}` : ""}
            </p>
          </section>

          <section className="card p-5 sm:p-6">
            <p className="label">{t.designs.colours}</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.designs.colours}>
              {palettes.map((p, i) => (
                <button
                  key={i}
                  role="radio"
                  aria-checked={activePalette === i}
                  aria-label={`${t.designs.colours} ${i + 1}`}
                  onClick={() => setChoice({ ...choice, palette: i })}
                  className={`grid h-10 w-10 place-items-center rounded-full ring-offset-2 transition ${
                    activePalette === i ? "ring-2 ring-pine" : "ring-1 ring-line hover:ring-ink/30"
                  }`}
                  style={{ background: `linear-gradient(135deg, ${p.bg} 0 50%, ${p.accent} 50% 100%)` }}
                >
                  {activePalette === i && <Check size={14} strokeWidth={3} style={{ color: p.on }} />}
                </button>
              ))}
            </div>
          </section>

          {message && <p className={`rounded-xl px-4 py-3 text-sm ${message.ok ? "bg-accept-bg text-accept" : "bg-decline-bg text-decline"}`}>{message.text}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={save} disabled={busy} className="btn-primary btn-md">
              {busy ? t.designs.saving : t.designs.save}
            </button>
            <Link href={`/designs?event=${id}&category=${choice.category}&style=${choice.style}`} className="btn-secondary btn-md">
              {t.designs.change}
            </Link>
            {event.design && (
              <button onClick={remove} disabled={busy} className="btn btn-md text-decline hover:bg-decline-bg">
                {t.designs.remove}
              </button>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-10 self-start">
          <p className="eyebrow mb-3">{t.newEvent.preview}</p>
          <div className="mx-auto max-w-[20rem]">
            {preview && <DesignFrame src={preview} title={layoutName} className="rounded-xl shadow-lg ring-1 ring-line" />}
          </div>
          {!o.rsvp && <p className="mt-3 text-xs text-muted">{t.designs.notForCondolence}</p>}
        </aside>
      </div>
    </div>
  );
}

export default function DesignEditorPage() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}
