import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { badRequest, conflict, notFound, readJson } from "@/lib/http";
import { messages } from "@/lib/messages";
import { readSeats, recordResponse } from "@/lib/rsvp";
import { RsvpDecision } from "@/lib/whatsapp";

// A guest's reply from their own invitation page. Public: the token in the
// link is the guest's credential (as the quick-reply payload is on WhatsApp),
// and it only ever acts on that one guest.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await db.getGuestByToken(token);
  const event = guest && (await db.getEvent(guest.eventId));
  // Errors in the invitation's own language, whatever the visitor's browser says.
  const err = messages[event?.language ?? "ar"].errors;
  if (!guest || !event) return notFound(err.inviteNotFound);

  const body = await readJson<{ decision: RsvpDecision; attending: number }>(req);
  const decision = body?.decision;
  if (decision !== "accept" && decision !== "decline") return badRequest(err.invalidDecision);
  const attending = decision === "accept" ? readSeats(body?.attending, guest.seats) : undefined;

  const result = await recordResponse(guest.id, decision, attending);
  if (!result.ok) {
    if (result.error === "guest_not_invitable") return conflict(err.guestNotInvitable);
    if (result.error === "no_rsvp") return conflict(err.noRsvp);
    return notFound(err.inviteNotFound);
  }
  const g = result.guest;
  const pass = g.status === "accepted" && g.barcodeValue ? await QRCode.toString(g.barcodeValue, { type: "svg", margin: 1 }) : null;
  return NextResponse.json({ status: g.status, attending: g.attending, seats: g.seats, barcodeValue: g.barcodeValue, pass });
}
