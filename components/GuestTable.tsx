"use client";

import { Guest, GuestStatus } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import Avatar from "./Avatar";
import { useDeferredValue, useMemo, useState } from "react";
import { postJson, requestJson } from "@/lib/client";
import { formatNumber } from "@/lib/i18n";
import { MAX_NAME_LENGTH, MAX_PHONE_LENGTH } from "@/lib/guest-import";
import type { Messages } from "@/lib/messages";
import { toLatinDigits } from "@/lib/phone";
import { Check, Pencil, QrCode, Search, Trash2, TriangleAlert, X } from "lucide-react";
import { useLocale, useT } from "./I18nProvider";

type Filter = "all" | "accepted" | "declined" | "waiting" | "invalid";

// "Number issue" comes right after "Everyone": it's the one that needs action.
const FILTERS: { id: Filter; match: (s: GuestStatus) => boolean; rsvpOnly?: boolean }[] = [
  { id: "all", match: () => true },
  { id: "invalid", match: (s) => s === "invalid" },
  { id: "accepted", match: (s) => s === "accepted", rsvpOnly: true },
  { id: "declined", match: (s) => s === "declined", rsvpOnly: true },
  { id: "waiting", match: (s) => s === "pending" || s === "no_response", rsvpOnly: true },
];

// Rows rendered at a time; a 2,000-guest list renders in steps instead of all at once.
const PAGE = 100;

