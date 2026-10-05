import { NextRequest, NextResponse } from "next/server";
import { requireEvent } from "@/lib/auth";
import { retryPendingInvites } from "@/lib/rsvp";

// Re-sends invites that failed with a transient error (rate limit, network).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireEvent(id);
  if (access instanceof NextResponse) return access;
  const { event } = access;
  return NextResponse.json(await retryPendingInvites(event));
}
