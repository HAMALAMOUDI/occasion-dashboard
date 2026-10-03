import fs from "fs";
import path from "path";
import { Event, Guest, BillingRecord, CardTemplate } from "./types";

// This file stands in for a real database (Postgres in the target design).
// Swap readDb/writeDb for real queries when wiring up production storage —
// the shape of Event / Guest / BillingRecord below matches the schema
// discussed earlier, so the migration is mostly a 1:1 mapping.

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

interface DbShape {
  events: Event[];
  guests: Guest[];
  billing: BillingRecord[];
  templates: CardTemplate[];
}

const DEFAULT_TEMPLATES: CardTemplate[] = [
  { id: "tpl-wedding-gold", name: "Gold foil wedding", occasionType: "wedding", previewColor: "#8a6a3f" },
  { id: "tpl-wedding-floral", name: "Floral wedding", occasionType: "wedding", previewColor: "#a1665f" },
  { id: "tpl-grad-navy", name: "Navy graduation", occasionType: "graduation", previewColor: "#1f3a5f" },
  { id: "tpl-corp-minimal", name: "Minimal corporate", occasionType: "corporate", previewColor: "#33403a" },
  { id: "tpl-birthday-pastel", name: "Pastel birthday", occasionType: "birthday", previewColor: "#c77b9a" },
];

function ensureDb(): DbShape {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial: DbShape = { events: [], guests: [], billing: [], templates: DEFAULT_TEMPLATES };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  const parsed = JSON.parse(raw) as DbShape;
  if (!parsed.templates || parsed.templates.length === 0) parsed.templates = DEFAULT_TEMPLATES;
  return parsed;
}

function writeDb(db: DbShape) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export const db = {
  getEvents(): Event[] {
    return ensureDb().events.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  },
  getEvent(id: string): Event | undefined {
    return ensureDb().events.find((e) => e.id === id);
  },
  createEvent(event: Event): Event {
    const data = ensureDb();
    data.events.push(event);
    writeDb(data);
    return event;
  },
  updateEvent(id: string, patch: Partial<Event>): Event | undefined {
    const data = ensureDb();
    const idx = data.events.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    data.events[idx] = { ...data.events[idx], ...patch };
    writeDb(data);
    return data.events[idx];
  },
  getGuests(eventId: string): Guest[] {
    return ensureDb().guests.filter((g) => g.eventId === eventId);
  },
  addGuests(guests: Guest[]) {
    const data = ensureDb();
    data.guests.push(...guests);
    writeDb(data);
  },
  updateGuest(id: string, patch: Partial<Guest>): Guest | undefined {
    const data = ensureDb();
    const idx = data.guests.findIndex((g) => g.id === id);
    if (idx === -1) return undefined;
    data.guests[idx] = { ...data.guests[idx], ...patch };
    writeDb(data);
    return data.guests[idx];
  },
  getTemplates(): CardTemplate[] {
    return ensureDb().templates;
  },
  getBillingForEvent(eventId: string): BillingRecord | undefined {
    return ensureDb().billing.find((b) => b.eventId === eventId);
  },
  getAllBilling(): BillingRecord[] {
    return ensureDb().billing;
  },
  upsertBilling(record: BillingRecord) {
    const data = ensureDb();
    const idx = data.billing.findIndex((b) => b.eventId === record.eventId);
    if (idx === -1) data.billing.push(record);
    else data.billing[idx] = record;
    writeDb(data);
  },
};
