import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const billing = db.getAllBilling();
  const events = db.getEvents();
  const merged = billing.map((b) => ({
    ...b,
    eventName: events.find((e) => e.id === b.eventId)?.name || "Unknown event",
  }));
  return NextResponse.json(merged);
}
