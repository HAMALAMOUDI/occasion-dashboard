import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { Guest } from "@/lib/types";
import { sendInvite } from "@/lib/whatsapp";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(db.getGuests(id));
}

// Expects a CSV with headers: name,phone  (case-insensitive)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = db.getEvent(id);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const body = await req.json();
  const csvText: string = body.csv;
  if (!csvText) return NextResponse.json({ error: "Missing csv field" }, { status: 400 });

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: "Could not parse CSV", details: parsed.errors }, { status: 400 });
  }

  const rows = parsed.data.filter((r) => r.name && r.phone);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows found. Expected columns: name, phone" }, { status: 400 });
  }

  const newGuests: Guest[] = rows.map((r) => ({
    id: randomUUID(),
    eventId: id,
    name: r.name.trim(),
    phone: r.phone.trim(),
    status: "pending",
    inviteSentAt: null,
    respondedAt: null,
    barcodeValue: null,
    checkedInAt: null,
    lastError: null,
  }));

  db.addGuests(newGuests);

  // Fire off invites (stubbed — see lib/whatsapp.ts for the real API call shape)
  let sentCount = 0;
  let invalidCount = 0;
  for (const guest of newGuests) {
    const result = await sendInvite(guest, event);
    if (result.ok) {
      db.updateGuest(guest.id, { status: "no_response", inviteSentAt: new Date().toISOString() });
      sentCount++;
    } else {
      db.updateGuest(guest.id, { status: "invalid", lastError: result.error || "send_failed" });
      invalidCount++;
    }
  }

  const billing = db.getBillingForEvent(id);
  if (billing) {
    db.upsertBilling({ ...billing, conversationsUsed: billing.conversationsUsed + sentCount });
  }

  return NextResponse.json({ added: newGuests.length, sent: sentCount, invalid: invalidCount });
}
