import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Stats } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = db.getEvent(id);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const guests = db.getGuests(id);
  const stats: Stats = {
    total: guests.length,
    accepted: guests.filter((g) => g.status === "accepted").length,
    declined: guests.filter((g) => g.status === "declined").length,
    pending: guests.filter((g) => g.status === "pending" || g.status === "no_response").length,
    invalid: guests.filter((g) => g.status === "invalid").length,
  };

  const billing = db.getBillingForEvent(id);

  return NextResponse.json({ event, guests, stats, billing });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patch = await req.json();
  const updated = db.updateEvent(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
