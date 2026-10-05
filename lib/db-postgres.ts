import { Pool, PoolClient } from "pg";
import { BillingRecord, CardTemplate, Event, Guest, LoginCode, Session } from "./types";
import type { GuestGuard, GuestPatch, ReminderField, Store } from "./db";
import { DEFAULT_TEMPLATES } from "./templates";

// Postgres store (Neon on Vercel). Tables are created on first use, so a fresh
// database needs no manual migration step.

const SCHEMA = `
CREATE TABLE IF NOT EXISTS card_templates (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  occasion_type text NOT NULL,
  preview_color text NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id                    text PRIMARY KEY,
  name                  text NOT NULL,
  occasion_type         text NOT NULL,
  event_date            text NOT NULL CHECK (event_date ~ '^\\d{4}-\\d{2}-\\d{2}$'),
  venue                 text NOT NULL DEFAULT '',
  inviter_name          text NOT NULL,
  template_id           text REFERENCES card_templates(id),
  reminder_week_sent_at timestamptz,
  reminder_day_sent_at  timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guests (
  id             text PRIMARY KEY,
  seq            bigint GENERATED ALWAYS AS IDENTITY,
  event_id       text NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name           text NOT NULL,
  phone          text NOT NULL,
  status         text NOT NULL,
  invite_sent_at timestamptz,
  responded_at   timestamptz,
  barcode_value  text UNIQUE,
  checked_in_at  timestamptz,
  last_error     text,
  UNIQUE (event_id, phone)
);

CREATE TABLE IF NOT EXISTS billing (
  id                    text PRIMARY KEY,
  event_id              text NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  conversations_used    integer NOT NULL DEFAULT 0,
  rate_per_conversation numeric(10, 4) NOT NULL,
  invoice_status        text NOT NULL DEFAULT 'draft',
  issued_at             timestamptz
);

-- Added with organizer sign-in. Older databases get the column on next start.
ALTER TABLE events ADD COLUMN IF NOT EXISTS owner_phone text;
CREATE INDEX IF NOT EXISTS events_owner_phone_idx ON events (owner_phone);

CREATE TABLE IF NOT EXISTS login_codes (
  phone      text PRIMARY KEY,
  code_hash  text NOT NULL,
  attempts   integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  phone      text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

// ------------------------------------------------------------ row mapping

type Row = Record<string, unknown>;

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : ((v as string | null) ?? null));

const toEvent = (r: Row): Event => ({
  id: r.id as string,
  name: r.name as string,
  occasionType: r.occasion_type as Event["occasionType"],
  eventDate: r.event_date as string,
  venue: r.venue as string,
  inviterName: r.inviter_name as string,
  templateId: (r.template_id as string | null) ?? null,
  ownerPhone: (r.owner_phone as string | null) ?? null,
  reminderWeekSentAt: iso(r.reminder_week_sent_at),
  reminderDaySentAt: iso(r.reminder_day_sent_at),
  createdAt: iso(r.created_at)!,
});

const toGuest = (r: Row): Guest => ({
  id: r.id as string,
  eventId: r.event_id as string,
  name: r.name as string,
  phone: r.phone as string,
  status: r.status as Guest["status"],
  inviteSentAt: iso(r.invite_sent_at),
  respondedAt: iso(r.responded_at),
  barcodeValue: (r.barcode_value as string | null) ?? null,
  checkedInAt: iso(r.checked_in_at),
  lastError: (r.last_error as string | null) ?? null,
});

const toBilling = (r: Row): BillingRecord => ({
  id: r.id as string,
  eventId: r.event_id as string,
  conversationsUsed: Number(r.conversations_used),
  ratePerConversation: Number(r.rate_per_conversation),
  invoiceStatus: r.invoice_status as BillingRecord["invoiceStatus"],
  issuedAt: iso(r.issued_at),
});

const toLoginCode = (r: Row): LoginCode => ({
  phone: r.phone as string,
  codeHash: r.code_hash as string,
  attempts: Number(r.attempts),
  expiresAt: iso(r.expires_at)!,
  createdAt: iso(r.created_at)!,
});

const toSession = (r: Row): Session => ({
  tokenHash: r.token_hash as string,
  phone: r.phone as string,
  expiresAt: iso(r.expires_at)!,
  createdAt: iso(r.created_at)!,
});

const toTemplate = (r: Row): CardTemplate => ({
  id: r.id as string,
  name: r.name as string,
  occasionType: r.occasion_type as CardTemplate["occasionType"],
  previewColor: r.preview_color as string,
});

// Builds a SET clause that only touches the keys present in a JSON patch `p`,
// so `{ lastError: null }` clears the column but an absent key leaves it alone.
// Column names come from the fixed lists below, never from user input.
function patchSet(alias: string, columns: [key: string, column: string, cast: string][]) {
  return columns
    .map(([key, col, cast]) => `${col} = CASE WHEN p ? '${key}' THEN (p->>'${key}')::${cast} ELSE ${alias}.${col} END`)
    .join(",\n    ");
}

const EVENT_PATCH_SET = patchSet("e", [
  ["name", "name", "text"],
  ["eventDate", "event_date", "text"],
  ["venue", "venue", "text"],
  ["inviterName", "inviter_name", "text"],
  ["templateId", "template_id", "text"],
]);

const GUEST_PATCH_SET = patchSet("g", [
  ["status", "status", "text"],
  ["inviteSentAt", "invite_sent_at", "timestamptz"],
  ["respondedAt", "responded_at", "timestamptz"],
  ["barcodeValue", "barcode_value", "text"],
  ["checkedInAt", "checked_in_at", "timestamptz"],
  ["lastError", "last_error", "text"],
]);

const REMINDER_COLUMNS: Record<ReminderField, string> = {
  reminderWeekSentAt: "reminder_week_sent_at",
  reminderDaySentAt: "reminder_day_sent_at",
};

// ------------------------------------------------------------ connection

// Reuse one pool per process (and across dev hot reloads).
const globalForPg = globalThis as unknown as { pgPool?: Pool; pgSchemaReady?: Promise<void> };

export function postgresStore(connectionString: string): Store {
  const pool = (globalForPg.pgPool ??= new Pool({ connectionString, max: 5, idleTimeoutMillis: 10_000 }));

  async function ensureSchema(client: PoolClient) {
    await client.query("BEGIN");
    try {
      // Serialize concurrent cold starts so CREATE TABLE IF NOT EXISTS can't race.
      await client.query("SELECT pg_advisory_xact_lock(727274)");
      await client.query(SCHEMA);
      await client.query(
        `INSERT INTO card_templates (id, name, occasion_type, preview_color)
         SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[])
         ON CONFLICT (id) DO NOTHING`,
        [
          DEFAULT_TEMPLATES.map((t) => t.id),
          DEFAULT_TEMPLATES.map((t) => t.name),
          DEFAULT_TEMPLATES.map((t) => t.occasionType),
          DEFAULT_TEMPLATES.map((t) => t.previewColor),
        ]
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  }

  async function ready() {
    globalForPg.pgSchemaReady ??= (async () => {
      const client = await pool.connect();
      try {
        await ensureSchema(client);
      } finally {
        client.release();
      }
    })().catch((e) => {
      globalForPg.pgSchemaReady = undefined; // retry on the next request
      throw e;
    });
    return globalForPg.pgSchemaReady;
  }

  async function query(text: string, params: unknown[] = []): Promise<Row[]> {
    await ready();
    return (await pool.query(text, params)).rows;
  }

  async function updateGuestsReturning(patches: (GuestPatch & { id: string })[], guard?: GuestGuard) {
    if (patches.length === 0) return [];
    const rows = await query(
      `UPDATE guests g SET
    ${GUEST_PATCH_SET}
       FROM jsonb_array_elements($1::jsonb) AS x(p)
       WHERE g.id = p->>'id' AND ($2::text[] IS NULL OR g.status = ANY($2::text[]))
       RETURNING g.*`,
      [JSON.stringify(patches), guard?.ifStatusIn ?? null]
    );
    return rows.map(toGuest);
  }

  return {
    async getEvents() {
      return (await query("SELECT * FROM events ORDER BY event_date, created_at")).map(toEvent);
    },
    async getEventsByOwner(phone) {
      return (await query("SELECT * FROM events WHERE owner_phone = $1 ORDER BY event_date, created_at", [phone])).map(toEvent);
    },
    async getEvent(id) {
      const [row] = await query("SELECT * FROM events WHERE id = $1", [id]);
      return row && toEvent(row);
    },
    async createEvent(event, billing) {
      await ready();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO events (id, name, occasion_type, event_date, venue, inviter_name, template_id, owner_phone, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [event.id, event.name, event.occasionType, event.eventDate, event.venue, event.inviterName, event.templateId, event.ownerPhone, event.createdAt]
        );
        await client.query(
          `INSERT INTO billing (id, event_id, conversations_used, rate_per_conversation, invoice_status, issued_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [billing.id, billing.eventId, billing.conversationsUsed, billing.ratePerConversation, billing.invoiceStatus, billing.issuedAt]
        );
        await client.query("COMMIT");
        return event;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    },
    async updateEvent(id, patch) {
      const [row] = await query(
        `UPDATE events e SET
    ${EVENT_PATCH_SET}
         FROM (SELECT $2::jsonb AS p) x
         WHERE e.id = $1
         RETURNING e.*`,
        [id, JSON.stringify(patch)]
      );
      return row && toEvent(row);
    },
    async claimReminder(eventId, field, force) {
      const col = REMINDER_COLUMNS[field];
      const rows = await query(`UPDATE events SET ${col} = now() WHERE id = $1 AND (${col} IS NULL OR $2) RETURNING id`, [
        eventId,
        force,
      ]);
      return rows.length > 0;
    },

    async getGuests(eventId) {
      return (await query("SELECT * FROM guests WHERE event_id = $1 ORDER BY seq", [eventId])).map(toGuest);
    },
    async getGuest(id) {
      const [row] = await query("SELECT * FROM guests WHERE id = $1", [id]);
      return row && toGuest(row);
    },
    async addGuests(guests) {
      if (guests.length === 0) return [];
      const col = <K extends keyof Guest>(k: K) => guests.map((g) => g[k]);
      const rows = await query(
        `INSERT INTO guests (id, event_id, name, phone, status, invite_sent_at, responded_at, barcode_value, checked_in_at, last_error)
         SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[],
                              $6::timestamptz[], $7::timestamptz[], $8::text[], $9::timestamptz[], $10::text[])
         ON CONFLICT (event_id, phone) DO NOTHING
         RETURNING *`,
        [
          col("id"), col("eventId"), col("name"), col("phone"), col("status"),
          col("inviteSentAt"), col("respondedAt"), col("barcodeValue"), col("checkedInAt"), col("lastError"),
        ]
      );
      // Preserve the caller's (CSV) order.
      const inserted = new Map(rows.map((r) => [r.id as string, toGuest(r)]));
      return guests.filter((g) => inserted.has(g.id)).map((g) => inserted.get(g.id)!);
    },
    async updateGuest(id, patch, guard) {
      const [guest] = await updateGuestsReturning([{ ...patch, id }], guard);
      return guest;
    },
    async updateGuests(patches, guard) {
      await updateGuestsReturning(patches, guard);
    },

    async getTemplates() {
      return (await query("SELECT * FROM card_templates ORDER BY occasion_type, name")).map(toTemplate);
    },
    async getTemplate(id) {
      const [row] = await query("SELECT * FROM card_templates WHERE id = $1", [id]);
      return row && toTemplate(row);
    },

    async getBillingForEvent(eventId) {
      const [row] = await query("SELECT * FROM billing WHERE event_id = $1", [eventId]);
      return row && toBilling(row);
    },
    async getAllBilling() {
      return (await query("SELECT * FROM billing")).map(toBilling);
    },
    async addConversations(eventId, count) {
      if (count <= 0) return;
      await query("UPDATE billing SET conversations_used = conversations_used + $2 WHERE event_id = $1", [eventId, count]);
    },
    async issueInvoice(eventId) {
      const [row] = await query(
        `UPDATE billing SET invoice_status = 'issued', issued_at = now()
         WHERE event_id = $1 AND invoice_status = 'draft'
         RETURNING *`,
        [eventId]
      );
      return row && toBilling(row);
    },

    async saveLoginCode(code) {
      await query(
        `INSERT INTO login_codes (phone, code_hash, attempts, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (phone) DO UPDATE SET code_hash = $2, attempts = $3, expires_at = $4, created_at = $5`,
        [code.phone, code.codeHash, code.attempts, code.expiresAt, code.createdAt]
      );
    },
    async getLoginCode(phone) {
      const [row] = await query("SELECT * FROM login_codes WHERE phone = $1", [phone]);
      return row && toLoginCode(row);
    },
    async countLoginAttempt(phone, maxAttempts) {
      const [row] = await query(
        `UPDATE login_codes SET attempts = attempts + 1
         WHERE phone = $1 AND expires_at > now() AND attempts < $2
         RETURNING *`,
        [phone, maxAttempts]
      );
      return row && toLoginCode(row);
    },
    async consumeLoginCode(phone, codeHash) {
      const rows = await query("DELETE FROM login_codes WHERE phone = $1 AND code_hash = $2 RETURNING phone", [phone, codeHash]);
      return rows.length > 0;
    },

    async createSession(session) {
      await query("DELETE FROM sessions WHERE expires_at <= now()");
      await query("INSERT INTO sessions (token_hash, phone, expires_at, created_at) VALUES ($1, $2, $3, $4)", [
        session.tokenHash,
        session.phone,
        session.expiresAt,
        session.createdAt,
      ]);
    },
    async getSession(tokenHash) {
      const [row] = await query("SELECT * FROM sessions WHERE token_hash = $1 AND expires_at > now()", [tokenHash]);
      return row && toSession(row);
    },
    async deleteSession(tokenHash) {
      await query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
    },
  };
}
