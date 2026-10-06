"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CardTemplate, Event } from "@/lib/types";
import TemplatePicker from "@/components/TemplatePicker";
import InvitePreview from "@/components/InvitePreview";
import { useLocale, useT } from "@/components/I18nProvider";
import { postJson } from "@/lib/client";
import type { Locale } from "@/lib/i18n";
import { OCCASIONS, occasion, type OccasionType } from "@/lib/occasions";

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pine text-xs font-semibold text-white">{n}</span>
        <div>
          <h2 className="font-medium">{title}</h2>
          {hint && <p className="text-sm text-muted mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function NewEventPage() {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [name, setName] = useState("");
  const [occasionType, setOccasionType] = useState<OccasionType>("wedding");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [inviterName, setInviterName] = useState("");
  const [language, setLanguage] = useState<Locale>(locale);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  const o = occasion(occasionType);
  // Default to the first design for the chosen occasion so the preview is never blank.
  const selectedTemplate = templates.find((tpl) => tpl.id === templateId) ?? templates.find((tpl) => tpl.occasionType === occasionType);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !eventDate || !inviterName.trim()) {
      setError(t.newEvent.required);
      return;
    }
    setBusy(true);
    const res = await postJson<Event>("/api/events", {
      name,
      occasionType,
      eventDate,
      venue,
      inviterName,
      language,
      templateId: selectedTemplate?.id ?? null,
    });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    router.push(`/events/${res.data.id}`);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="animate-fade-up">
      <p className="text-muted">{t.newEvent.eyebrow}</p>
      <h1 className="font-serif text-3xl sm:text-4xl mt-1 mb-8">{t.newEvent.title}</h1>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form onSubmit={handleSubmit} className="space-y-5 min-w-0" noValidate>
          <Step n={1} title={t.newEvent.stepOccasion}>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2" role="radiogroup" aria-label={t.newEvent.stepOccasion}>
              {OCCASIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={occasionType === item.id}
                  onClick={() => {
                    setOccasionType(item.id);
                    setTemplateId(null);
                  }}
                  className={`rounded-xl border px-2 py-3 text-sm font-medium leading-tight transition ${
                    occasionType === item.id ? "border-pine bg-pine-soft text-pine" : "border-line hover:border-ink/25"
                  }`}
                >
                  <span className="block text-xl mb-1">{item.emoji}</span>
                  {item.label[locale]}
                </button>
              ))}
            </div>
          </Step>

          <Step n={2} title={t.newEvent.stepDetails} hint={t.newEvent.stepDetailsHint}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="label">
                  {t.newEvent.name}
                </label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={o.namePlaceholder[language]} className="input" />
              </div>
              <div>
                <label htmlFor="date" className="label">
                  {t.newEvent.date}
                </label>
                <input id="date" type="date" min={today} value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="venue" className="label">
                  {t.newEvent.venue} <span className="font-normal text-muted">{t.newEvent.optional}</span>
                </label>
                <input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder={t.newEvent.venuePlaceholder} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="inviter" className="label">
                  {o.hostLabel[locale]}
                </label>
                <input
                  id="inviter"
                  value={inviterName}
                  onChange={(e) => setInviterName(e.target.value)}
                  placeholder={o.hostPlaceholder[language]}
                  className="input"
                />
              </div>
              <div className="sm:col-span-2">
                <p className="label">{t.newEvent.inviteLanguage}</p>
                <div className="inline-flex rounded-full border border-line bg-paper p-1" role="radiogroup" aria-label={t.newEvent.inviteLanguage}>
                  {(["ar", "en"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      role="radio"
                      aria-checked={language === lang}
                      lang={lang}
                      onClick={() => setLanguage(lang)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                        language === lang ? "bg-surface text-pine shadow-sm" : "text-muted hover:text-ink"
                      }`}
                    >
                      {lang === "ar" ? "العربية" : "English"}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted">{t.newEvent.inviteLanguageHint}</p>
              </div>
            </div>
          </Step>

          <Step n={3} title={t.newEvent.stepDesign} hint={t.newEvent.stepDesignHint}>
            <TemplatePicker templates={templates} occasionType={occasionType} selectedId={selectedTemplate?.id ?? null} onSelect={setTemplateId} />
          </Step>

          {error && <p className="rounded-xl bg-decline-bg px-4 py-3 text-sm text-decline">{error}</p>}

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted hidden sm:block">{t.newEvent.next}</p>
            <button type="submit" disabled={busy} className="btn-primary px-6 py-2.5 text-sm">
              {busy ? t.newEvent.creating : t.newEvent.create} <ArrowRight size={16} className="rtl:rotate-180" />
            </button>
          </div>
        </form>

        <aside className="lg:sticky lg:top-10 self-start">
          <p className="eyebrow mb-3">{t.newEvent.preview}</p>
          <InvitePreview event={{ name, occasionType, inviterName, eventDate, venue, language }} template={selectedTemplate} />
        </aside>
      </div>
    </div>
  );
}
