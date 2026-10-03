# Occasion — organizer dashboard

A working prototype of the WhatsApp event-RSVP organizer dashboard: event
creation, guest list CSV upload, occasion card template picker, live RSVP
stats, reminder triggers, and per-event billing.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Create an event, upload `sample-data/guests.csv`
(or your own CSV with `name,phone` columns), then use the "Simulate accept /
decline" buttons on the guest table to see stats and billing update live.

## What's real vs. stubbed

This prototype is fully wired end to end, but two pieces are intentionally
stubbed since they need real credentials and a verified WhatsApp Business
number to work:

- **`lib/whatsapp.ts`** — `sendInvite`, `sendReminder`, and `sendBarcode`
  currently log to the console instead of calling the Meta Cloud API. Each
  function is written so the call site never changes — only the body needs
  filling in once you have a `WHATSAPP_ACCESS_TOKEN` and `PHONE_NUMBER_ID`.
  The real request shape is commented at the top of the file.
- **`app/api/guests/[guestId]/respond/route.ts`** — in production this
  logic lives inside your WhatsApp webhook handler (triggered by Meta
  posting the guest's button-tap payload), not called from the dashboard
  directly. It's exposed as a route here so the demo works without a live
  number. Point Meta's webhook config at a new route that parses the
  incoming payload and calls the same guest-update logic.

## What's a stand-in for production infrastructure

- **`lib/db.ts`** — a JSON file (`data/store.json`) standing in for
  Postgres. The `Event` / `Guest` / `BillingRecord` types in `lib/types.ts`
  match the schema discussed earlier, so swapping in real queries (e.g.
  Prisma + Postgres) is close to a 1:1 mapping — replace the body of each
  `db.*` function, keep the call sites in the API routes unchanged.
- **Card rendering** — the "occasion card preview" on the event page shows
  the composited layout (occasion type, event name, inviter, guest name) as
  live HTML/CSS. For real image generation to attach to WhatsApp messages,
  render this server-side with `sharp` (Node) onto your actual template
  PNG/SVG assets and upload the result before sending.
- **Reminders scheduling** — the "Send now" buttons in `ReminderPanel`
  trigger sends manually. In production, replace the manual trigger with a
  scheduled job (cron, or a queue like BullMQ) that calls the same
  `/api/events/[id]/remind` route automatically at 7 days and on the event
  date.
- **Billing / invoicing** — `BillingPanel`'s "Issue invoice" button marks
  the record as issued. Before going live, this is where you'd generate a
  ZATCA-compliant (Fatoora) e-invoice and push it through the ZATCA portal.

## Project structure

```
app/
  page.tsx                     Dashboard home (event list)
  events/new/page.tsx          Event creation + template picker
  events/[id]/page.tsx         Event detail: stats, guests, reminders, billing
  billing/page.tsx             Billing overview across all events
  api/                         All backend routes (see above)
components/                    UI components
lib/
  types.ts                     Shared types (matches the target DB schema)
  db.ts                        Data layer (JSON file — swap for Postgres)
  whatsapp.ts                  WhatsApp send functions (stubbed)
sample-data/guests.csv         Example CSV for testing uploads
```
