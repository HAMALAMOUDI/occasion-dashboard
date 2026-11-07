export type GuestStatus = "pending" | "accepted" | "declined" | "invalid" | "no_response";

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  phone: string;
  status: GuestStatus;
  inviteSentAt: string | null;
  respondedAt: string | null;
  barcodeValue: string | null;
  checkedInAt: string | null;
  lastError: string | null;
  // Seats on this invitation: 1 for one person, more for a household or plus-ones.
  seats: number;
  // Seats the guest confirmed when accepting; null until they accept.
  attending: number | null;
  // Unguessable key for the guest's own invitation page (/i/<token>).
  token: string;
}

import type { Lang, OccasionType } from "./occasions";
import type { DesignChoice } from "./designs/render";
import type { ClipStyle } from "./clips/themes";

// Names shown on cards that feature them (e.g. "Royal entrance"); editable per event.
export interface ClipNames {
  a: string;
  b: string; // empty for a single name
  line: string; // small line above the names, e.g. "حفل زفاف" / "The Wedding of"
}

export interface ClipChoice {
  style: ClipStyle;
  names?: ClipNames;
}

// What guests find on their invitation page, beyond the card. All optional.
export interface InviteDetails {
  mapUrl: string;
  dressCode: string;
  gifts: string;
  note: string;
  // The running order: arrivals, dinner, and so on.
  schedule: { time: string; title: string }[];
}

export interface CardTemplate {
  id: string;
  name: string;
  nameAr: string;
  occasionType: OccasionType;
  previewColor: string; // stand-in for a real background image asset
}

export interface Event {
  id: string;
  name: string;
  occasionType: OccasionType;
  // Language of the card and WhatsApp messages guests receive.
  language: Lang;
  // A card from the design library (lib/designs), or null for the simple built-in card.
  design: DesignChoice | null;
  // An animated invitation (lib/clips), or null for none.
  clip: ClipChoice | null;
  // Extra details for the guest's invitation page, or null for none.
  details: InviteDetails | null;
  eventDate: string;
  venue: string;
  inviterName: string;
  templateId: string | null;
  // E.164 mobile number of the organizer who created the event. Null only for
  // events created before sign-in existed (visible to admins).
  ownerPhone: string | null;
  reminderWeekSentAt: string | null;
  reminderDaySentAt: string | null;
  createdAt: string;
}

export interface BillingRecord {
  id: string;
  eventId: string;
  conversationsUsed: number;
  ratePerConversation: number; // SAR, mock rate
  invoiceStatus: "draft" | "issued" | "paid";
  issuedAt: string | null;
}

export interface Stats {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  // Of `pending`, guests whose invite hasn't gone out yet.
  notSent: number;
  invalid: number;
  // Seats across all invitations, and seats confirmed by guests who accepted.
  seats: number;
  seatsComing: number;
  // Accepted guests already scanned in at the door.
  checkedIn: number;
}

// An organizer's review of Hikayati, shown on the landing page once an admin approves it.
export interface Review {
  id: string;
  eventId: string;
  ownerPhone: string;
  // How the review is signed, e.g. "Nouf & Fahad".
  author: string;
  rating: number; // 1–5
  body: string;
  status: "pending" | "approved" | "hidden";
  createdAt: string;
}

// Real totals for the landing page.
export interface Counters {
  invitationsSent: number;
  events: number;
}

// One-time sign-in code sent to an organizer's WhatsApp. Only a hash is stored.
export interface LoginCode {
  phone: string;
  codeHash: string;
  attempts: number;
  expiresAt: string;
  createdAt: string;
}

// Signed-in organizer session. The cookie holds a random token; only its hash is stored.
export interface Session {
  tokenHash: string;
  phone: string;
  expiresAt: string;
  createdAt: string;
}
