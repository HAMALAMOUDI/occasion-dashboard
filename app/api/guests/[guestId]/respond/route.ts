import { NextRequest, NextResponse } from "next/server";
import { badRequest, conflict, notFound, readJson } from "@/lib/http";
import { recordResponse } from "@/lib/rsvp";
import { RsvpDecision } from "@/lib/whatsapp";

// Lets the demo dashboard simulate a guest's button tap. Real taps arrive via
// /api/webhooks/whatsapp, which calls the same recordResponse().
export async function POST(req: NextRequest, { params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
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
