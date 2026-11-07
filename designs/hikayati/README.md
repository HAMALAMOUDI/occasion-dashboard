# Hikayati invitation designs

Source files for the portal's design library, exported from the
**Hikayati Invitation Cards** design canvas made in Claude.

| File | What it holds |
| --- | --- |
| `classic.dc.html` | The classic card template: 20 layouts (classic frame, arch, ticket, calendar, …), with 5 palettes per occasion |
| `modern.dc.html` | The modern card template: 10 modernist + 10 "AI-inspired" layouts, with 10 palettes each |
| `signature.dc.html` | The signature card template: 8 layouts (arch, Najdi door, mashrabiya, seal, …) built around a drawn emblem for each occasion, with 4 palettes each |

The classic and modern templates cover 10 categories (weddings, engagements,
henna nights, birthdays, graduations, baby celebrations, private gatherings,
corporate events, Eid, Ramadan). The signature template covers those plus
condolences, which it renders calmly, with a note in place of a reply button.
That makes **2 × 10 × 20 + 11 × 8 = 488 designs**.

## How they're used

- `scripts/import-designs.mjs` extracts each layout's markup into
  `lib/designs/markup.generated.ts`.
- `lib/designs/catalog.ts` holds the categories, layout names (English and
  Arabic), palettes, fonts and sample wording, copied from the templates'
  data.
- `lib/designs/engine.ts` and `render.ts` fill a layout with an event's details
  (names, date, venue, wording) and return a standalone page. It's shown in a
  sandboxed iframe with scripts disabled.

## Updating the designs

1. Edit the designs in the Claude canvas.
2. Replace the three files here with the canvas's `project/Invite.dc.html`
   (→ `classic.dc.html`), `project/Modern.dc.html` (→ `modern.dc.html`) and
   `project/Signature.dc.html` (→ `signature.dc.html`).
3. Run `npm run designs:import`.
4. If you added or changed palettes, fonts or sample text, update
   `lib/designs/catalog.ts` to match.

The canvas's eight standalone cards and its animated three-card stories aren't
imported yet. Only the three parametric templates are.
