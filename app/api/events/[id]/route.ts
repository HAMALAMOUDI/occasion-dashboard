import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/i18n-server";
import { db } from "@/lib/db";
import { requireEvent } from "@/lib/auth";
import { badRequest, notFound, readJson } from "@/lib/http";
import { computeStats } from "@/lib/rsvp";
import { Event } from "@/lib/types";
import { isLocale } from "@/lib/i18n";

// Fields an organizer may edit. Ids, timestamps, and reminder state are
// managed by the server.
const EDITABLE_FIELDS = ["name", "eventDate", "venue", "inviterName", "templateId", "language"] as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireEvent(id);
  if (access instanceof NextResponse) return access;
  const { event } = access;

  const guests = await db.getGuests(id);
  const billing = await db.getBillingForEvent(id) ?? null;

  return NextResponse.json({ event, guests, stats: computeStats(guests), billing });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = (await getMessages()).errors;
  const { id } = await params;
  const access = await requireEvent(id);
  if (access instanceof NextResponse) return access;

  const body = await readJson<Event>(req);
  if (!body) return badRequest(err.invalidBody);

  const patch: Partial<Event> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in body) Object.assign(patch, { [key]: body[key] });
  }
  if (patch.language !== undefined && !isLocale(patch.language)) return badRequest(err.invalidBody);
  if (patch.eventDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(patch.eventDate)) {
    return badRequest(err.invalidDate);
  }

  const updated = await db.updateEvent(id, patch);
  if (!updated) return notFound(err.eventNotFound);
  return NextResponse.json(updated);
}
