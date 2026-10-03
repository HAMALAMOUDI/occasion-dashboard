import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Event } from "@/lib/types";
import { randomUUID } from "crypto";

export async function GET() {
  return NextResponse.json(db.getEvents());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, occasionType, eventDate, venue, inviterName, templateId } = body;

  if (!name || !occasionType || !eventDate || !inviterName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const event: Event = {
    id: randomUUID(),
    name,
    occasionType,
    eventDate,
    venue: venue || "",
    inviterName,
    templateId: templateId || null,
    reminderWeekSentAt: null,
    reminderDaySentAt: null,
    createdAt: new Date().toISOString(),
  };

  db.createEvent(event);
  db.upsertBilling({
    id: randomUUID(),
    eventId: event.id,
    conversationsUsed: 0,
    ratePerConversation: 0.35,
    invoiceStatus: "draft",
    issuedAt: null,
  });

  return NextResponse.json(event, { status: 201 });
}
