"use client";

import Link from "next/link";
import GuestTable from "@/components/GuestTable";
import RsvpBar from "@/components/RsvpBar";
import StatsGrid from "@/components/StatsGrid";
import { FIXTURES, statsOf, type FixtureName } from "./fixtures";

const STATES: { id: FixtureName; label: string }[] = [
  { id: "demo", label: "Demo data" },
  { id: "worst", label: "Worst case" },
  { id: "empty", label: "Empty" },
  { id: "one", label: "One" },
  { id: "huge", label: "2,000 rows" },
];

const TOGGLE: React.CSSProperties = {
  position: "fixed",
  bottom: 16,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 50,
  display: "flex",
  gap: 2,
  maxWidth: "calc(100vw - 32px)",
  overflowX: "auto",
  padding: 4,
  borderRadius: 999,
  background: "#e5e5e5",
  font: "12px system-ui, sans-serif",
  whiteSpace: "nowrap",
  boxShadow: "0 1px 3px rgba(0,0,0,.15)",
};
const SEGMENT: React.CSSProperties = { padding: "6px 12px", borderRadius: 999, color: "#525252" };
const ACTIVE: React.CSSProperties = { ...SEGMENT, background: "#fff", color: "#000", boxShadow: "0 1px 2px rgba(0,0,0,.1)" };

// Same column the event page gives these components: max-w-5xl, 20rem sidebar at lg.
export default function Preview({ name, rsvp }: { name: FixtureName; rsvp: boolean }) {
  const guests = FIXTURES[name];
  return (
    <main className="min-h-screen bg-paper px-4 pt-6 pb-28 sm:px-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="card p-5">
          <RsvpBar stats={statsOf(guests)} label={`${guests.length} guests`} className="h-2.5" />
        </div>
        <StatsGrid stats={statsOf(guests)} rsvp={rsvp} />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="min-w-0">
            <h2 className="font-serif text-xl mb-4">
              Guest list <span className="text-muted text-base">({guests.length})</span>
            </h2>
            <GuestTable key={name} guests={guests} rsvp={rsvp} onChange={() => {}} />
          </section>
          <aside className="hidden lg:block rounded-2xl border border-dashed border-line" />
        </div>
      </div>

      {/* Test chrome, not part of the design under test: inline styles keep it plain and independent of the theme. */}
      <nav dir="ltr" style={TOGGLE}>
        {STATES.map((s) => (
          <Link key={s.id} href={`?data=${s.id}${rsvp ? "" : "&rsvp=0"}`} style={s.id === name ? ACTIVE : SEGMENT}>
            {s.label}
          </Link>
        ))}
        <Link href={`?data=${name}${rsvp ? "&rsvp=0" : ""}`} style={SEGMENT}>
          {rsvp ? "RSVP" : "No RSVP"}
        </Link>
      </nav>
    </main>
  );
}
