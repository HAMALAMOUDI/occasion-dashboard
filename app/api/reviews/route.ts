import { NextResponse } from "next/server";
import { getMessages } from "@/lib/i18n-server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Every review, for admins to approve or hide.
export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (!user.isAdmin) return NextResponse.json({ error: (await getMessages()).errors.adminOnly }, { status: 403 });
  return NextResponse.json(await db.getReviews());
}
