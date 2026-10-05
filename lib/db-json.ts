import fs from "fs";
import path from "path";
import { Event, Guest, BillingRecord, CardTemplate, LoginCode, Session } from "./types";
import type { GuestGuard, GuestPatch, Store } from "./db";
import { DEFAULT_TEMPLATES } from "./templates";

// Local-development store: a JSON file at data/store.json. Each operation is
// synchronous (read → modify → write, no awaits in between), so within one
// Node process every call is atomic.

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

interface DbShape {
  events: Event[];
  guests: Guest[];
  billing: BillingRecord[];
  templates: CardTemplate[];
  loginCodes?: LoginCode[];
  sessions?: Session[];
}

function readDb(): DbShape {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial: DbShape = { events: [], guests: [], billing: [], templates: DEFAULT_TEMPLATES };
    writeDb(initial);
    return initial;
  }
  const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) as DbShape;
  if (!parsed.templates || parsed.templates.length === 0) parsed.templates = DEFAULT_TEMPLATES;
  parsed.loginCodes ??= [];
  parsed.sessions ??= [];
  // Events created before sign-in existed have no owner.
  for (const e of parsed.events) e.ownerPhone ??= null;
  return parsed;
}

// Write to a temp file then rename, so a crash mid-write can't leave a
// truncated store.json behind.
function writeDb(data: DbShape) {
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function passesGuard(guest: Guest, guard?: GuestGuard) {
  return !guard?.ifStatusIn || guard.ifStatusIn.includes(guest.status);
}

function applyGuestPatches(data: DbShape, patches: (GuestPatch & { id: string })[], guard?: GuestGuard) {
  const byId = new Map(patches.map((p) => [p.id, p]));
  const updated: Guest[] = [];
  data.guests = data.guests.map((g) => {
    const patch = byId.get(g.id);
    if (!patch || !passesGuard(g, guard)) return g;
    const next = { ...g, ...patch, id: g.id };
    updated.push(next);
    return next;
  });
  return updated;
}

export const jsonStore: Store = {
  async getEvents() {
    return readDb().events.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  },
  async getEventsByOwner(phone) {
    return (await jsonStore.getEvents()).filter((e) => e.ownerPhone === phone);
  },
  async getEvent(id) {
    return readDb().events.find((e) => e.id === id);
  },
  async createEvent(event, billing) {
    const data = readDb();
    data.events.push(event);
    data.billing.push(billing);
    writeDb(data);
    return event;
  },
  async updateEvent(id, patch) {
    const data = readDb();
    const event = data.events.find((e) => e.id === id);
    if (!event) return undefined;
    Object.assign(event, patch);
    writeDb(data);
    return event;
  },
  async claimReminder(eventId, field, force) {
    const data = readDb();
    const event = data.events.find((e) => e.id === eventId);
    if (!event || (event[field] && !force)) return false;
    event[field] = new Date().toISOString();
    writeDb(data);
    return true;
  },

  async getGuests(eventId) {
    return readDb().guests.filter((g) => g.eventId === eventId);
  },
  async getGuest(id) {
    return readDb().guests.find((g) => g.id === id);
  },
  async addGuests(guests) {
    const data = readDb();
    const taken = new Set(data.guests.map((g) => `${g.eventId}|${g.phone}`));
    const inserted = guests.filter((g) => {
      const key = `${g.eventId}|${g.phone}`;
      if (taken.has(key)) return false;
      taken.add(key);
      return true;
    });
    data.guests.push(...inserted);
    writeDb(data);
    return inserted;
  },
  async updateGuest(id, patch, guard) {
    const data = readDb();
    const [updated] = applyGuestPatches(data, [{ ...patch, id }], guard);
    if (updated) writeDb(data);
    return updated;
  },
  async updateGuests(patches, guard) {
    if (patches.length === 0) return;
    const data = readDb();
    applyGuestPatches(data, patches, guard);
    writeDb(data);
  },

  async getTemplates() {
    return readDb().templates;
  },
  async getTemplate(id) {
    return readDb().templates.find((t) => t.id === id);
  },

  async getBillingForEvent(eventId) {
    return readDb().billing.find((b) => b.eventId === eventId);
  },
  async getAllBilling() {
    return readDb().billing;
  },
  async addConversations(eventId, count) {
    if (count <= 0) return;
    const data = readDb();
    const record = data.billing.find((b) => b.eventId === eventId);
    if (!record) return;
    record.conversationsUsed += count;
    writeDb(data);
  },
  async issueInvoice(eventId) {
    const data = readDb();
    const record = data.billing.find((b) => b.eventId === eventId);
    if (!record || record.invoiceStatus !== "draft") return undefined;
    record.invoiceStatus = "issued";
    record.issuedAt = new Date().toISOString();
    writeDb(data);
    return record;
  },

  async saveLoginCode(code) {
    const data = readDb();
    data.loginCodes = [...data.loginCodes!.filter((c) => c.phone !== code.phone), code];
    writeDb(data);
  },
  async getLoginCode(phone) {
    return readDb().loginCodes!.find((c) => c.phone === phone);
  },
  async countLoginAttempt(phone, maxAttempts) {
    const data = readDb();
    const code = data.loginCodes!.find((c) => c.phone === phone);
    if (!code || Date.parse(code.expiresAt) <= Date.now() || code.attempts >= maxAttempts) return undefined;
    code.attempts += 1;
    writeDb(data);
    return code;
  },
  async consumeLoginCode(phone, codeHash) {
    const data = readDb();
    const before = data.loginCodes!.length;
    data.loginCodes = data.loginCodes!.filter((c) => !(c.phone === phone && c.codeHash === codeHash));
    if (data.loginCodes.length === before) return false;
    writeDb(data);
    return true;
  },

  async createSession(session) {
    const data = readDb();
    const now = Date.now();
    // Drop expired sessions while we're here.
    data.sessions = [...data.sessions!.filter((s) => Date.parse(s.expiresAt) > now), session];
    writeDb(data);
  },
  async getSession(tokenHash) {
    const session = readDb().sessions!.find((s) => s.tokenHash === tokenHash);
    return session && Date.parse(session.expiresAt) > Date.now() ? session : undefined;
  },
  async deleteSession(tokenHash) {
    const data = readDb();
    data.sessions = data.sessions!.filter((s) => s.tokenHash !== tokenHash);
    writeDb(data);
  },
};
