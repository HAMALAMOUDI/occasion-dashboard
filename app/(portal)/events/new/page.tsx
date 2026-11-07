"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { Event } from "@/lib/types";
import DesignFrame from "@/components/DesignFrame";
import PhoneFrame from "@/components/PhoneFrame";
import ClipPlayer from "@/components/ClipPlayer";
import { useLocale, useT } from "@/components/I18nProvider";
import { postJson, requestJson } from "@/lib/client";
import { clipTextForEvent } from "@/lib/clips/content";
import { RECOMMENDED_STYLES, type ClipStyle } from "@/lib/clips/themes";
import {
  CATEGORIES_FOR_OCCASION,
  CATEGORY_LABELS,
  DESIGN_STYLES,
  LAYOUT_NAMES,
  SAMPLE,
  defaultPaletteIndex,
  isDesignCategory,
  layoutCount,
  occasionForCategory,
  palettesFor,
  sampleFields,
  stylesFor,
  type DesignCategory,
  type DesignStyle,
} from "@/lib/designs/catalog";
import { designSrc } from "@/lib/designs/urls";
import type { Locale } from "@/lib/i18n";
import { OCCASIONS, occasion, type OccasionType } from "@/lib/occasions";

type Pick = { style: DesignStyle; category: DesignCategory; layout: number; palette: number };

const firstPick = (category: DesignCategory): Pick => {
  const style = stylesFor(category)[0];
  return { style, category, layout: 1, palette: defaultPaletteIndex(style, category, 1) };
};

