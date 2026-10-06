import { NextRequest, NextResponse } from "next/server";
import { requireGuest } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, conflict, notFound, readJson } from "@/lib/http";
import { editGuest } from "@/lib/rsvp";

// Edit a guest's name and/or phone. Changing the phone re-sends the invite.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  const access = await requireGuest(guestId);
  if (access instanceof NextResponse) return access;

  const body = await readJson<{ name: string; phone: string }>(req);
  if (!body) return badRequest("Invalid JSON body");
  const changes = {
    name: typeof body.name === "string" ? body.name : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
  };
  if (changes.name === undefined && changes.phone === undefined) return badRequest("Nothing to update.");

  const result = await editGuest(access.event, access.guest, changes);
  if (result.ok) return NextResponse.json({ ...result.guest, reinvited: result.reinvited });

  switch (result.error) {
    case "invalid_name":
      return badRequest("Please enter the guest's name.");
    case "invalid_phone":
      return badRequest("That doesn't look like a valid mobile number.");
    case "duplicate_phone":
      return conflict("Another guest on this event already has that number.");
    default:
      return notFound("Guest not found");
  }
}

// Remove a guest from the event. Messages already sent (and billed) are unaffected.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  const access = await requireGuest(guestId);
  if (access instanceof NextResponse) return access;

  if (!(await db.deleteGuest(guestId))) return notFound("Guest not found");
  return NextResponse.json({ deleted: true });
}
