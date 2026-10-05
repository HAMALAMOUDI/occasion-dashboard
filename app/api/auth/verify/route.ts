import { NextRequest, NextResponse } from "next/server";
import { startSession, verifyLoginCode } from "@/lib/auth";
import { badRequest, readJson } from "@/lib/http";

// Step 2 of sign-in: check the code and start a session.
export async function POST(req: NextRequest) {
  const body = await readJson<{ phone: string; code: string }>(req);
  if (typeof body?.phone !== "string" || typeof body?.code !== "string") return badRequest("Please enter the 6-digit code.");

  const result = await verifyLoginCode(body.phone, body.code.trim());
  if (!result.ok) {
    return NextResponse.json({ error: "That code isn't right or has expired. Check it, or ask for a new one." }, { status: 401 });
  }

  await startSession(result.phone);
  return NextResponse.json({ phone: result.phone });
}
