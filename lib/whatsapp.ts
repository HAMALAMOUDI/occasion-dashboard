import { Guest, Event } from "./types";

// --------------------------------------------------------------------------
// WhatsApp Cloud API client.
//
// When WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are set, messages go
// out through the Meta Graph API. Without them every send is logged to the
// console instead, so the dashboard demo works with no live number. Call
// sites are identical either way.
//
// Required Meta-side setup (WhatsApp Manager → Message templates):
//   - WHATSAPP_INVITE_TEMPLATE   (default "occasion_invite")
//       body: {{1}} guest name, {{2}} event name, {{3}} inviter, {{4}} date, {{5}} venue
//       buttons: two quick replies, "Accept" and "Decline"
//   - WHATSAPP_REMINDER_TEMPLATE (default "occasion_reminder")
//       body: {{1}} guest name, {{2}} event name, {{3}} date, {{4}} venue
//   - WHATSAPP_LOGIN_TEMPLATE    (default "occasion_login_code")
//       category: Authentication, with a "Copy code" button
//
// Quick-reply payloads carry the guest id ("ACCEPT:<guestId>") so the webhook
// can resolve the exact invite even if one phone number is invited to several
// events.
// --------------------------------------------------------------------------

const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || "en";
const INVITE_TEMPLATE = process.env.WHATSAPP_INVITE_TEMPLATE || "occasion_invite";
const REMINDER_TEMPLATE = process.env.WHATSAPP_REMINDER_TEMPLATE || "occasion_reminder";
const LOGIN_TEMPLATE = process.env.WHATSAPP_LOGIN_TEMPLATE || "occasion_login_code";

export type SendResult = { ok: true; messageId?: string } | { ok: false; error: string };
export type RsvpDecision = "accept" | "decline";

export const isLiveMode = Boolean(ACCESS_TOKEN && PHONE_NUMBER_ID);

export function rsvpPayload(decision: RsvpDecision, guestId: string): string {
  return `${decision.toUpperCase()}:${guestId}`;
}

export function parseRsvpPayload(payload: string): { decision: RsvpDecision; guestId: string } | null {
  const match = /^(ACCEPT|DECLINE):(.+)$/.exec(payload);
  if (!match) return null;
  return { decision: match[1] === "ACCEPT" ? "accept" : "decline", guestId: match[2] };
}

// Graph API expects the number without the leading "+".
function toWaId(phone: string) {
  return phone.replace(/^\+/, "");
}

function formatEventDate(eventDate: string) {
  return new Date(eventDate).toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "UTC" });
}

function textParams(...values: string[]) {
  // Template parameters can't be empty strings.
  return values.map((text) => ({ type: "text", text: text || "-" }));
}

async function graphRequest(pathname: string, init: RequestInit): Promise<{ ok: true; json: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pathname}`, {
      ...init,
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, ...init.headers },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = (json as { error?: { code?: number; message?: string } }).error;
      return { ok: false, error: mapGraphError(err?.code, err?.message) };
    }
    return { ok: true, json };
  } catch (e) {
    return { ok: false, error: `network_error: ${(e as Error).message}` };
  }
}

// Collapses the Graph API's error codes into the handful the dashboard cares about.
function mapGraphError(code: number | undefined, message: string | undefined) {
  switch (code) {
    case 131026: // Message undeliverable (not on WhatsApp, old app version, etc.)
    case 131030: // Recipient not in allowed list (test numbers)
      return "invalid_number";
    case 130429:
    case 131056:
      return "rate_limited";
    case 132000:
    case 132001:
      return "template_error";
    default:
      return message ? `api_error: ${message}` : "api_error";
  }
}

async function sendMessage(to: string, message: Record<string, unknown>): Promise<SendResult> {
  const result = await graphRequest(`${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: toWaId(to), ...message }),
  });
  if (!result.ok) return result;
  const messages = result.json.messages as { id: string }[] | undefined;
  return { ok: true, messageId: messages?.[0]?.id };
}

export async function sendInvite(guest: Guest, event: Event, cardImageUrl?: string): Promise<SendResult> {
  if (!isLiveMode) {
    console.log(
      `[stub] sending invite to ${guest.name} (${guest.phone}) for "${event.name}"` +
        (cardImageUrl ? ` with card ${cardImageUrl}` : "")
    );
    return { ok: true };
  }

  const components: Record<string, unknown>[] = [
    {
      type: "body",
      parameters: textParams(guest.name, event.name, event.inviterName, formatEventDate(event.eventDate), event.venue),
    },
    { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: rsvpPayload("accept", guest.id) }] },
    { type: "button", sub_type: "quick_reply", index: "1", parameters: [{ type: "payload", payload: rsvpPayload("decline", guest.id) }] },
  ];
  if (cardImageUrl) components.unshift({ type: "header", parameters: [{ type: "image", image: { link: cardImageUrl } }] });

  return sendMessage(guest.phone, {
    type: "template",
    template: { name: INVITE_TEMPLATE, language: { code: TEMPLATE_LANG }, components },
  });
}

export async function sendReminder(guest: Guest, event: Event, kind: "week" | "day"): Promise<SendResult> {
  if (!isLiveMode) {
    console.log(`[stub] sending ${kind}-before reminder to ${guest.name} for "${event.name}"`);
    return { ok: true };
  }

  return sendMessage(guest.phone, {
    type: "template",
    template: {
      name: REMINDER_TEMPLATE,
      language: { code: TEMPLATE_LANG },
      components: [{ type: "body", parameters: textParams(guest.name, event.name, formatEventDate(event.eventDate), event.venue) }],
    },
  });
}

// Sent right after the guest taps "Accept", so the 24h customer-service
// window is open and a free-form image message is allowed (no template).
export async function sendBarcode(guest: Guest, event: Event, barcodePng: Buffer): Promise<SendResult> {
  if (!isLiveMode) {
    console.log(`[stub] sending barcode ${guest.barcodeValue} (${barcodePng.length} bytes) to ${guest.name} (${guest.phone})`);
    return { ok: true };
  }

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", "image/png");
  form.append("file", new Blob([new Uint8Array(barcodePng)], { type: "image/png" }), `${guest.barcodeValue}.png`);

  const upload = await graphRequest(`${PHONE_NUMBER_ID}/media`, { method: "POST", body: form });
  if (!upload.ok) return upload;

  return sendMessage(guest.phone, {
    type: "image",
    image: {
      id: upload.json.id as string,
      caption: `Your entry pass for ${event.name} — please show this QR code at the door. Code: ${guest.barcodeValue}`,
    },
  });
}

// Organizer sign-in code. Uses an Authentication-category template, which
// Meta requires for one-time passcodes; the code fills both the body and the
// "Copy code" button.
export async function sendLoginCode(phone: string, code: string): Promise<SendResult> {
  if (!isLiveMode) {
    console.log(`[stub] sign-in code for ${phone}: ${code}`);
    return { ok: true };
  }

  return sendMessage(phone, {
    type: "template",
    template: {
      name: LOGIN_TEMPLATE,
      language: { code: TEMPLATE_LANG },
      components: [
        { type: "body", parameters: [{ type: "text", text: code }] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
      ],
    },
  });
}