// A design named in the link (from the public gallery's "Use this design"), if it is a real one.
function pickFromQuery(q: URLSearchParams): Pick | null {
  const category = q.get("category");
  const style = q.get("style") as DesignStyle;
  const layout = Number(q.get("layout"));
  if (!isDesignCategory(category) || !DESIGN_STYLES.includes(style) || !stylesFor(category).includes(style)) return null;
  if (!Number.isInteger(layout) || layout < 1 || layout > layoutCount(style)) return null;
  const palette = Number(q.get("palette"));
  const count = palettesFor(style, category, layout).length;
  return { style, category, layout, palette: Number.isInteger(palette) && palette >= 0 && palette < count ? palette : defaultPaletteIndex(style, category, layout) };
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="tile p-5 sm:p-7">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pine font-editorial text-[1.05rem] text-ivory [font-variant-numeric:lining-nums]">{n}</span>
        <div>
          <h2 className="font-editorial text-[1.5rem] leading-tight text-ink-deep">{title}</h2>
          {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

const chip = (on: boolean) =>
  `tap-control rounded-full border px-4 py-2 text-sm font-medium transition ${
    on ? "border-pine bg-pine text-ivory shadow-[0_8px_18px_-10px_rgb(31_90_69/0.8)]" : "border-ink-deep/12 bg-white text-ink-deep hover:border-ink-deep/30"
  }`;

export default function NewEventPage() {
  return (
    <Suspense>
      <NewEvent />
    </Suspense>
  );
}

function NewEvent() {
  const router = useRouter();
  const query = useSearchParams();
  const t = useT();
  const T = t.newEvent;
  const locale = useLocale();

  const [pick, setPick] = useState<Pick>(() => pickFromQuery(query) ?? firstPick("wedding"));
  const [occasionType, setOccasionType] = useState<OccasionType>(() => occasionForCategory(pick.category));
  const [name, setName] = useState(() => query.get("name")?.slice(0, 120) ?? "");
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [inviterName, setInviterName] = useState("");
  const [language, setLanguage] = useState<Locale>(locale);
  const [clipStyle, setClipStyle] = useState<ClipStyle | null>(null);
  const [useClip, setUseClip] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const o = occasion(occasionType);
  const { style, category, layout, palette } = pick;
  const sample = SAMPLE[category];
  const twoNames = sample.nameB !== "";
  const categories = CATEGORIES_FOR_OCCASION[occasionType];
  const styles = stylesFor(category);
  const palettes = palettesFor(style, category, layout);
  const layoutName = (s: DesignStyle, l: number) => LAYOUT_NAMES[s][l - 1][locale];
  const styleName = (s: DesignStyle) => t.designs[s];

  // Every design for this category in one run (style by style), for the arrows and "3 of 48".
  const sequence = styles.flatMap((s) => Array.from({ length: layoutCount(s) }, (_, i) => ({ style: s, layout: i + 1 })));
  const position = sequence.findIndex((d) => d.style === style && d.layout === layout);
  const step = (by: number) => {
    const d = sequence[(position + by + sequence.length) % sequence.length];
    setPick({ ...pick, ...d, palette: defaultPaletteIndex(d.style, category, d.layout) });
  };

  // What the card shows: what they've typed, the sample wording where they haven't. Settles before reloading the card.
  const typed = { nameA: nameA.trim(), nameB: twoNames ? nameB.trim() : "", time: time.trim(), city: city.trim(), venue: venue.trim(), date: eventDate };
  const [shown, setShown] = useState(typed);
  const typedKey = JSON.stringify(typed);
  useEffect(() => {
    const id = setTimeout(() => setShown(JSON.parse(typedKey)), 400);
    return () => clearTimeout(id);
  }, [typedKey]);
  const previewSrc = designSrc({ style, category, layout, palette, ...shown });

  function chooseOccasion(next: OccasionType) {
    setOccasionType(next);
    setPick(firstPick(CATEGORIES_FOR_OCCASION[next][0]));
    setClipStyle(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !eventDate || !inviterName.trim()) return setError(T.required);
    if (!nameA.trim()) return setError(T.nameRequired);
    setBusy(true);
    const fields = { ...sampleFields(category), nameA: typed.nameA, nameB: typed.nameB, time: typed.time || sample.time, city: typed.city || sample.city };
    const res = await postJson<Event>("/api/events", {
      name,
      occasionType,
      eventDate,
      venue,
      inviterName,
      language,
      templateId: null,
      design: { style, category, layout, palette, fields },
    });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    // Keep the animation they watched; the event page lets them change or remove it.
    if (useClip) await requestJson("PATCH", `/api/events/${res.data.id}`, { clip: { style: previewStyle } });
    router.push(`/events/${res.data.id}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const styleChoices = RECOMMENDED_STYLES[occasionType].slice(0, 3);
  const previewStyle = clipStyle ?? styleChoices[0];
  const previewText = clipTextForEvent({
    occasionType,
    language,
    name: name.trim() || o.namePlaceholder[language],
    inviterName: inviterName.trim() || o.hostPlaceholder[language],
    eventDate: eventDate || today,
    venue,
  });

  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <div className="animate-fade-up">
      <p className="eyebrow-site">{T.eyebrow}</p>
      <h1 className="mt-3 font-editorial text-[2.75rem] font-medium leading-[1.02] tracking-[-0.02em] text-ink-deep sm:text-[3.75rem] rtl:leading-[1.25] rtl:tracking-normal">{T.title}</h1>
      <p className="mt-3 max-w-xl text-ink-soft">{T.intro}</p>

      <form onSubmit={handleSubmit} onChange={() => error && setError(null)} noValidate className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
        {/* The card on a phone, first on small screens, beside the form on large ones. */}
        <aside className="self-start lg:sticky lg:top-8 lg:col-start-2 lg:row-start-1">
          <div className="relative rounded-[2rem] bg-[radial-gradient(120%_80%_at_50%_0%,rgb(240_222_170/0.45),transparent_70%)] px-2 pt-2">
            <PhoneFrame className="mx-auto w-[min(100%,15.5rem)] lg:w-full">
              <DesignFrame key={previewSrc} src={previewSrc} title={layoutName(style, layout)} />
            </PhoneFrame>
          </div>
          <div className="mx-auto mt-4 flex max-w-[19rem] items-center justify-between gap-2">
            <button type="button" onClick={() => step(-1)} aria-label={T.prev} className="tap-control grid h-11 w-11 place-items-center rounded-full bg-white text-ink-deep ring-1 ring-ink-deep/12 transition hover:ring-ink-deep/30">
              <Prev size={18} />
            </button>
            <p className="min-w-0 text-center">
              <span className="block truncate font-medium text-ink-deep">{layoutName(style, layout)}</span>
              <span className="block text-xs text-ink-soft tabular-nums">
                {styleName(style)} · {T.position(position + 1, sequence.length)}
              </span>
            </p>
            <button type="button" onClick={() => step(1)} aria-label={T.nextDesign} className="tap-control grid h-11 w-11 place-items-center rounded-full bg-white text-ink-deep ring-1 ring-ink-deep/12 transition hover:ring-ink-deep/30">
              <Next size={18} />
            </button>
          </div>
          {palettes.length > 1 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2" role="radiogroup" aria-label={T.colours}>
              {palettes.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={palette === i}
                  aria-label={`${T.colours} ${i + 1}`}
                  onClick={() => setPick({ ...pick, palette: i })}
                  className={`tap-control grid h-9 w-9 place-items-center rounded-full ring-offset-2 ring-offset-ivory transition ${
                    palette === i ? "ring-2 ring-ink-deep" : "ring-1 ring-ink-deep/15 hover:ring-ink-deep/40"
                  }`}
                  style={{ background: `linear-gradient(135deg, ${p.bg} 0 50%, ${p.accent} 50% 100%)` }}
                >
                  {palette === i && <Check size={14} strokeWidth={3} style={{ color: p.on }} />}
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-center text-xs text-ink-soft">{T.previewNote}</p>
        </aside>

        <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-1">
          <Step n={1} title={T.stepOccasion}>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={T.stepOccasion}>
              {OCCASIONS.map((item) => (
                <button key={item.id} type="button" role="radio" aria-checked={occasionType === item.id} onClick={() => chooseOccasion(item.id)} className={chip(occasionType === item.id)}>
                  {item.label[locale]}
                </button>
              ))}
            </div>
          </Step>

          <Step n={2} title={T.stepDesign} hint={T.stepDesignHint(sequence.length)}>
            {categories.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2" role="radiogroup" aria-label={T.stepDesign}>
                {categories.map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={category === c} onClick={() => setPick(firstPick(c))} className={chip(category === c)}>
                    {CATEGORY_LABELS[c][locale]}
                  </button>
                ))}
              </div>
            )}
            {styles.length > 1 && (
              <div className="inline-flex rounded-full bg-ivory p-1 ring-1 ring-ink-deep/8" role="radiogroup" aria-label={T.stepDesign}>
                {styles.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={style === s}
                    onClick={() => setPick({ ...pick, style: s, layout: 1, palette: defaultPaletteIndex(s, category, 1) })}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${style === s ? "bg-white text-pine shadow-sm" : "text-ink-soft hover:text-ink-deep"}`}
                  >
                    {styleName(s)}
                  </button>
                ))}
              </div>
            )}
            <div className="-mx-5 mt-4 overflow-x-auto px-5 pb-2 [scrollbar-width:thin] sm:-mx-7 sm:px-7">
              <ul className="flex w-max gap-3">
                {Array.from({ length: layoutCount(style) }, (_, i) => i + 1).map((l) => {
                  const on = l === layout;
                  return (
                    <li key={`${style}-${category}-${l}`}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setPick({ ...pick, layout: l, palette: defaultPaletteIndex(style, category, l) })}
                        className="group block w-[6.5rem] text-start"
                      >
                        <span className={`relative block overflow-hidden rounded-xl transition ${on ? "ring-2 ring-pine ring-offset-2 ring-offset-[#fffdf9]" : "ring-1 ring-ink-deep/10 group-hover:ring-ink-deep/30"}`}>
                          <DesignFrame src={designSrc({ style, category, layout: l, palette: defaultPaletteIndex(style, category, l) })} title={layoutName(style, l)} />
                          {on && (
                            <span className="absolute end-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-pine text-ivory shadow">
                              <Check size={13} strokeWidth={3} />
                            </span>
                          )}
                        </span>
                        <span className={`mt-1.5 block truncate text-xs ${on ? "font-medium text-pine" : "text-ink-soft"}`}>{layoutName(style, l)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Step>

          <Step n={3} title={T.stepDetails} hint={T.stepDetailsHint}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={twoNames ? "" : "sm:col-span-2"}>
                <label htmlFor="nameA" className="label">
                  {T.nameA}
                </label>
                <input id="nameA" value={nameA} onChange={(e) => setNameA(e.target.value)} placeholder={sample.nameA} maxLength={60} className="input" />
              </div>
              {twoNames && (
                <div>
                  <label htmlFor="nameB" className="label">
                    {T.nameB}
                  </label>
                  <input id="nameB" value={nameB} onChange={(e) => setNameB(e.target.value)} placeholder={sample.nameB} maxLength={60} className="input" />
                  <p className="mt-1 text-xs text-muted">{T.nameBHint}</p>
                </div>
              )}
              <div>
                <label htmlFor="date" className="label">
                  {T.date}
                </label>
                <input id="date" type="date" min={today} value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="time" className="label">
                  {T.time}
                </label>
                <input id="time" value={time} onChange={(e) => setTime(e.target.value)} placeholder={sample.time} maxLength={40} className="input" />
              </div>
              <div>
                <label htmlFor="venue" className="label">
                  {T.venue} <span className="font-normal text-muted">{T.optional}</span>
                </label>
                <input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder={T.venuePlaceholder} className="input" />
              </div>
              <div>
                <label htmlFor="city" className="label">
                  {T.city}
                </label>
                <input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder={sample.city} maxLength={40} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="inviter" className="label">
                  {o.hostLabel[locale]}
                </label>
                <input id="inviter" value={inviterName} onChange={(e) => setInviterName(e.target.value)} placeholder={o.hostPlaceholder[language]} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="name" className="label">
                  {T.name}
                </label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={o.namePlaceholder[language]} className="input" />
                <p className="mt-1 text-xs text-muted">{T.nameHint}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="label">{T.inviteLanguage}</p>
                <div className="inline-flex rounded-full bg-ivory p-1 ring-1 ring-ink-deep/8" role="radiogroup" aria-label={T.inviteLanguage}>
                  {(["ar", "en"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      role="radio"
                      aria-checked={language === lang}
                      lang={lang}
                      onClick={() => setLanguage(lang)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${language === lang ? "bg-white text-pine shadow-sm" : "text-ink-soft hover:text-ink-deep"}`}
                    >
                      {lang === "ar" ? "العربية" : "English"}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted">{T.inviteLanguageHint}</p>
              </div>
            </div>
          </Step>

          <section className="tile overflow-hidden sm:grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
            <div className="mx-auto w-[min(100%,12rem)] bg-ink-deep sm:w-full">
              <ClipPlayer spec={{ style: previewStyle, occasion: occasionType, text: previewText }} label={`${t.clips.styles[previewStyle]} — ${previewText.title}`} />
            </div>
            <div className="space-y-3 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-editorial text-[1.5rem] leading-tight text-ink-deep">{T.animatedTitle}</h2>
                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                  <input type="checkbox" checked={useClip} onChange={(e) => setUseClip(e.target.checked)} className="peer sr-only" aria-label={T.animatedUse} />
                  <span className="h-6 w-11 rounded-full bg-ink-deep/15 transition peer-checked:bg-pine peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink-deep" />
                  <span className="absolute start-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5" />
                </label>
              </div>
              <p className="text-sm text-ink-soft">{T.animatedHint}</p>
              <div className={`flex flex-wrap gap-1.5 transition ${useClip ? "" : "pointer-events-none opacity-40"}`} role="radiogroup" aria-label={T.animatedTitle}>
                {styleChoices.map((st) => (
                  <button
                    key={st}
                    type="button"
                    role="radio"
                    aria-checked={previewStyle === st}
                    onClick={() => setClipStyle(st)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      previewStyle === st ? "border-pine bg-pine-soft text-pine" : "border-ink-deep/12 text-ink-soft hover:border-ink-deep/30 hover:text-ink-deep"
                    }`}
                  >
                    {t.clips.styles[st]}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <section className="tile p-5 sm:p-6">
              <h2 className="font-editorial text-[1.375rem] text-ink-deep">{T.includedTitle}</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-deep">
                {T.included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-pine-soft text-pine">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
            <section className="tile p-5 sm:p-6">
              <h2 className="font-editorial text-[1.375rem] text-ink-deep">{T.howTitle}</h2>
              <ol className="mt-3 space-y-3">
                {T.how.map((h, i) => (
                  <li key={h.title} className="flex gap-3">
                    <span className="font-editorial text-[1.5rem] leading-none text-gold-ink [font-variant-numeric:lining-nums_tabular-nums]">{i + 1}</span>
                    <span>
                      <span className="block text-sm font-medium text-ink-deep">{h.title}</span>
                      <span className="block text-sm text-ink-soft">{h.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {/* The chosen design and the way on, always in reach. Above the phone tab bar on small screens. */}
          <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 md:bottom-4">
            {error && (
              <p role="alert" className="mb-2 rounded-xl bg-decline-bg px-4 py-3 text-sm text-decline">
                {error}
              </p>
            )}
            <div className="flex items-center gap-3 rounded-full bg-white/90 p-2 ps-5 shadow-[0_0_0_1px_rgb(36_36_31/0.08),0_20px_40px_-20px_rgb(36_36_31/0.45)] backdrop-blur">
              <p className="hidden min-w-0 flex-1 sm:block">
                <span className="block text-xs text-ink-soft">{T.chosen}</span>
                <span className="block truncate text-sm font-medium text-ink-deep">
                  {layoutName(style, layout)} · {styleName(style)}
                </span>
              </p>
              <button type="submit" disabled={busy} className="btn-invite press flex min-h-12 w-full sm:w-auto disabled:opacity-70">
                <span className="btn-invite-label whitespace-nowrap">{busy ? T.creating : T.create}</span>
                <span className="btn-invite-tab">
                  <ArrowRight size={17} className="rtl:rotate-180" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
