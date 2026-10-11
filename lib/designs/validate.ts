import { FIELD_KEYS, DESIGN_STYLES, isDesignCategory, palettesFor, type DesignFields, type DesignStyle } from "./catalog";
import { isValidLayout, type DesignChoice } from "./render";

const MAX_FIELD = 200;

// Reads design fields from untrusted input: known keys only, strings only, trimmed and capped.
export function readFields(input: unknown, fallback: DesignFields): DesignFields {
  const src = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const out = { ...fallback };
  for (const key of FIELD_KEYS) {
    const v = src[key];
    if (typeof v === "string") out[key] = v.trim().slice(0, MAX_FIELD);
  }
  return out;
}

// Validates a design choice from a request body. Returns null if it's malformed.
export function parseDesignChoice(input: unknown, fallbackFields: DesignFields): DesignChoice | null {
  if (!input || typeof input !== "object") return null;
  const v = input as Record<string, unknown>;
  if (!DESIGN_STYLES.includes(v.style as DesignStyle) || !isDesignCategory(v.category) || !isValidLayout(v.layout)) return null;
  const style = v.style as DesignStyle;
  const count = palettesFor(style, v.category, v.layout).length;
  const palette = v.palette === null || v.palette === undefined ? null : Number(v.palette);
  if (palette !== null && !(Number.isInteger(palette) && palette >= 0 && palette < count)) return null;
  const fields = readFields(v.fields, fallbackFields);
  if (!fields.nameA) return null;
  return { style, category: v.category, layout: v.layout, palette, fields };
}
