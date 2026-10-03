import { Guest, Event } from "./types";

// --------------------------------------------------------------------------
// Integration point: swap these stub functions for real calls to the Meta
// WhatsApp Cloud API (or your BSP of choice — 360dialog, Gupshup, Twilio).
// Each function below is written so the call site never changes when you
// wire up the real API — only the body of these functions does.
//
// Real invite call would look roughly like:
//
// await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
//   method: "POST",
//   headers: {
//     Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify({
//     messaging_product: "whatsapp",
//     to: guest.phone,
//     type: "template",
//     template: {
//       name: "occasion_invite",
//       language: { code: "en" },
//       components: [
//         { type: "body", parameters: [{ type: "text", text: event.name }, { type: "text", text: guest.name }] },
//         { type: "button", sub_type: "quick_reply", index: 0, parameters: [{ type: "payload", payload: "ACCEPT" }] },
//         { type: "button", sub_type: "quick_reply", index: 1, parameters: [{ type: "payload", payload: "DECLINE" }] },
//       ],
//     },
//   }),
// });
// --------------------------------------------------------------------------

export async function sendInvite(guest: Guest, event: Event, cardImageUrl?: string): Promise<{ ok: boolean; error?: string }> {
  // Simulates an occasional invalid-number bounce, matching the dashboard's "invalid" status.
  const looksInvalid = !/^\+?\d{9,15}$/.test(guest.phone.replace(/\s/g, ""));
  console.log(
    `[stub] sending invite to ${guest.name} (${guest.phone}) for "${event.name}"` +
      (cardImageUrl ? ` with card ${cardImageUrl}` : "")
  );
  if (looksInvalid) return { ok: false, error: "invalid_number" };
  return { ok: true };
}

export async function sendReminder(guest: Guest, event: Event, kind: "week" | "day"): Promise<{ ok: boolean }> {
  console.log(`[stub] sending ${kind}-before reminder to ${guest.name} for "${event.name}"`);
  return { ok: true };
}

export async function sendBarcode(guest: Guest, barcodeDataUrl: string): Promise<{ ok: boolean }> {
  console.log(`[stub] sending barcode image to ${guest.name} (${guest.phone})`);
  return { ok: true };
}
