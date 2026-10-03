import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendReminder } from "@/lib/whatsapp";

// In production this is called by a scheduled job (cron / BullMQ), not a
// manual button — but the organizer dashboard also exposes a manual trigger
// for cases like a last-minute venue change.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = db.getEvent(id);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { kind } = await req.json(); // "week" | "day"
  if (kind !== "week" && kind !== "day") {
    return NextResponse.json({ error: "kind must be week or day" }, { status: 400 });
  }

  const accepted = db.getGuests(id).filter((g) => g.status === "accepted");

  let sent = 0;
  for (const guest of accepted) {
    const result = await sendReminder(guest, event, kind);
    if (result.ok) sent++;
  }

  db.updateEvent(id, kind === "week" ? { reminderWeekSentAt: new Date().toISOString() } : { reminderDaySentAt: new Date().toISOString() });

  const billing = db.getBillingForEvent(id);
  if (billing) db.upsertBilling({ ...billing, conversationsUsed: billing.conversationsUsed + sent });

  return NextResponse.json({ sent });
}
