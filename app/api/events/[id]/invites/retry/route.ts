import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound } from "@/lib/http";
import { retryPendingInvites } from "@/lib/rsvp";

// Re-sends invites that failed with a transient error (rate limit, network).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.getEvent(id);
  if (!event) return notFound("Event not found");
  return NextResponse.json(await retryPendingInvites(event));
}
