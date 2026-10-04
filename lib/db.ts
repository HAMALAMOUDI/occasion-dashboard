import { BillingRecord, CardTemplate, Event, Guest, GuestStatus } from "./types";
import { jsonStore } from "./db-json";
import { postgresStore } from "./db-postgres";

// Storage interface used by every route. Two implementations:
//   - Postgres (lib/db-postgres.ts) when DATABASE_URL / POSTGRES_URL is set —
//     e.g. Neon via the Vercel Storage integration. Required on Vercel, whose
//     filesystem is read-only.
//   - JSON file (lib/db-json.ts, data/store.json) otherwise, for zero-setup
//     local development.
//
// Operations that must not race (reminder claims, RSVP transitions, invoice
// issuing, billing counters, duplicate guests) are single conditional
// operations here rather than read-then-write in the callers.

export type ReminderField = "reminderWeekSentAt" | "reminderDaySentAt";
export type EventPatch = Partial<Pick<Event, "name" | "eventDate" | "venue" | "inviterName" | "templateId">>;
export type GuestPatch = Partial<Pick<Guest, "status" | "inviteSentAt" | "respondedAt" | "barcodeValue" | "checkedInAt" | "lastError">>;
// Apply the patch only if the guest's current status is one of these.
export type GuestGuard = { ifStatusIn?: GuestStatus[] };

export interface Store {
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: Event, billing: BillingRecord): Promise<Event>;
  updateEvent(id: string, patch: EventPatch): Promise<Event | undefined>;
  // Atomically marks a reminder as sent. Returns false if it was already sent (and !force).
  claimReminder(eventId: string, field: ReminderField, force: boolean): Promise<boolean>;

  getGuests(eventId: string): Promise<Guest[]>;
  getGuest(id: string): Promise<Guest | undefined>;
  // Inserts guests, skipping any whose phone is already on the event. Returns the inserted rows.
  addGuests(guests: Guest[]): Promise<Guest[]>;
  updateGuest(id: string, patch: GuestPatch, guard?: GuestGuard): Promise<Guest | undefined>;
  updateGuests(patches: (GuestPatch & { id: string })[], guard?: GuestGuard): Promise<void>;

  getTemplates(): Promise<CardTemplate[]>;
  getTemplate(id: string): Promise<CardTemplate | undefined>;

  getBillingForEvent(eventId: string): Promise<BillingRecord | undefined>;
  getAllBilling(): Promise<BillingRecord[]>;
  addConversations(eventId: string, count: number): Promise<void>;
  // Moves a draft invoice to issued. Returns undefined if no draft invoice exists.
  issueInvoice(eventId: string): Promise<BillingRecord | undefined>;
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

function selectStore(): Store {
  if (DATABASE_URL) return postgresStore(DATABASE_URL);
  if (process.env.VERCEL) {
    throw new Error(
      "No database configured. Vercel's filesystem is read-only — add a Postgres database " +
        "(Vercel → Storage → Neon) so DATABASE_URL is set, then redeploy."
    );
  }
  return jsonStore;
}

let store: Store | undefined;

// Resolved lazily so `next build` doesn't need database credentials.
export const db: Store = new Proxy({} as Store, {
  get(_target, prop: keyof Store) {
    store ??= selectStore();
    return store[prop];
  },
});
