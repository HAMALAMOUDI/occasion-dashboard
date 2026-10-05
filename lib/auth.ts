import { cache } from "react";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { db } from "./db";
import { normalizePhone } from "./phone";
import { Event } from "./types";
import { isLiveMode, sendLoginCode } from "./whatsapp";

// Organizer sign-in by mobile number. A 6-digit code is sent to the number on
// WhatsApp, which proves the person holds that phone. Signing in creates a
// database-backed session; the browser only holds a random token in an
// HttpOnly cookie.
//
// Every route that reads or changes event data goes through requireUser() /
// requireEvent() below, so organizers only ever see their own events.

export const SESSION_COOKIE = "occasion_session";
const SESSION_DAYS = 30;
const CODE_TTL_MINUTES = 10;
const CODE_RESEND_SECONDS = 60;
const MAX_CODE_ATTEMPTS = 5;

// Comma-separated numbers that can see every event, including ones created
// before sign-in existed (which have no owner).
const ADMIN_PHONES = new Set(
  (process.env.ADMIN_PHONES || "")
    .split(",")
    .map((p) => normalizePhone(p))
    .filter((p): p is string => Boolean(p))
);

// Until WhatsApp is connected there is no way to deliver a code, so the code
// is returned to the sign-in screen instead. Set AUTH_DEMO_CODES=false to turn
// that off (sign-in then requires a live WhatsApp connection).
export const showDemoCodes = !isLiveMode && process.env.AUTH_DEMO_CODES !== "false";

export interface User {
  phone: string;
  isAdmin: boolean;
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const hashCode = (phone: string, code: string) => sha256(`${phone}:${code}`);

// ------------------------------------------------------------ sign-in

export type RequestCodeResult =
  | { ok: true; phone: string; demoCode?: string }
  | { ok: false; error: "invalid_phone" | "too_soon" | "send_failed"; retryAfter?: number };

export async function requestLoginCode(rawPhone: string): Promise<RequestCodeResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "invalid_phone" };

  const existing = await db.getLoginCode(phone);
  if (existing) {
    const elapsed = (Date.now() - Date.parse(existing.createdAt)) / 1000;
    if (elapsed < CODE_RESEND_SECONDS) {
      return { ok: false, error: "too_soon", retryAfter: Math.ceil(CODE_RESEND_SECONDS - elapsed) };
    }
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const now = new Date();
  await db.saveLoginCode({
    phone,
    codeHash: hashCode(phone, code),
    attempts: 0,
    expiresAt: new Date(now.getTime() + CODE_TTL_MINUTES * 60_000).toISOString(),
    createdAt: now.toISOString(),
  });

  const sent = await sendLoginCode(phone, code);
  if (!sent.ok) return { ok: false, error: "send_failed" };
  return { ok: true, phone, demoCode: showDemoCodes ? code : undefined };
}

export async function verifyLoginCode(rawPhone: string, code: string): Promise<{ ok: true; phone: string } | { ok: false }> {
  const phone = normalizePhone(rawPhone);
  if (!phone || !/^\d{6}$/.test(code)) return { ok: false };

  const record = await db.countLoginAttempt(phone, MAX_CODE_ATTEMPTS);
  if (!record) return { ok: false };

  const expected = Buffer.from(record.codeHash);
  const actual = Buffer.from(hashCode(phone, code));
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return { ok: false };

  // Single use: only the request that deletes the code gets the session.
  if (!(await db.consumeLoginCode(phone, record.codeHash))) return { ok: false };
  return { ok: true, phone };
}

export async function startSession(phone: string) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  await db.createSession({ tokenHash: sha256(token), phone, expiresAt: expires.toISOString(), createdAt: now.toISOString() });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.deleteSession(sha256(token));
  store.delete(SESSION_COOKIE);
}

// ------------------------------------------------------------ access checks

// Memoized per request, so pages and data calls share one session lookup.
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.getSession(sha256(token));
  if (!session) return null;
  return { phone: session.phone, isAdmin: ADMIN_PHONES.has(session.phone) };
});

export function canAccessEvent(user: User, event: Event) {
  return user.isAdmin || event.ownerPhone === user.phone;
}

export async function eventsFor(user: User): Promise<Event[]> {
  return user.isAdmin ? db.getEvents() : db.getEventsByOwner(user.phone);
}

const unauthorized = () => NextResponse.json({ error: "Please sign in again." }, { status: 401 });

// For route handlers: the signed-in user, or a 401 response to return as-is.
export async function requireUser(): Promise<User | NextResponse> {
  return (await currentUser()) ?? unauthorized();
}

// For route handlers: the event if the signed-in user owns it. Someone else's
// event is reported as "not found" so its existence isn't revealed.
export async function requireEvent(eventId: string): Promise<{ user: User; event: Event } | NextResponse> {
  const user = await currentUser();
  if (!user) return unauthorized();
  const event = await db.getEvent(eventId);
  if (!event || !canAccessEvent(user, event)) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return { user, event };
}
