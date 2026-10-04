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

## Going live with WhatsApp

Copy `.env.example` to `.env.local`. Without WhatsApp credentials every send
is logged to the console (demo mode); with them, `lib/whatsapp.ts` calls the
Meta Cloud API. The call sites are the same in both modes.

1. **Credentials.** Set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`.
2. **Templates.** In WhatsApp Manager, create and get approval for:
   - `occasion_invite`: body variables `{{1}}` guest, `{{2}}` event,
     `{{3}}` inviter, `{{4}}` date, `{{5}}` venue, plus two quick-reply
     buttons (Accept and Decline). An image header is optional.
   - `occasion_reminder`: body variables `{{1}}` guest, `{{2}}` event,
     `{{3}}` date, `{{4}}` venue.
3. **Webhook.** Point Meta's webhook at `/api/webhooks/whatsapp`, use your
   `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, subscribe to `messages`, and set
   `WHATSAPP_APP_SECRET` so request signatures are verified. Button taps
   carry the guest id (`ACCEPT:<guestId>`). The webhook checks that the
   sender's number matches that guest, then runs the same `recordResponse()`
   that the dashboard's "Simulate" buttons use.
4. **Reminders.** On Vercel, `vercel.json` schedules `GET /api/cron/reminders`
   daily at 06:00 UTC (09:00 Riyadh). Set `CRON_SECRET` in the Vercel project's
   environment variables, and Vercel sends it as `Authorization: Bearer …`
   automatically. Anywhere else, call the endpoint with that header from any
   scheduler. It sends the 7-day and same-day reminders when they're due, and
   each one goes out at most once per event. The dashboard's "Send now"
   buttons stay available for manual sends.

### Delivery and billing safeguards

- Phone numbers are converted to E.164 format (`05…` becomes `+9665…`).
  Numbers that are still invalid are flagged and never sent, so they cost
  nothing.
- When a CSV is re-uploaded, guests already on the event are skipped, so
  nobody is invited or billed twice.
- Transient send failures (rate limits, network errors) leave the guest as
  pending, and the event page shows a "Retry unsent invites" button.
- RSVPs are idempotent because Meta retries webhooks and guests double-tap.
  Repeated taps won't re-send the QR pass.
- Before re-sending a reminder you must confirm (`force: true`). Invoices
  can only be issued once.
- Entry QR codes contain 64 random bits, so they can't be guessed.

## Database

The app stores data in **Postgres** whenever `DATABASE_URL` (or
`POSTGRES_URL`) is set. Without one, it falls back to a local JSON file
(`data/store.json`) for zero-setup development.

- **On Vercel a database is required**, because the filesystem is read-only.
  In the Vercel project go to **Storage → Create Database → Neon** and
  connect it to this project. That sets `DATABASE_URL`, then redeploy.
- Tables are created automatically on first request (`lib/db-postgres.ts`),
  so there's no migration step.
- To use the production database locally, run `vercel env pull .env.local`
  (or paste `DATABASE_URL` into `.env.local`) and start `npm run dev`.

## What's a stand-in for production infrastructure

- **Card rendering** — the "occasion card preview" on the event page shows
  the composited layout (occasion type, event name, inviter, guest name) as
  live HTML/CSS. For real image generation to attach to WhatsApp messages,
  render this server-side with `sharp` (Node) onto your actual template
  PNG/SVG assets and upload the result before sending.
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
  db.ts                        Storage interface; picks Postgres or the JSON file
  db-postgres.ts               Postgres implementation (Neon on Vercel)
  db-json.ts                   JSON-file implementation (local development)
  whatsapp.ts                  WhatsApp Cloud API client (console stub without credentials)
  rsvp.ts                      Invite / response / reminder workflow shared by routes, webhook, cron
  phone.ts                     Phone number normalization (E.164)
sample-data/guests.csv         Example CSV for testing uploads
```
