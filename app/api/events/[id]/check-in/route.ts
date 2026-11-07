import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/i18n-server";
import { requireEvent } from "@/lib/auth";
import { badRequest, readJson } from "@/lib/http";
import { checkIn } from "@/lib/rsvp";

// Door check-in: the organizer (or whoever holds their signed-in phone) scans a guest pass.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = (await getMessages()).errors;
  const { id } = await params;
  const access = await requireEvent(id);
  if (access instanceof NextResponse) return access;

  const body = await readJson<{ code: string }>(req);
  if (typeof body?.code !== "string" || !body.code.trim()) return badRequest(err.invalidBody);

  const result = await checkIn(access.event, body.code.slice(0, 64));
  if (!result.ok) {
    return NextResponse.json({ result: result.error, guest: result.guest && { name: result.guest.name } }, { status: result.error === "unknown_code" ? 404 : 409 });
  }
  const g = result.guest;
  return NextResponse.json({
    result: result.already ? "already" : "checked_in",
    guest: { id: g.id, name: g.name, seats: g.seats, attending: g.attending ?? g.seats, checkedInAt: g.checkedInAt },
  });
}
