import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { renderDesignHtml } from "@/lib/designs/render";
import { cardResponse } from "@/lib/designs/http";

// The event's card for a guest's invitation page. The token stands in for
// sign-in; the card shows only what the guest already received on WhatsApp.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await db.getGuestByToken(token);
  const event = guest && (await db.getEvent(guest.eventId));
  if (!event?.design) return new Response("No card", { status: 404 });
  return cardResponse(renderDesignHtml(event.design, event.venue, event.eventDate, event.name), "private, no-store");
}
