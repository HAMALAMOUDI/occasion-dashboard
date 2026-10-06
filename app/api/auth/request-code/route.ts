import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/i18n-server";
import { requestLoginCode } from "@/lib/auth";
import { badRequest, readJson } from "@/lib/http";

// Step 1 of sign-in: send a one-time code to the organizer's WhatsApp.
export async function POST(req: NextRequest) {
  const err = (await getMessages()).errors;
  const body = await readJson<{ phone: string }>(req);
  if (typeof body?.phone !== "string") return badRequest(err.enterPhone);

  const result = await requestLoginCode(body.phone);
  if (result.ok) return NextResponse.json({ phone: result.phone, demoCode: result.demoCode });

  switch (result.error) {
    case "invalid_phone":
      return badRequest(err.invalidPhone);
    case "too_soon":
      return NextResponse.json(
        { error: err.codeTooSoon(result.retryAfter ?? 60), retryAfter: result.retryAfter },
        { status: 429 }
      );
    default:
      return NextResponse.json({ error: err.codeSendFailed }, { status: 502 });
  }
}
