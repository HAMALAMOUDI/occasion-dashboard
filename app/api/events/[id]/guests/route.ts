import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { badRequest, notFound, readJson } from "@/lib/http";
import { inviteGuests } from "@/lib/rsvp";

const MAX_ROWS = 5000;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(await db.getGuests(id));
}

// Expects a CSV with headers: name,phone  (case-insensitive). Phone numbers
// are normalized to E.164 and de-duplicated against the existing guest list,
// so re-uploading the same file never double-invites (or double-bills).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.getEvent(id);
  if (!event) return notFound("Event not found");

  const body = await readJson<{ csv: string }>(req);
  const csvText = body?.csv;
  if (typeof csvText !== "string" || !csvText.trim()) return badRequest("Missing csv field");

  const parsed = Papa.parse<Record<string, string>>(csvText.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    const where = first.row !== undefined ? ` (row ${first.row + 2})` : "";
    return badRequest(`Could not parse CSV: ${first.message}${where}`, { details: parsed.errors.slice(0, 10) });
  }

  const rows = parsed.data
    .filter((r) => r.name?.trim() && r.phone?.trim())
    .map((r) => ({ name: r.name, phone: r.phone }));
  if (rows.length === 0) return badRequest("No valid rows found. Expected columns: name, phone");
  if (rows.length > MAX_ROWS) return badRequest(`Too many rows (${rows.length}). Upload at most ${MAX_ROWS} guests at a time.`);

  return NextResponse.json(await inviteGuests(event, rows));
}
