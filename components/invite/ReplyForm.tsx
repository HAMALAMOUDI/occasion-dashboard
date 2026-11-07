"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { messages } from "@/lib/messages";
import type { Lang } from "@/lib/occasions";
import type { GuestStatus } from "@/lib/types";

type State = { status: GuestStatus; attending: number | null; pass: string | null; barcodeValue: string | null };

// The guest's reply: how many of the invitation's seats are coming, or a
// polite no. Once they accept, their entry pass appears right here.
// Written in the invitation's language, whatever the guest's browser prefers.
export default function ReplyForm({ token, seats, initial, lang }: { token: string; seats: number; initial: State; lang: Lang }) {
  const t = messages[lang].invite;
  const [state, setState] = useState(initial);
  const [count, setCount] = useState(initial.attending ?? seats);
  const [editing, setEditing] = useState(initial.status !== "accepted" && initial.status !== "declined");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function send(decision: "accept" | "decline") {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/invite/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, attending: count }),
      });
      if (!res.ok) throw new Error();
      setState(await res.json());
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const btn = "press tap-control min-h-12 px-5 text-[1.0625rem] transition-colors disabled:opacity-60";

  return (
    <section aria-labelledby="reply-title" className="border-t border-ink-deep/15 pt-8">
      <h2 id="reply-title" className="font-editorial text-[2rem] font-medium">
        {t.reply}
      </h2>

      {!editing && state.status === "accepted" && (
        <div className="mt-4" aria-live="polite">
          <p className="text-[1.125rem] text-ink-deep">{t.accepted(state.attending ?? seats)}</p>
          {state.pass && (
            <figure className="mt-6 bg-white p-5 text-center ring-1 ring-ink-deep/10">
              <figcaption className="text-[0.9375rem] font-medium text-ink-deep">{t.pass}</figcaption>
              <div className="mx-auto mt-3 w-[min(100%,13rem)] [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: state.pass }} />
              <p className="mt-2 font-mono text-[0.875rem] tracking-wider text-ink-soft" dir="ltr">
                {state.barcodeValue}
              </p>
              <p className="mt-2 text-[0.875rem] text-ink-soft">{t.passHint}</p>
            </figure>
          )}
        </div>
      )}
      {!editing && state.status === "declined" && (
        <p className="mt-4 text-[1.125rem] text-ink-deep" aria-live="polite">
          {t.declined}
        </p>
      )}
      {!editing && (
        <button type="button" onClick={() => setEditing(true)} className="tap-control mt-5 text-[0.9375rem] text-ink-soft underline underline-offset-4 hover:text-ink-deep">
          {t.change}
        </button>
      )}

      {editing && (
        <div className="mt-4">
          <p className="text-[1.125rem] text-ink-deep">{seats > 1 ? t.askSeats(seats) : t.ask}</p>
          {seats > 1 && (
            <div className="mt-4 inline-flex items-center gap-1 bg-bone p-1" role="group" aria-label={t.askSeats(seats)}>
              <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} disabled={count <= 1} className="tap-control grid h-11 w-11 place-items-center disabled:opacity-40" aria-label="−">
                <Minus size={18} />
              </button>
              <output className="min-w-[3rem] text-center font-editorial text-[1.75rem] tabular-nums" aria-live="polite">
                {count}
              </output>
              <button type="button" onClick={() => setCount((c) => Math.min(seats, c + 1))} disabled={count >= seats} className="tap-control grid h-11 w-11 place-items-center disabled:opacity-40" aria-label="+">
                <Plus size={18} />
              </button>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled={busy} onClick={() => send("accept")} className={`${btn} bg-ink-deep text-ivory hover:bg-olive`}>
              {t.accept}
            </button>
            <button type="button" disabled={busy} onClick={() => send("decline")} className={`${btn} border border-ink-deep/25 text-ink-deep hover:border-ink-deep/60`}>
              {t.decline}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-[0.9375rem] text-[#9b2c2c]" role="alert">
              {t.saveError}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
