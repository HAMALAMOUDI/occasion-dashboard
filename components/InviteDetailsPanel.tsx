"use client";

import { useState } from "react";
import { ExternalLink, Globe, Plus, X } from "lucide-react";
import { requestJson } from "@/lib/client";
import { EMPTY_DETAILS } from "@/lib/invite";
import type { Event, InviteDetails } from "@/lib/types";
import { useT } from "./I18nProvider";

// What guests find on their own invitation page beyond the card: map, programme,
// dress code, gifts and a note. Saved together with one button.
export default function InviteDetailsPanel({ event, sampleToken, onChange }: { event: Event; sampleToken?: string; onChange: () => void }) {
  const t = useT();
  const T = t.details;
  const [d, setD] = useState<InviteDetails>(event.details ?? EMPTY_DETAILS);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const set = (patch: Partial<InviteDetails>) => {
    setMessage(null);
    setD({ ...d, ...patch });
  };

  async function save() {
    setBusy(true);
    const res = await requestJson("PATCH", `/api/events/${event.id}`, { details: d });
    setBusy(false);
    setMessage(res.ok ? { text: T.saved, ok: true } : { text: res.error, ok: false });
    if (res.ok) onChange();
  }

  const text = (key: "mapUrl" | "dressCode" | "gifts" | "note", label: string, opts: { hint?: string; ltr?: boolean } = {}) => (
    <div>
      <label htmlFor={`d-${key}`} className="label">
        {label}
      </label>
      <input
        id={`d-${key}`}
        value={d[key]}
        onChange={(e) => set({ [key]: e.target.value })}
        dir={opts.ltr ? "ltr" : "auto"}
        type={opts.ltr ? "url" : "text"}
        maxLength={key === "mapUrl" ? 500 : 300}
        className="input"
      />
      {opts.hint && <p className="mt-1 text-xs text-muted">{opts.hint}</p>}
    </div>
  );

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <Globe size={17} className="text-brass" />
        <h3 className="font-medium">{T.title}</h3>
      </div>
      <p className="mt-1 text-xs text-muted">{T.intro}</p>

      <div className="mt-4 space-y-3">
        {text("mapUrl", T.mapUrl, { hint: T.mapHint, ltr: true })}

        <fieldset>
          <legend className="label">{T.schedule}</legend>
          <ul className="space-y-2">
            {d.schedule.map((s, i) => (
              <li key={i} className="flex gap-1.5">
                <input
                  value={s.time}
                  onChange={(e) => set({ schedule: d.schedule.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)) })}
                  placeholder={T.time}
                  aria-label={T.time}
                  maxLength={40}
                  className="input w-24 shrink-0"
                />
                <input
                  value={s.title}
                  onChange={(e) => set({ schedule: d.schedule.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })}
                  placeholder={T.item}
                  aria-label={T.item}
                  maxLength={120}
                  className="input min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={() => set({ schedule: d.schedule.filter((_, j) => j !== i) })}
                  className="grid h-10 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-paper hover:text-decline"
                  aria-label={T.removeStep}
                >
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
          {d.schedule.length < 12 && (
            <button type="button" onClick={() => set({ schedule: [...d.schedule, { time: "", title: "" }] })} className="btn-secondary btn-sm mt-2">
              <Plus size={13} /> {T.addStep}
            </button>
          )}
        </fieldset>

        {text("dressCode", T.dressCode)}
        {text("gifts", T.gifts)}
        {text("note", T.note)}
      </div>

      {message && <p className={`mt-3 text-xs ${message.ok ? "text-accept" : "text-decline"}`}>{message.text}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={save} disabled={busy} className="btn-primary btn-sm">
          {busy ? T.saving : T.save}
        </button>
        {sampleToken ? (
          <a href={`/i/${sampleToken}`} target="_blank" rel="noopener" className="btn-secondary btn-sm">
            <ExternalLink size={13} /> {T.open}
          </a>
        ) : (
          <span className="text-xs text-muted">{T.noGuests}</span>
        )}
      </div>
    </div>
  );
}
