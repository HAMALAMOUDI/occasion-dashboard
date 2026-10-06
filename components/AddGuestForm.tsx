"use client";

import { useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import { postJson } from "@/lib/client";
import type { InviteSummary } from "@/lib/rsvp";

// Add a single guest by hand. Their invitation goes out immediately.
export default function AddGuestForm({ eventId, onAdded }: { eventId: string; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "warn" | "error" } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setMessage({ text: "Please enter both a name and a mobile number.", tone: "error" });
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = await postJson<InviteSummary>(`/api/events/${eventId}/guests`, { rows: [{ name, phone }] });
    setBusy(false);

    if (!res.ok) {
      setMessage({ text: res.error, tone: "error" });
      return;
    }
    const s = res.data;
    const who = name.trim().split(/\s+/)[0];
    if (s.duplicates) {
      setMessage({ text: "That number is already on your guest list.", tone: "warn" });
      return;
    }
    if (s.sent) setMessage({ text: `Invitation sent to ${who} 🎉`, tone: "ok" });
    else if (s.invalid)
      setMessage({ text: `${who} was added, but that number doesn't look right — you can fix it in the list below.`, tone: "warn" });
    else setMessage({ text: `${who} was added, but the invitation didn't send yet — use "Retry" below.`, tone: "warn" });

    setName("");
    setPhone("");
    nameRef.current?.focus();
    onAdded();
  }

  const tone = { ok: "text-accept", warn: "text-pending", error: "text-decline" };

  return (
    <form onSubmit={submit} className="card p-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label htmlFor="guest-name" className="label">
            Guest name
          </label>
          <input
            id="guest-name"
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Layla Al-Otaibi"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="guest-phone" className="label">
            Mobile number
          </label>
          <input
            id="guest-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05X XXX XXXX"
            className="input"
          />
        </div>
        <button type="submit" disabled={busy} className="btn-primary px-5 py-2.5 text-sm">
          <UserPlus size={16} /> {busy ? "Adding…" : "Add & invite"}
        </button>
      </div>
      {message && <p className={`mt-3 text-sm ${tone[message.tone]}`}>{message.text}</p>}
    </form>
  );
}
