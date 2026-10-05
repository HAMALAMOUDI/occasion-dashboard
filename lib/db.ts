import { BillingRecord, CardTemplate, Event, Guest, GuestStatus, LoginCode, Session } from "./types";
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
  // All events — for system jobs (reminder cron) and admins only.
  getEvents(): Promise<Event[]>;
  getEventsByOwner(phone: string): Promise<Event[]>;
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

  // Replaces any previous code for this phone.
  saveLoginCode(code: LoginCode): Promise<void>;
  getLoginCode(phone: string): Promise<LoginCode | undefined>;
  // Atomically counts a verification attempt. Returns the code record only if
  // it is unexpired and still under `maxAttempts`.
  countLoginAttempt(phone: string, maxAttempts: number): Promise<LoginCode | undefined>;
  // Deletes the code if it still matches — so each code can be used once.
  consumeLoginCode(phone: string, codeHash: string): Promise<boolean>;

  createSession(session: Session): Promise<void>;
  getSession(tokenHash: string): Promise<Session | undefined>;
  deleteSession(tokenHash: string): Promise<void>;
}

// Finds the pooled Postgres connection string. Vercel's Storage integration
// names it DATABASE_URL / POSTGRES_URL, or <PREFIX>_DATABASE_URL /
// <PREFIX>_POSTGRES_URL when a custom prefix was chosen while connecting.
function findDatabaseUrl(): string | undefined {
  const direct = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (direct) return direct;
  const key = Object.keys(process.env)
    .filter((k) => /_(DATABASE|POSTGRES)_URL$/.test(k) && process.env[k])
    .sort((a, b) => Number(b.endsWith("_DATABASE_URL")) - Number(a.endsWith("_DATABASE_URL")))[0];
  return key && process.env[key];
}

function selectStore(): Store {
  const url = findDatabaseUrl();
  if (url) return postgresStore(url);
  if (process.env.VERCEL) {
    // Names only (never values), to show what the deployment can actually see.
    const seen = Object.keys(process.env).filter((k) => /DATABASE|POSTGRES|^PG|NEON/.test(k));
    throw new Error(
      `No database configured for the "${process.env.VERCEL_ENV}" environment. Vercel's filesystem is read-only — ` +
        "connect a Postgres database (Vercel → Storage → Neon) to this environment so DATABASE_URL is set, then redeploy. " +
        `Database-related variables visible: ${seen.length ? seen.join(", ") : "none"}.`
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
