import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getMessages } from "@/lib/i18n-server";
import { requireEvent } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, conflict, readJson } from "@/lib/http";

// The organizer's review of Hikayati for this event: one per event, held for
// an admin to approve before it's shown on the landing page.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireEvent(id);
  if (access instanceof NextResponse) return access;
  return NextResponse.json((await db.getReviewForEvent(id)) ?? null);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = (await getMessages()).errors;
  const { id } = await params;
  const access = await requireEvent(id);
  if (access instanceof NextResponse) return access;

  const body = await readJson<{ author: string; rating: number; body: string }>(req);
  const author = typeof body?.author === "string" ? body.author.trim().slice(0, 60) : "";
  const text = typeof body?.body === "string" ? body.body.trim().slice(0, 600) : "";
  const rating = body?.rating;
  if (!author || !text || typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return badRequest(err.invalidReview);
  }
  if (await db.getReviewForEvent(id)) return conflict(err.reviewExists);

  const review = await db.addReview({
    id: randomUUID(),
    eventId: id,
    ownerPhone: access.user.phone,
    author,
    rating,
    body: text,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json(review);
}
