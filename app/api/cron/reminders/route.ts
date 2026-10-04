import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dueReminder, sendReminders } from "@/lib/rsvp";

// Sends any 7-day and same-day reminders that are due. Safe to call as often
// as you like (each reminder is sent at most once per event), so schedule it
// hourly, e.g. Vercel Cron, GitHub Actions, or plain crontab:
//
//   0 * * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/reminders
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  if (CRON_SECRET) {
    if (req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return new NextResponse("CRON_SECRET is not configured", { status: 503 });
  }

  const now = new Date();
  const runs: { eventId: string; eventName: string; kind: string; sent: number; failed: number }[] = [];

  for (const event of await db.getEvents()) {
    const kind = dueReminder(event, now);
    if (!kind) continue;
    const result = await sendReminders(event, kind);
    if (result.ok) runs.push({ eventId: event.id, eventName: event.name, kind, sent: result.sent, failed: result.failed });
  }

  return NextResponse.json({ ranAt: now.toISOString(), reminders: runs });
}
