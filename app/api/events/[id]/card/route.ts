import { NextRequest, NextResponse } from "next/server";
import { requireEvent } from "@/lib/auth";
import { renderDesignHtml } from "@/lib/designs/render";
import { cardResponse } from "@/lib/designs/http";

// The event's chosen library design, filled with its own details.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireEvent(id);
  if (access instanceof NextResponse) return access;
  const { event } = access;
  if (!event.design) return new Response("No design chosen", { status: 404 });
  return cardResponse(renderDesignHtml(event.design, event.venue, event.eventDate, event.name), "private, no-store");
}
