import { NextRequest, NextResponse } from "next/server";
import { badRequest, conflict, notFound, readJson } from "@/lib/http";
import { recordResponse } from "@/lib/rsvp";
import { canAccessEvent, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { RsvpDecision } from "@/lib/whatsapp";

// Lets an organizer record a guest's reply themselves (e.g. the guest phoned).
// Taps on the WhatsApp buttons arrive via /api/webhooks/whatsapp, which calls
// the same recordResponse().
export async function POST(req: NextRequest, { params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  // Organizers may only record replies for guests on their own events.
  const guest = await db.getGuest(guestId);
  const event = guest && (await db.getEvent(guest.eventId));
  if (!event || !canAccessEvent(user, event)) return notFound("Guest not found");

  const body = await readJson<{ decision: RsvpDecision }>(req);
  const decision = body?.decision;

  if (decision !== "accept" && decision !== "decline") {
    return badRequest("decision must be accept or decline");
  }

  const result = await recordResponse(guestId, decision);
  if (!result.ok) {
    if (result.error === "guest_not_invitable") return conflict("Guest has an invalid number and was never invited");
    return notFound("Guest not found");
  }
  return NextResponse.json({ ...result.guest, barcodeDataUrl: result.barcodeDataUrl });
}
