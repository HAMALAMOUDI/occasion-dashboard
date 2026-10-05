"use client";

import { Guest, GuestStatus } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import Avatar from "./Avatar";
import { useMemo, useState } from "react";
import { postJson } from "@/lib/client";
import { Check, QrCode, Search, TriangleAlert, X } from "lucide-react";

type Filter = "all" | "accepted" | "declined" | "waiting" | "invalid";

const FILTERS: { id: Filter; label: string; match: (s: GuestStatus) => boolean }[] = [
  { id: "all", label: "Everyone", match: () => true },
  { id: "accepted", label: "Coming", match: (s) => s === "accepted" },
  { id: "declined", label: "Can't make it", match: (s) => s === "declined" },
  { id: "waiting", label: "Waiting", match: (s) => s === "pending" || s === "no_response" },
  { id: "invalid", label: "Number issue", match: (s) => s === "invalid" },
];

// Turns stored error codes into something an organizer can act on.
function describeError(code: string) {
  if (code.includes("invalid_number")) return "Check this number — it looks wrong or isn't on WhatsApp";
  if (code.includes("rate_limited")) return "WhatsApp was busy — try sending again shortly";
  if (code.includes("template_error")) return "The message template needs attention in WhatsApp Manager";
  if (code.startsWith("barcode_send_failed")) return "Their entry pass didn't send";
  if (code.startsWith("reminder_failed")) return "Their last reminder didn't send";
  if (code.includes("network_error")) return "Couldn't reach WhatsApp — try again";
  return "Last message didn't send";
}

export default function GuestTable({ guests, onChange }: { guests: Guest[]; onChange: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    const q = query.trim().toLowerCase();
    return guests.filter((g) => f.match(g.status) && (!q || g.name.toLowerCase().includes(q) || g.phone.includes(q)));
  }, [guests, filter, query]);

  async function respond(guestId: string, decision: "accept" | "decline") {
    setBusyId(guestId);
    setError(null);
    const result = await postJson(`/api/guests/${guestId}/respond`, { decision });
    setBusyId(null);
    if (!result.ok) setError(result.error);
    onChange();
  }

  if (guests.length === 0) {
    return (
      <div className="card px-6 py-10 text-center">
        <p className="font-serif text-xl">Your guest list is empty</p>
        <p className="text-sm text-muted mt-1">Upload a CSV above and invitations go out right away.</p>
      </div>
    );
  }

  const actions = (g: Guest) =>
    g.status === "pending" || g.status === "no_response" ? (
      <div className="flex gap-1.5" title="Record a reply yourself, e.g. if the guest called you">
        <button
          disabled={busyId === g.id}
          onClick={() => respond(g.id, "accept")}
          className="btn btn-sm whitespace-nowrap border border-line bg-surface hover:border-accept hover:bg-accept-bg hover:text-accept"
        >
          <Check size={13} /> Coming
        </button>
        <button
          disabled={busyId === g.id}
          onClick={() => respond(g.id, "decline")}
          className="btn btn-sm whitespace-nowrap border border-line bg-surface hover:border-decline hover:bg-decline-bg hover:text-decline"
        >
          <X size={13} /> Not coming
        </button>
      </div>
    ) : g.status === "accepted" && g.barcodeValue ? (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted font-mono" title="Entry pass code">
        <QrCode size={13} /> {g.barcodeValue}
      </span>
    ) : null;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 [scrollbar-width:none]">
          {FILTERS.map((f) => {
            const count = guests.filter((g) => f.match(g.status)).length;
            if (f.id !== "all" && count === 0) return null;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filter === f.id ? "bg-ink text-white" : "bg-paper text-muted hover:text-ink"
                }`}
              >
                {f.label} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
        <label className="relative sm:w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guests"
            aria-label="Search guests"
            className="input py-2 pl-9"
          />
        </label>
      </div>

      {error && <p className="px-4 pt-3 text-xs text-decline">{error}</p>}

      {visible.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted">No guests match that.</p>
      ) : (
        <ul className="divide-y divide-line">
          {visible.map((g) => (
            <li key={g.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={g.name} seed={g.id} />
                <div className="min-w-0">
                  <p className="font-medium truncate">{g.name}</p>
                  <p className="text-xs text-muted tabular-nums">{g.phone}</p>
                  {g.lastError && (
                    <p className="mt-0.5 flex items-start gap-1 text-[11px] text-decline">
                      <TriangleAlert size={11} className="mt-0.5 shrink-0" /> {describeError(g.lastError)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pl-[3.25rem] sm:pl-0 sm:justify-end">
                <StatusBadge status={g.status} />
                <div className="sm:w-52 sm:flex sm:justify-end">{actions(g)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
