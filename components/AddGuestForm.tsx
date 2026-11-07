"use client";

import { useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import { postJson } from "@/lib/client";
import type { InviteSummary } from "@/lib/rsvp";
import { useT } from "./I18nProvider";

// Add a single guest by hand. Their invitation goes out immediately.
// `festive` is false for solemn occasions, which drops the celebratory touches.
export default function AddGuestForm({ eventId, festive, onAdded }: { eventId: string; festive: boolean; onAdded: () => void }) {
  const t = useT();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "warn" | "error" } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setMessage({ text: t.addGuest.bothRequired, tone: "error" });
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = await postJson<InviteSummary>(`/api/events/${eventId}/guests`, { rows: [{ name, phone, seats }] });
    setBusy(false);

    if (!res.ok) {
      setMessage({ text: res.error, tone: "error" });
      return;
    }
    const s = res.data;
    const who = name.trim().split(/\s+/)[0];
    if (s.duplicates) {
      setMessage({ text: t.addGuest.duplicate, tone: "warn" });
      return;
    }
    if (s.sent) setMessage({ text: t.addGuest.sent(who, festive), tone: "ok" });
    else if (s.invalid) setMessage({ text: t.addGuest.invalid(who), tone: "warn" });
    else setMessage({ text: t.addGuest.notSent(who), tone: "warn" });

    setName("");
    setPhone("");
    setSeats(1);
    nameRef.current?.focus();
    onAdded();
  }

  const tone = { ok: "text-accept", warn: "text-pending", error: "text-decline" };

  return (
    <form onSubmit={submit} className="card p-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5.5rem_auto] sm:items-end">
        <div>
          <label htmlFor="guest-name" className="label">
            {t.addGuest.name}
          </label>
          <input
            id="guest-name"
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.addGuest.namePlaceholder}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="guest-phone" className="label">
            {t.addGuest.phone}
          </label>
          <input
            id="guest-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            placeholder="05X XXX XXXX"
            className="input rtl:text-end"
          />
        </div>
        <div>
          <label htmlFor="guest-seats" className="label" title={t.guests.seatsHint}>
            {t.guests.seats}
          </label>
          <input
            id="guest-seats"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            value={seats}
            onChange={(e) => setSeats(Math.min(20, Math.max(1, Math.round(Number(e.target.value) || 1))))}
            aria-describedby="guest-seats-hint"
            className="input tabular-nums"
          />
        </div>
        <button type="submit" disabled={busy} className="btn-primary px-5 py-2.5 text-sm">
          <UserPlus size={16} /> {busy ? t.addGuest.adding : t.addGuest.submit}
        </button>
      </div>
      <p id="guest-seats-hint" className="mt-2 text-xs text-muted">
        {t.guests.seatsHint}
      </p>
      {message && <p className={`mt-3 text-sm ${tone[message.tone]}`}>{message.text}</p>}
    </form>
  );
}
