import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/i18n-server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, notFound, readJson } from "@/lib/http";
import type { Review } from "@/lib/types";

const STATUSES: Review["status"][] = ["pending", "approved", "hidden"];

// Admins approve a review for the landing page, or hide it.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const err = (await getMessages()).errors;
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (!user.isAdmin) return NextResponse.json({ error: err.adminOnly }, { status: 403 });

  const { reviewId } = await params;
  const body = await readJson<{ status: Review["status"] }>(req);
  if (!body?.status || !STATUSES.includes(body.status)) return badRequest(err.invalidBody);
  const review = await db.setReviewStatus(reviewId, body.status);
  return review ? NextResponse.json(review) : notFound();
}
