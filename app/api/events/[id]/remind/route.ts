import { NextRequest, NextResponse } from "next/server";
import { requireEvent } from "@/lib/auth";
import { badRequest, conflict, readJson } from "@/lib/http";
import { ReminderKind, sendReminders } from "@/lib/rsvp";

// Reminders normally go out automatically via /api/cron/reminders. This
// manual trigger is for cases like a last-minute venue change; re-sending an
// already-sent reminder requires { force: true } so a double-click can't
// message (and bill) every guest twice.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireEvent(id);
  if (access instanceof NextResponse) return access;
  const { event } = access;

  const body = await readJson<{ kind: ReminderKind; force: boolean }>(req);
  const kind = body?.kind;
  if (kind !== "week" && kind !== "day") return badRequest("kind must be week or day");

  const result = await sendReminders(event, kind, { force: body?.force === true });
  if (!result.ok) return conflict("This reminder was already sent. Pass force: true to send it again.");
  return NextResponse.json({ sent: result.sent, failed: result.failed });
}
