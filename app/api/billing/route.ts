import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eventsFor, requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const events = await eventsFor(user);
  const names = new Map(events.map((e) => [e.id, e.name]));
  const billing = (await db.getAllBilling()).filter((b) => names.has(b.eventId));
  return NextResponse.json(billing.map((b) => ({ ...b, eventName: names.get(b.eventId)! })));
}
