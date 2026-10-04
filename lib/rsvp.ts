import { randomBytes, randomUUID } from "crypto";
import QRCode from "qrcode";
import { db, GuestPatch } from "./db";
import { normalizePhone } from "./phone";
import { Event, Guest, GuestStatus, Stats } from "./types";
import { RsvpDecision, sendBarcode, sendInvite, sendReminder } from "./whatsapp";

// Core RSVP workflow shared by the dashboard API routes, the WhatsApp webhook,
// and the scheduled reminder job — so all three behave identically.

const SEND_CONCURRENCY = 5;
const EVENT_TIMEZONE = process.env.EVENT_TIMEZONE || "Asia/Riyadh";

export function computeStats(guests: Guest[]): Stats {
  return {
    total: guests.length,
    accepted: guests.filter((g) => g.status === "accepted").length,
    declined: guests.filter((g) => g.status === "declined").length,
    pending: guests.filter((g) => g.status === "pending" || g.status === "no_response").length,
    invalid: guests.filter((g) => g.status === "invalid").length,
  };
}

// Runs `fn` over `items` with at most `limit` in flight — fast for big guest
// lists without tripping WhatsApp's per-number throughput limits.
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ---------------------------------------------------------------- invites

export interface InviteSummary {
  added: number;
  sent: number;
  invalid: number;
  failed: number;
  duplicates: number;
}

export async function inviteGuests(event: Event, rows: { name: string; phone: string }[]): Promise<InviteSummary> {
  const seen = new Set<string>();
  const candidates: Guest[] = [];

  for (const row of rows) {
    const normalized = normalizePhone(row.phone);
    const phone = normalized ?? row.phone.trim();
    if (seen.has(phone)) continue;
    seen.add(phone);
    candidates.push({
      id: randomUUID(),
      eventId: event.id,
      name: row.name.trim(),
      phone,
      status: normalized ? "pending" : "invalid",
      inviteSentAt: null,
      respondedAt: null,
      barcodeValue: null,
      checkedInAt: null,
      lastError: normalized ? null : "invalid_number",
    });
  }

  // Persist first so guests are never lost if sending is interrupted. The
  // store skips phones already on the event, so re-uploads never re-invite.
  const added = await db.addGuests(candidates);

  const delivery = await deliverInvites(
    event,
    added.filter((g) => g.status === "pending")
  );
  const preInvalid = added.filter((g) => g.status === "invalid").length;
  return {
    ...delivery,
    added: added.length,
    invalid: delivery.invalid + preInvalid,
    duplicates: rows.length - added.length,
  };
}

// Re-sends invites to guests still "pending" after a transient failure.
export async function retryPendingInvites(event: Event): Promise<InviteSummary> {
  const pending = (await db.getGuests(event.id)).filter((g) => g.status === "pending");
  return { ...(await deliverInvites(event, pending)), added: 0, duplicates: 0 };
}

async function deliverInvites(event: Event, guests: Guest[]) {
  const results = await mapWithConcurrency(guests, SEND_CONCURRENCY, (g) => sendInvite(g, event));
  const patches: (GuestPatch & { id: string })[] = [];
  let sent = 0;
  let invalid = 0;
  let failed = 0;
  guests.forEach((guest, i) => {
    const result = results[i];
    if (result.ok) {
      patches.push({ id: guest.id, status: "no_response", inviteSentAt: new Date().toISOString(), lastError: null });
      sent++;
    } else if (result.error === "invalid_number") {
      patches.push({ id: guest.id, status: "invalid", lastError: result.error });
      invalid++;
    } else {
      // Transient failure (rate limit, network) — leave as pending so it can be retried.
      patches.push({ id: guest.id, lastError: result.error });
      failed++;
    }
  });
  // Guarded so a guest who already tapped Accept while the rest of the batch
  // was still sending isn't reset to "no response".
  await db.updateGuests(patches, { ifStatusIn: ["pending"] });
  await db.addConversations(event.id, sent);
  return { sent, invalid, failed };
}

// ---------------------------------------------------------------- responses

export type RespondResult =
  | { ok: true; guest: Guest; barcodeDataUrl?: string; changed: boolean }
  | { ok: false; error: "guest_not_found" | "guest_not_invitable" | "event_not_found" };

