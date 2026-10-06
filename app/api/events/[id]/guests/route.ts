import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { requireEvent } from "@/lib/auth";
import { badRequest, readJson } from "@/lib/http";
import { extractGuestRows, GuestRow } from "@/lib/guest-import";
import { inviteGuests } from "@/lib/rsvp";

const MAX_ROWS = 5000;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireEvent(id);
  if (access instanceof NextResponse) return access;
  return NextResponse.json(await db.getGuests(id));
}

// Adds guests and sends their invites. Accepts either
//   { rows: [{ name, phone }] }  — from the Excel upload or the "Add guest" form
//   { csv: "..." }               — raw CSV text
// Phone numbers are normalized to E.164 and de-duplicated against the existing
// guest list, so re-uploading the same file never double-invites (or double-bills).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireEvent(id);
  if (access instanceof NextResponse) return access;
  const { event } = access;

  const body = await readJson<{ rows: unknown; csv: unknown }>(req);
  let rows: GuestRow[];

  if (Array.isArray(body?.rows)) {
    rows = body.rows
      .filter((r): r is GuestRow => typeof r?.name === "string" && typeof r?.phone === "string")
      .map((r) => ({ name: r.name.trim(), phone: r.phone.trim() }))
      .filter((r) => r.name && r.phone);
  } else if (typeof body?.csv === "string" && body.csv.trim()) {
    const parsed = Papa.parse<string[]>(body.csv.replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
    rows = extractGuestRows(parsed.data).rows;
  } else {
    return badRequest("Please add at least one guest.");
  }

  if (rows.length === 0) return badRequest("We couldn't find any guests. Each row needs a name and a mobile number.");
  if (rows.length > MAX_ROWS) return badRequest(`Too many guests (${rows.length}). Add at most ${MAX_ROWS} at a time.`);

  return NextResponse.json(await inviteGuests(event, rows));
}
