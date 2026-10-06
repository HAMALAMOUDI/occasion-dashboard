import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/i18n-server";
import { startSession, verifyLoginCode } from "@/lib/auth";
import { badRequest, readJson } from "@/lib/http";

// Step 2 of sign-in: check the code and start a session.
export async function POST(req: NextRequest) {
  const err = (await getMessages()).errors;
  const body = await readJson<{ phone: string; code: string }>(req);
  if (typeof body?.phone !== "string" || typeof body?.code !== "string") return badRequest(err.enterCode);

  const result = await verifyLoginCode(body.phone, body.code.trim());
  if (!result.ok) {
    return NextResponse.json({ error: err.wrongCode }, { status: 401 });
  }

  await startSession(result.phone);
  return NextResponse.json({ phone: result.phone });
}
