import { NextRequest, NextResponse } from "next/server";
import { requestLoginCode } from "@/lib/auth";
import { badRequest, readJson } from "@/lib/http";

// Step 1 of sign-in: send a one-time code to the organizer's WhatsApp.
export async function POST(req: NextRequest) {
  const body = await readJson<{ phone: string }>(req);
  if (typeof body?.phone !== "string") return badRequest("Please enter your mobile number.");

  const result = await requestLoginCode(body.phone);
  if (result.ok) return NextResponse.json({ phone: result.phone, demoCode: result.demoCode });

  switch (result.error) {
    case "invalid_phone":
      return badRequest("That doesn't look like a valid mobile number.");
    case "too_soon":
      return NextResponse.json(
        { error: `We just sent you a code. You can ask for a new one in ${result.retryAfter}s.`, retryAfter: result.retryAfter },
        { status: 429 }
      );
    default:
      return NextResponse.json({ error: "We couldn't send a code to that number on WhatsApp. Please try again." }, { status: 502 });
  }
}
