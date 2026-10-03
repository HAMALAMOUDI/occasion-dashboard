import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const events = db.getEvents();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl">Your events</h1>
        <Link href="/events/new" className="text-sm px-3 py-1.5 rounded-md bg-pine text-paper hover:opacity-90">
          New event
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-ink/60">
          No events yet. <Link href="/events/new" className="underline">Create your first one</Link>.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/events/${e.id}`}
              className="block border border-line rounded-lg p-4 hover:border-ink/30 transition"
            >
              <p className="font-serif text-lg">{e.name}</p>
              <p className="text-sm text-ink/60 mt-1">
                {new Date(e.eventDate).toLocaleDateString()} {e.venue && `· ${e.venue}`}
              </p>
              <p className="text-xs text-ink/50 mt-2 capitalize">{e.occasionType}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
