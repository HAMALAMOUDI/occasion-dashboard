import { Bell, Check, CheckCircle2, FileSpreadsheet, Minus, Plus, ScanLine } from "lucide-react";
import type { Messages } from "@/lib/messages";
import { messages } from "@/lib/messages";
import type { Lang } from "@/lib/occasions";
import { Invitation, SAMPLE } from "./fragments";

// Small, true-to-life pieces of the product for the landing's feature tiles.
// Sample names and numbers only; each sits on a tile, drawn in the product's own colours.

type Mock = Messages["landing"]["mock"];

const frame = "rounded-2xl bg-white p-3 text-[0.8125rem] text-ink-deep shadow-[0_1px_0_rgb(36_36_31/0.06),0_12px_28px_-18px_rgb(36_36_31/0.4)]";

export function MiniChat({ lang, name }: { lang: Lang; name: string }) {
  const s = SAMPLE[lang];
  const card = messages[lang].card;
  return (
    <div className="w-full max-w-[17rem] rounded-2xl bg-chat-bg p-2.5 text-[0.75rem] leading-snug">
      <div className="flex gap-2 rounded-xl rounded-ss-sm bg-white p-1.5">
        <Invitation lang={lang} className="w-[4.5rem] shrink-0 text-[0.22rem]" />
        <p className="line-clamp-5 py-0.5 text-ink-deep">{card.message(name, s.event, s.venue)}</p>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1">
        {[card.accept, card.decline].map((l) => (
          <span key={l} className="rounded-lg bg-white py-1.5 text-center font-medium text-[#027eb5]">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MiniPage({ M }: { M: Mock }) {
  const values = ["23", "04", "37"];
  return (
    <div className={`${frame} w-full max-w-[17rem]`}>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {values.map((v, i) => (
          <div key={i} className="rounded-xl bg-ivory py-2">
            <p className="font-editorial text-[1.5rem] leading-none tabular-nums">{v}</p>
            <p className="mt-1 text-[0.6875rem] text-ink-soft">{M.countdown[i]}</p>
          </div>
        ))}
      </div>
      <ol className="mt-2.5">
        {M.programme.map((p) => (
          <li key={p.title} className="flex gap-3 border-t border-ink-deep/10 py-1.5">
            <span className="w-14 shrink-0 tabular-nums text-ink-soft">{p.time}</span>
            {p.title}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function MiniHouseholds({ M }: { M: Mock }) {
  return (
    <ul className={`${frame} w-full max-w-[17rem] space-y-1`}>
      {M.households.map((h, i) => (
        <li key={h.name} className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pine-soft text-[0.75rem] font-medium text-pine">{h.name.charAt(0)}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{h.name}</span>
            <span className="block text-[0.6875rem] text-ink-soft">{M.of(h.coming, h.seats)}</span>
          </span>
          {i === 0 && (
            <span className="flex items-center gap-1 rounded-full bg-ivory p-0.5" aria-hidden="true">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white">
                <Minus size={11} />
              </span>
              <span className="w-3 text-center tabular-nums">{h.coming}</span>
              <span className="grid h-5 w-5 place-items-center rounded-full bg-pine text-white">
                <Plus size={11} />
              </span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function MiniReplies({ M }: { M: Mock }) {
  const parts = [
    { label: M.replies.coming, n: 64, color: "bg-pine" },
    { label: M.replies.waiting, n: 18, color: "bg-champagne" },
    { label: M.replies.declined, n: 9, color: "bg-[#c98b7a]" },
  ];
  const total = parts.reduce((a, p) => a + p.n, 0);
  return (
    <div className={`${frame} w-full max-w-[17rem]`}>
      <p className="font-editorial text-[2rem] leading-none tabular-nums">
        {parts[0].n}
        <span className="text-[1rem] text-ink-soft"> / {total}</span>
      </p>
      <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {parts.map((p) => (
          <span key={p.label} className={p.color} style={{ width: `${(p.n / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-3 space-y-1">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${p.color}`} />
            <span className="flex-1">{p.label}</span>
            <span className="tabular-nums text-ink-soft">{p.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MiniReminders({ M }: { M: Mock }) {
  return (
    <ul className="w-full max-w-[17rem] space-y-2">
      {M.reminders.map((r, i) => (
        <li key={r.title} className={`${frame} flex items-center gap-3`}>
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${i === 0 ? "bg-pine text-white" : "bg-ivory text-gold-ink"}`}>
            {i === 0 ? <Check size={15} /> : <Bell size={15} />}
          </span>
          <span>
            <span className="block font-medium">{r.title}</span>
            <span className="block text-[0.6875rem] text-ink-soft">{r.note}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MiniSheet({ M }: { M: Mock }) {
  return (
    <div className={`${frame} w-full max-w-[17rem] overflow-hidden p-0`}>
      <p className="flex items-center gap-2 border-b border-ink-deep/10 bg-[#eef5ef] px-3 py-2 text-[0.75rem] font-medium text-[#1d6b40]">
        <FileSpreadsheet size={14} /> guests.xlsx
      </p>
      <table className="w-full text-start text-[0.75rem]">
        <thead>
          <tr className="text-ink-soft">
            {M.sheet.map((h) => (
              <th key={h} className="border-b border-ink-deep/10 px-3 py-1.5 text-start font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {M.sheetRows.map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td key={i} dir={i === 1 ? "ltr" : undefined} className={`border-b border-ink-deep/5 px-3 py-1.5 ${i === 2 ? "tabular-nums" : ""} ${i === 1 ? "text-ink-soft rtl:text-right" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// The door check-in screen at the moment a pass is read.
export function MiniScanner({ M, name, qr }: { M: Mock; name: string; qr: string }) {
  return (
    <div className="mx-auto w-[min(100%,15rem)] rounded-[2.2rem] bg-[#0e0f0d] p-2 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)] ring-1 ring-white/10">
      <div className="overflow-hidden rounded-[1.7rem] bg-[#1b1d1a] text-white">
        <p className="flex items-center gap-1.5 px-4 pt-4 text-[0.6875rem] uppercase tracking-[0.14em] text-white/60 rtl:tracking-normal">
          <ScanLine size={12} /> {M.atDoor}
        </p>
        <div className="relative mx-auto my-5 w-[62%]">
          <div className="rounded-lg bg-white p-2 [&>svg]:h-auto [&>svg]:w-full" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qr }} />
          {["start-[-8px] top-[-8px] border-s-2 border-t-2 rounded-ss-lg", "end-[-8px] top-[-8px] border-e-2 border-t-2 rounded-se-lg", "start-[-8px] bottom-[-8px] border-s-2 border-b-2 rounded-es-lg", "end-[-8px] bottom-[-8px] border-e-2 border-b-2 rounded-ee-lg"].map((c) => (
            <span key={c} className={`absolute h-6 w-6 border-champagne ${c}`} />
          ))}
        </div>
        <div className="m-2 rounded-2xl bg-white/[0.07] p-3.5">
          <p className="font-editorial text-[1.375rem] leading-tight">{M.scanWelcome(name)}</p>
          <p className="mt-0.5 text-[0.75rem] text-white/60">{M.scanSeats(3)}</p>
          <p className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-[#2f7a5c] py-2 text-[0.8125rem] font-medium">
            <CheckCircle2 size={14} /> {M.scanButton}
          </p>
        </div>
      </div>
    </div>
  );
}

export function MiniArrivals({ M }: { M: Mock }) {
  const total = M.arrivalsList.reduce((a, r) => a + r.n, 0);
  return (
    <div className="w-full max-w-[17rem] rounded-2xl bg-white/[0.06] p-4 text-[0.8125rem] text-white ring-1 ring-white/10">
      <p className="flex items-baseline justify-between">
        <span className="text-white/60">{M.arrivals}</span>
        <span className="font-editorial text-[1.75rem] leading-none tabular-nums">{total}</span>
      </p>
      <ul className="mt-3 divide-y divide-white/10">
        {M.arrivalsList.map((r) => (
          <li key={r.name} className="flex items-center gap-2 py-2">
            <CheckCircle2 size={14} className="shrink-0 text-[#7fc4a3]" />
            <span className="flex-1 truncate">{r.name}</span>
            <span className="tabular-nums text-white/60">
              {M.scanSeats(r.n)} · {r.at}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
