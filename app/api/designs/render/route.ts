import { NextRequest } from "next/server";
import { DESIGN_STYLES, FIELD_KEYS, SAMPLE, isDesignCategory, palettesFor, type DesignStyle } from "@/lib/designs/catalog";
import { isValidLayout, renderDesignHtml, sampleChoice } from "@/lib/designs/render";
import { readFields } from "@/lib/designs/validate";
import { cardResponse } from "@/lib/designs/http";

// Renders one library design as a standalone page, for gallery thumbnails and
// the editor's live preview. Public: it only ever shows sample wording or text
// the caller passes in the query string — no stored event data.
//   /api/designs/render?style=classic&category=wedding&layout=3[&palette=2][&nameA=…&venue=…&date=YYYY-MM-DD]
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const style = q.get("style") as DesignStyle;
  const category = q.get("category");
  const layout = Number(q.get("layout"));
  if (!DESIGN_STYLES.includes(style) || !isDesignCategory(category) || !isValidLayout(layout)) {
    return new Response("Unknown design", { status: 404 });
  }

  const paletteParam = q.get("palette");
  const palette = paletteParam === null || paletteParam === "" ? null : Number(paletteParam);
  if (palette !== null && !(Number.isInteger(palette) && palette >= 0 && palette < palettesFor(style, category, layout).length)) {
    return new Response("Unknown palette", { status: 404 });
  }

  const sample = SAMPLE[category];
  const choice = sampleChoice(style, category, layout, palette);
  const custom = FIELD_KEYS.some((k) => q.has(k)) || q.has("venue") || q.has("date");
  if (custom) choice.fields = readFields(Object.fromEntries(q), choice.fields);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(q.get("date") ?? "") ? q.get("date")! : sample.date;
  const venue = (q.get("venue") ?? sample.venue).slice(0, 200);

  // Sample renders are deterministic, so browsers and the CDN can keep them.
  return cardResponse(renderDesignHtml(choice, venue, date), custom ? "no-store" : "public, max-age=86400");
}
