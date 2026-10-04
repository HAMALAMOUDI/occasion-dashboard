import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { recordResponse } from "@/lib/rsvp";
import { parseRsvpPayload } from "@/lib/whatsapp";

// Meta WhatsApp Cloud API webhook. Configure in the Meta App dashboard:
//   Callback URL:  https://<your-domain>/api/webhooks/whatsapp
//   Verify token:  value of WHATSAPP_WEBHOOK_VERIFY_TOKEN
//   Subscribe to:  messages
// Requests are authenticated with the X-Hub-Signature-256 header, signed with
// WHATSAPP_APP_SECRET.

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// Subscription handshake: Meta calls this once when the webhook is saved.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  if (VERIFY_TOKEN && params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === VERIFY_TOKEN) {
    return new NextResponse(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

function hasValidSignature(rawBody: string, header: string | null): boolean {
  if (!APP_SECRET) {
    // Allow unsigned requests only in local development, for testing with curl.
    return process.env.NODE_ENV !== "production";
  }
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", APP_SECRET).update(rawBody).digest("hex"));
  const received = Buffer.from(header.slice("sha256=".length));
  return expected.length === received.length && timingSafeEqual(expected, received);
}

interface WebhookMessage {
  from: string;
  type: string;
  button?: { payload?: string };
  interactive?: { button_reply?: { id?: string } };
}

interface WebhookBody {
  entry?: { changes?: { value?: { messages?: WebhookMessage[] } }[] }[];
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!hasValidSignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const messages = (body.entry ?? []).flatMap((e) => (e.changes ?? []).flatMap((c) => c.value?.messages ?? []));

  for (const message of messages) {
    // Template quick-reply taps arrive as "button"; interactive-message taps as "interactive".
    const payload = message.button?.payload ?? message.interactive?.button_reply?.id;
    const rsvp = payload ? parseRsvpPayload(payload) : null;
    if (!rsvp) continue;

    // Only the invited number may answer for its own invite.
    const guest = await db.getGuest(rsvp.guestId);
    if (!guest || guest.phone !== `+${message.from}`) {
      console.warn(`[webhook] ignoring RSVP for guest ${rsvp.guestId} from ${message.from}`);
      continue;
    }

    try {
      const result = await recordResponse(rsvp.guestId, rsvp.decision);
      if (!result.ok) console.warn(`[webhook] could not record RSVP for ${rsvp.guestId}: ${result.error}`);
    } catch (e) {
      console.error(`[webhook] error recording RSVP for ${rsvp.guestId}`, e);
    }
  }

  // Always 200 for authenticated deliveries — anything else makes Meta retry.
  return NextResponse.json({ received: true });
}