function newBarcodeValue() {
  // 64 bits of randomness — unguessable, unlike a slice of the guest UUID.
  return `INV-${randomBytes(8).toString("hex").toUpperCase()}`;
}

export async function recordResponse(guestId: string, decision: RsvpDecision): Promise<RespondResult> {
  const guest = await db.getGuest(guestId);
  if (!guest) return { ok: false, error: "guest_not_found" };
  if (guest.status === "invalid") return { ok: false, error: "guest_not_invitable" };
  const event = await db.getEvent(guest.eventId);
  if (!event) return { ok: false, error: "event_not_found" };

  const target: GuestStatus = decision === "accept" ? "accepted" : "declined";
  // Only transition from a different, answerable status. This makes repeats
  // idempotent (Meta retries webhooks; guests double-tap) even when two
  // deliveries arrive at the same moment.
  const guard = { ifStatusIn: (["pending", "no_response", "accepted", "declined"] as GuestStatus[]).filter((s) => s !== target) };
  const now = new Date().toISOString();

  if (decision === "decline") {
    const updated = await db.updateGuest(guestId, { status: "declined", respondedAt: now, barcodeValue: null }, guard);
    return { ok: true, guest: updated ?? (await db.getGuest(guestId))!, changed: Boolean(updated) };
  }

  const barcodeValue = newBarcodeValue();
  const updated = await db.updateGuest(guestId, { status: "accepted", respondedAt: now, barcodeValue, lastError: null }, guard);
  if (!updated) return { ok: true, guest: (await db.getGuest(guestId))!, changed: false };

  const png = await QRCode.toBuffer(barcodeValue, { margin: 1, width: 480 });
  const sendResult = await sendBarcode(updated, event, png);
  const final = sendResult.ok
    ? updated
    : ((await db.updateGuest(guestId, { lastError: `barcode_send_failed: ${sendResult.error}` })) ?? updated);

  return { ok: true, guest: final, barcodeDataUrl: `data:image/png;base64,${png.toString("base64")}`, changed: true };
}

// ---------------------------------------------------------------- reminders

export type ReminderKind = "week" | "day";

export type ReminderResult =
  | { ok: true; sent: number; failed: number }
  | { ok: false; error: "already_sent" };

export async function sendReminders(event: Event, kind: ReminderKind, opts: { force?: boolean } = {}): Promise<ReminderResult> {
  const field = kind === "week" ? "reminderWeekSentAt" : "reminderDaySentAt";

  // Claim the slot atomically before sending, so a double-click or
  // overlapping cron run can't send (and bill) the same reminder twice.
  if (!(await db.claimReminder(event.id, field, opts.force === true))) return { ok: false, error: "already_sent" };

  const accepted = (await db.getGuests(event.id)).filter((g) => g.status === "accepted");
  const results = await mapWithConcurrency(accepted, SEND_CONCURRENCY, (g) => sendReminder(g, event, kind));

  await db.updateGuests(
    results.flatMap((r, i) => (r.ok ? [] : [{ id: accepted[i].id, lastError: `reminder_failed: ${r.error}` }]))
  );

  const sent = results.filter((r) => r.ok).length;
  await db.addConversations(event.id, sent);
  return { ok: true, sent, failed: results.length - sent };
}

// Whole days from "today" (in the organizer's timezone) until the event date.
export function daysUntilEvent(event: Event, now = new Date()): number {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: EVENT_TIMEZONE }).format(now); // YYYY-MM-DD
  const toUtcMidnight = (ymd: string) => Date.parse(`${ymd.slice(0, 10)}T00:00:00Z`);
  return Math.round((toUtcMidnight(event.eventDate) - toUtcMidnight(today)) / 86_400_000);
}

// Which reminder (if any) the scheduler should send for this event right now.
export function dueReminder(event: Event, now = new Date()): ReminderKind | null {
  const days = daysUntilEvent(event, now);
  if (days === 0 && !event.reminderDaySentAt) return "day";
  if (days > 0 && days <= 7 && !event.reminderWeekSentAt) return "week";
  return null;
}
