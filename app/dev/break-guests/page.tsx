import { notFound } from "next/navigation";
import Preview from "./Preview";
import { FIXTURES, type FixtureName } from "./fixtures";

// Dev-only stress test for GuestTable and StatsGrid: /dev/break-guests?data=worst
// Never served in production.
export default async function BreakGuestsPage({ searchParams }: { searchParams: Promise<{ data?: string; rsvp?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { data, rsvp } = await searchParams;
  const name: FixtureName = data && data in FIXTURES ? (data as FixtureName) : "demo";
  return <Preview name={name} rsvp={rsvp !== "0"} />;
}
