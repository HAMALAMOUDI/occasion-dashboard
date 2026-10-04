"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CardTemplate } from "@/lib/types";
import TemplatePicker from "@/components/TemplatePicker";

const OCCASION_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "graduation", label: "Graduation" },
  { value: "corporate", label: "Corporate event" },
  { value: "birthday", label: "Birthday" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [name, setName] = useState("");
  const [occasionType, setOccasionType] = useState("wedding");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [inviterName, setInviterName] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/templates").then((r) => r.json()).then(setTemplates);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !eventDate || !inviterName) {
      setError("Please fill in event name, date, and inviter name.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, occasionType, eventDate, venue, inviterName, templateId }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not create event");
      return;
    }
    router.push(`/events/${data.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl mb-6">New event</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sara &amp; Ahmed Wedding"
              className="w-full border border-line rounded-md px-3 py-2 text-sm bg-paper"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Occasion type</label>
            <select
              value={occasionType}
              onChange={(e) => {
                setOccasionType(e.target.value);
                setTemplateId(null);
              }}
              className="w-full border border-line rounded-md px-3 py-2 text-sm bg-paper"
            >
              {OCCASION_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Event date</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm bg-paper"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Venue</label>
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Ritz-Carlton, Jeddah"
              className="w-full border border-line rounded-md px-3 py-2 text-sm bg-paper"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Inviter name</label>
            <p className="text-xs text-ink/60 mb-1">Shown on the invite card as who&apos;s sending it.</p>
            <input
              value={inviterName}
              onChange={(e) => setInviterName(e.target.value)}
              placeholder="Family of Ahmed Al-Otaibi"
              className="w-full border border-line rounded-md px-3 py-2 text-sm bg-paper"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Occasion card template</label>
          <TemplatePicker
            templates={templates}
            occasionType={occasionType}
            selectedId={templateId}
            onSelect={setTemplateId}
          />
        </div>

        {error && <p className="text-sm text-decline">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-md bg-pine text-paper text-sm hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create event"}
        </button>
      </form>
    </div>
  );
}
