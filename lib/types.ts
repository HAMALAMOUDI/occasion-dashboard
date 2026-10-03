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
}

export interface CardTemplate {
  id: string;
  name: string;
  occasionType: "wedding" | "graduation" | "corporate" | "birthday";
  previewColor: string; // stand-in for a real background image asset
}

export interface Event {
  id: string;
  name: string;
  occasionType: CardTemplate["occasionType"];
  eventDate: string;
  venue: string;
  inviterName: string;
  templateId: string | null;
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
  invalid: number;
}
