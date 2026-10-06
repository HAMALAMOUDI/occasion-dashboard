# Occasion — organizer dashboard

A working prototype of the WhatsApp event-RSVP organizer dashboard: event
creation, guest list CSV upload, occasion card template picker, live RSVP
stats, reminder triggers, and per-event billing.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000, sign in with any mobile number (the code is shown
on screen until WhatsApp is connected), and create an event. Add guests one by
one, or upload `public/guest-list-template.xlsx` (also downloadable from the
event page). Use the "Coming / Not coming" buttons on the guest list to see
stats and billing update live.

## Occasions and languages

- **Occasions:** wedding, engagement (ملكة), graduation, Eid, Ramadan iftar
  or ghabga, newborn (عقيقة), birthday, corporate, condolences (عزاء), and
  other. Each has its own wording, placeholders and card designs, defined in
  `lib/occasions.ts` and `lib/templates.ts`.
- **Condolences are announcements.** Guests are notified without
  Accept/Decline buttons, there are no reply stats or reminders, and the
  wording and colours are respectful.
- **Portal language:** English or Arabic, switched with the toggle in the
  menu (stored in the `lang` cookie; the browser language is the default).
  Arabic renders right to left, with Arabic fonts. Dates appear in both
  Gregorian and Hijri, and server error messages follow the chosen language.
  All text lives in `lib/messages.ts`.
- **Invitation language:** chosen per event, independently of the portal
  language. It controls the card, the WhatsApp templates, the entry-pass
  caption and the date format guests see.
- **Excel templates:** `public/guest-list-template.xlsx` (English) and
  `public/guest-list-template-ar.xlsx` (Arabic, right to left).

## Managing guests

- **Excel upload:** `.xlsx` files with a Name and a Mobile number column.
  Headings can be in English or Arabic (الاسم، رقم الجوال) or left out, in
  which case column A is the name and column B the number. CSV files still
  work. The file is read in the browser, and the server only receives rows.
- **Add one guest:** a name and number in the form on the event page. The
  invitation goes out straight away.
- **Edit:** changing only a name just saves it. Changing the **number** resets
  the guest (clearing any reply and entry pass) and sends a new invitation to
  the new number. That's also how a guest marked "Number issue" gets fixed.
- **Remove:** deletes the guest. Messages already sent stay on the bill.

## Going live with WhatsApp

Copy `.env.example` to `.env.local`. Without WhatsApp credentials every send
is logged to the console (demo mode); with them, `lib/whatsapp.ts` calls the
Meta Cloud API. The call sites are the same in both modes.

1. **Credentials.** Set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`.
2. **Templates.** In WhatsApp Manager, create these templates and get them
   approved, each in **both English (`en`) and Arabic (`ar`)** under the same
   name. Every event sends in its own invitation language:
   - `occasion_invite`: body variables `{{1}}` guest, `{{2}}` event,
     `{{3}}` inviter, `{{4}}` date, `{{5}}` venue, plus two quick-reply
     buttons (Accept / سأحضر and Decline / أعتذر). An image header is optional.
   - `occasion_announcement`: the same five variables and **no buttons**,
     used for condolences, where guests aren't asked to reply.
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

## Organizer sign-in

Organizers sign in with their **mobile number**. A 6-digit code is sent to that
number on WhatsApp, and each organizer only ever sees, edits and is billed
for the events they created. Someone else's event is reported as "not found".

- **Codes** expire after 10 minutes, can be used once, and lock after 5 wrong
  tries. A new code can be requested once a minute. Only hashes are stored.
- **Sessions** last 30 days in an HttpOnly cookie and live in the database, so
  signing out really ends them.
- **WhatsApp template:** create an **Authentication** template named
  `occasion_login_code` (or set `WHATSAPP_LOGIN_TEMPLATE`) with a "Copy code"
  button.
- **Demo mode:** until WhatsApp is connected there's no way to deliver codes,
  so the code is shown on the sign-in screen and a banner warns that anyone
  can sign in with any number. Connect WhatsApp, or set `AUTH_DEMO_CODES=false`
  to switch this off.
- **Admins:** numbers in `ADMIN_PHONES` see every event. Events created before
  sign-in existed have no owner and are only visible to admins.

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
  login/page.tsx               Sign in with mobile number + WhatsApp code
  (portal)/                    Signed-in pages (layout checks the session)
    page.tsx                   Dashboard home (your events)
    events/new/page.tsx        Event creation + template picker
    events/[id]/page.tsx       Event detail: stats, guests, reminders, billing
    billing/page.tsx           Billing overview across your events
  api/                         All backend routes (see above)
components/                    UI components
lib/
  types.ts                     Shared types (matches the target DB schema)
  db.ts                        Storage interface; picks Postgres or the JSON file
  db-postgres.ts               Postgres implementation (Neon on Vercel)
  db-json.ts                   JSON-file implementation (local development)
  auth.ts                      Sign-in codes, sessions, and per-event access checks
  guest-import.ts              Reads Excel/CSV rows (English or Arabic headings)
  whatsapp.ts                  WhatsApp Cloud API client (console stub without credentials)
  rsvp.ts                      Invite / response / reminder workflow shared by routes, webhook, cron
  phone.ts                     Phone number normalization (E.164)
proxy.ts                       Sends signed-out visitors to /login
public/guest-list-template.xlsx  Excel template organizers download
sample-data/guests.csv         Example CSV for testing uploads
```
