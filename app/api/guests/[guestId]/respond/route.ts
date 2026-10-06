import { NextRequest, NextResponse } from "next/server";
import { badRequest, conflict, notFound, readJson } from "@/lib/http";
import { recordResponse } from "@/lib/rsvp";
import { requireGuest } from "@/lib/auth";
import { RsvpDecision } from "@/lib/whatsapp";

// Lets an organizer record a guest's reply themselves (e.g. the guest phoned).
// Taps on the WhatsApp buttons arrive via /api/webhooks/whatsapp, which calls
// the same recordResponse().
export async function POST(req: NextRequest, { params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  // Organizers may only record replies for guests on their own events.
  const access = await requireGuest(guestId);
  if (access instanceof NextResponse) return access;

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
