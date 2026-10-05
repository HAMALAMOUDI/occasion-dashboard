"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CardTemplate, Event } from "@/lib/types";
import TemplatePicker from "@/components/TemplatePicker";
import InvitePreview from "@/components/InvitePreview";
import { postJson } from "@/lib/client";

const OCCASION_TYPES: { value: Event["occasionType"]; label: string; emoji: string }[] = [
  { value: "wedding", label: "Wedding", emoji: "💍" },
  { value: "graduation", label: "Graduation", emoji: "🎓" },
  { value: "corporate", label: "Corporate", emoji: "💼" },
  { value: "birthday", label: "Birthday", emoji: "🎂" },
];

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
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [name, setName] = useState("");
  const [occasionType, setOccasionType] = useState<Event["occasionType"]>("wedding");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [inviterName, setInviterName] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  // Default to the first design for the chosen occasion so the preview is never blank.
  const selectedTemplate =
    templates.find((t) => t.id === templateId) ?? templates.find((t) => t.occasionType === occasionType);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !eventDate || !inviterName.trim()) {
      setError("Almost there — please add the event name, date, and who the invitation is from.");
      return;
    }
    setBusy(true);
    const res = await postJson<Event>("/api/events", {
      name,
      occasionType,
      eventDate,
      venue,
      inviterName,
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
      <p className="text-muted">New event</p>
      <h1 className="font-serif text-3xl sm:text-4xl mt-1 mb-8">What are we celebrating?</h1>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form onSubmit={handleSubmit} className="space-y-5 min-w-0" noValidate>
          <Step n={1} title="The occasion">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Occasion type">
              {OCCASION_TYPES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={occasionType === o.value}
                  onClick={() => {
                    setOccasionType(o.value);
                    setTemplateId(null);
                  }}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    occasionType === o.value ? "border-pine bg-pine-soft text-pine" : "border-line hover:border-ink/25"
                  }`}
                >
                  <span className="block text-xl mb-1">{o.emoji}</span>
                  {o.label}
                </button>
              ))}
            </div>
          </Step>

          <Step n={2} title="The details" hint="These appear on every invitation.">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="label">
                  Event name
                </label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sara & Ahmed's Wedding" className="input" />
              </div>
              <div>
                <label htmlFor="date" className="label">
                  Date
                </label>
                <input id="date" type="date" min={today} value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="venue" className="label">
                  Venue <span className="font-normal text-muted">(optional)</span>
                </label>
                <input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Ritz-Carlton, Jeddah" className="input" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="inviter" className="label">
                  Who is the invitation from?
                </label>
                <input
                  id="inviter"
                  value={inviterName}
                  onChange={(e) => setInviterName(e.target.value)}
                  placeholder="The Al-Otaibi family"
                  className="input"
                />
              </div>
            </div>
          </Step>

          <Step n={3} title="Pick a card design" hint="You can see how it looks on the right.">
            <TemplatePicker templates={templates} occasionType={occasionType} selectedId={selectedTemplate?.id ?? null} onSelect={setTemplateId} />
          </Step>

          {error && <p className="rounded-xl bg-decline-bg px-4 py-3 text-sm text-decline">{error}</p>}

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted hidden sm:block">Next, you&apos;ll upload your guest list.</p>
            <button type="submit" disabled={busy} className="btn-primary px-6 py-2.5 text-sm">
              {busy ? "Creating…" : "Create event"} <ArrowRight size={16} />
            </button>
          </div>
        </form>

        <aside className="lg:sticky lg:top-10 self-start">
          <p className="eyebrow mb-3">Live preview</p>
          <InvitePreview event={{ name, occasionType, inviterName, eventDate, venue }} template={selectedTemplate} />
        </aside>
      </div>
    </div>
  );
}