// Ignores what people type either way in Arabic: vowel marks and tatweel,
// hamza forms (أحمد / احمد), alef maqsura and taa marbuta (فاطمة / فاطمه).
function searchKey(s: string) {
  return toLatinDigits(s)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

// Phones are stored as +9665…; "0501234567", "00966 50…" and "٠٥٠…" should all find them.
function phoneDigits(q: string) {
  return toLatinDigits(q).replace(/\D/g, "").replace(/^00/, "").replace(/^966/, "").replace(/^0/, "");
}

function filterLabel(t: Messages, id: Filter) {
  return { all: t.guests.everyone, accepted: t.status.accepted, declined: t.status.declined, waiting: t.guests.waiting, invalid: t.status.invalid }[id];
}

// Turns stored error codes into something an organizer can act on.
function describeError(t: Messages["guests"]["errors"], code: string) {
  if (code.includes("invalid_number")) return t.invalidNumber;
  if (code.includes("rate_limited")) return t.rateLimited;
  if (code.includes("template_error")) return t.templateError;
  if (code.startsWith("barcode_send_failed")) return t.barcodeFailed;
  if (code.startsWith("reminder_failed")) return t.reminderFailed;
  if (code.includes("network_error")) return t.network;
  return t.generic;
}

// `rsvp: false` (condolences) hides reply filters and the Coming / Not coming buttons.
export default function GuestTable({ guests, rsvp = true, onChange }: { guests: Guest[]; rsvp?: boolean; onChange: () => void }) {
  const t = useT();
  const locale = useLocale();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [editing, setEditing] = useState<{ id: string; name: string; phone: string } | null>(null);
  // Typing stays responsive on long lists; the filtered rows catch up a frame later.
  const deferredQuery = useDeferredValue(query);

  const keys = useMemo(() => new Map(guests.map((g) => [g.id, searchKey(g.name)])), [guests]);
  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, guests.filter((g) => f.match(g.status)).length])) as Record<Filter, number>,
    [guests],
  );

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    const raw = deferredQuery.trim();
    const q = searchKey(raw);
    const digits = phoneDigits(raw);
    return guests.filter(
      (g) =>
        f.match(g.status) &&
        (!q || keys.get(g.id)!.includes(q) || g.phone.includes(raw) || (digits.length >= 3 && g.phone.includes(digits))),
    );
  }, [guests, keys, filter, deferredQuery]);

  async function respond(guestId: string, decision: "accept" | "decline") {
    setBusyId(guestId);
    setError(null);
    const result = await postJson(`/api/guests/${guestId}/respond`, { decision });
    setBusyId(null);
    if (!result.ok) setError(result.error);
    onChange();
  }

  async function saveEdit(g: Guest) {
    if (!editing) return;
    const phoneChanged = editing.phone.replace(/[\s\-()]/g, "") !== g.phone;
    if (phoneChanged && (g.status === "accepted" || g.status === "declined") && !window.confirm(t.guests.confirmPhoneChange(g.name))) {
      return;
    }
    setBusyId(g.id);
    setError(null);
    const result = await requestJson("PATCH", `/api/guests/${g.id}`, {
      name: editing.name,
      ...(phoneChanged ? { phone: editing.phone } : {}),
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(null);
    onChange();
  }

  async function remove(g: Guest) {
    if (!window.confirm(t.guests.confirmRemove(g.name))) return;
    setBusyId(g.id);
    setError(null);
    const result = await requestJson("DELETE", `/api/guests/${g.id}`);
    setBusyId(null);
    if (!result.ok) setError(result.error);
    onChange();
  }

  if (guests.length === 0) {
    return (
      <div className="card px-6 py-10 text-center">
        <p className="font-serif text-xl">{t.guests.emptyTitle}</p>
        <p className="text-sm text-muted mt-1">{t.guests.emptyBody}</p>
      </div>
    );
  }

  const actions = (g: Guest) =>
    g.status === "invalid" ? (
      <button
        onClick={() => setEditing({ id: g.id, name: g.name, phone: g.phone })}
        className="btn btn-sm whitespace-nowrap border border-line bg-surface hover:border-pine hover:bg-pine-soft hover:text-pine"
      >
        <Pencil size={13} /> {t.guests.fixNumber}
      </button>
    ) : !rsvp ? null : g.status === "pending" || g.status === "no_response" ? (
      <div className="flex gap-1.5" title={t.guests.recordReplyHint}>
        <button
          disabled={busyId === g.id}
          onClick={() => respond(g.id, "accept")}
          className="btn btn-sm whitespace-nowrap border border-line bg-surface hover:border-accept hover:bg-accept-bg hover:text-accept"
        >
          <Check size={13} /> {t.guests.markComing}
        </button>
        <button
          disabled={busyId === g.id}
          onClick={() => respond(g.id, "decline")}
          className="btn btn-sm whitespace-nowrap border border-line bg-surface hover:border-decline hover:bg-decline-bg hover:text-decline"
        >
          <X size={13} /> {t.guests.markNotComing}
        </button>
      </div>
    ) : g.status === "accepted" && g.barcodeValue ? (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted font-mono" title={t.guests.entryPass} dir="ltr">
        <QrCode size={13} /> {g.barcodeValue}
      </span>
    ) : null;

  return (
    <div className="card overflow-hidden @container">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Chips wrap rather than scroll, so no filter is ever hidden off the edge. */}
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {FILTERS.filter((f) => rsvp || !f.rsvpOnly).map((f) => {
            const count = counts[f.id];
            if (f.id !== "all" && count === 0) return null;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setFilter(f.id);
                  setLimit(PAGE);
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filter === f.id ? "bg-ink text-white" : "bg-paper text-muted hover:text-ink"
                }`}
              >
                {filterLabel(t, f.id)} <span className="opacity-60 tabular-nums">{formatNumber(count, locale)}</span>
              </button>
            );
          })}
        </div>
        <label className="relative sm:w-56 sm:shrink-0">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder={t.guests.search}
            aria-label={t.guests.search}
            className="input py-2 ps-9"
          />
        </label>
      </div>

      {error && <p className="px-4 pt-3 text-xs text-decline">{error}</p>}

      {visible.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted">{t.guests.noMatch}</p>
      ) : (
        <ul className="divide-y divide-line">
          {visible.slice(0, limit).map((g) =>
            editing?.id === g.id ? (
              <li key={g.id} className="bg-pine-soft/40 px-4 py-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit(g);
                  }}
                  className="flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="label">{t.guests.name}</span>
                      <input
                        autoFocus
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        maxLength={MAX_NAME_LENGTH}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="label">{t.guests.phone}</span>
                      <input
                        type="tel"
                        inputMode="tel"
                        dir="ltr"
                        value={editing.phone}
                        onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                        maxLength={MAX_PHONE_LENGTH}
                        className="input tabular-nums rtl:text-end"
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={busyId === g.id} className="btn-primary btn-md">
                      {busyId === g.id ? t.guests.saving : t.guests.save}
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className="btn-secondary btn-md">
                      {t.guests.cancel}
                    </button>
                  </div>
                </form>
                <p className="mt-2 text-xs text-muted">{t.guests.newNumberHint}</p>
              </li>
            ) : (
              <li key={g.id} className="flex flex-col gap-3 px-4 py-3.5 @2xl:flex-row @2xl:items-center @2xl:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={g.name} seed={g.id} />
                  <div className="min-w-0">
                    {/* bdi keeps an Arabic name's start visible in an English list (and vice versa) when it's cut. */}
                    <p className="font-medium line-clamp-2 break-words" title={g.name}>
                      <bdi>{g.name}</bdi>
                    </p>
                    <p className="text-xs text-muted tabular-nums">
                      <span dir="ltr" className="break-all">
                        {g.phone}
                      </span>
                    </p>
                    {g.lastError && (
                      <p className="mt-0.5 flex items-start gap-1 text-[11px] text-decline">
                        <TriangleAlert size={11} className="mt-0.5 shrink-0" /> {describeError(t.guests.errors, g.lastError)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 ps-[3.25rem] @2xl:ps-0 @2xl:justify-end">
                  <StatusBadge status={g.status} rsvp={rsvp} />
                  <div className="@2xl:w-52 @2xl:flex @2xl:justify-end">{actions(g)}</div>
                  <div className="ms-auto flex gap-0.5 @2xl:ms-0">
                    <button
                      onClick={() => setEditing({ id: g.id, name: g.name, phone: g.phone })}
                      disabled={busyId === g.id}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-paper hover:text-ink"
                      aria-label={t.guests.edit(g.name)}
                      title={t.guests.edit(g.name)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => remove(g)}
                      disabled={busyId === g.id}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-decline-bg hover:text-decline"
                      aria-label={t.guests.remove(g.name)}
                      title={t.guests.remove(g.name)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {visible.length > limit && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <p className="text-xs text-muted tabular-nums">
            {t.guests.showing(formatNumber(limit, locale), formatNumber(visible.length, locale))}
          </p>
          <button onClick={() => setLimit((n) => n + PAGE)} className="btn-secondary btn-sm">
            {t.guests.showMore}
          </button>
        </div>
      )}
    </div>
  );
}
