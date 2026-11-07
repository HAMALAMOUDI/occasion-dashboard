import { escapeHtml } from "./engine";
import type { Palette } from "./catalog";

// The atelier collection: painted and photographed artwork (public/designs/art/*.jpg,
// made for Hikayati with Gamma's image generator) with the wording set below it.
// Each artwork leaves its lower part calm; `top` is where the wording starts.

export interface AtelierArt {
  file: string;
  name: { en: string; ar: string };
  top: number; // px from the card's top where the wording area begins
  paper: string; // the calm colour the artwork fades into
  ink: string;
  muted: string;
  accent: string;
  on: string; // text on an accent-coloured button
  display: string; // names
  body: string;
}

export const ATELIER_ART: AtelierArt[] = [
  { file: "seal", name: { en: "Wax seal", ar: "ختم الشمع" }, top: 418, paper: "#f1e9dc", ink: "#3b2f20", muted: "#7a6a52", accent: "#a8843f", on: "#fffaf0", display: "'Aref Ruqaa', serif", body: "'Amiri', serif" },
  { file: "door", name: { en: "Garden door", ar: "باب الحديقة" }, top: 388, paper: "#e7c99c", ink: "#3a2a18", muted: "#6e5434", accent: "#5f7a64", on: "#fbf6ec", display: "'Reem Kufi', sans-serif", body: "'Tajawal', sans-serif" },
  { file: "courtyard", name: { en: "Courtyard", ar: "الفناء" }, top: 380, paper: "#f6efe3", ink: "#2f3b31", muted: "#6d6a58", accent: "#b5654a", on: "#fffaf3", display: "'Aref Ruqaa', serif", body: "'Amiri', serif" },
  { file: "jasmine", name: { en: "Jasmine", ar: "الياسمين" }, top: 330, paper: "#a9b5a0", ink: "#22301f", muted: "#3f4d3b", accent: "#fbf8ef", on: "#2c3a29", display: "'El Messiri', sans-serif", body: "'IBM Plex Sans Arabic', sans-serif" },
  { file: "desert", name: { en: "Desert night", ar: "ليل الصحراء" }, top: 380, paper: "#1d1a2b", ink: "#f6e7c8", muted: "#c9b48e", accent: "#e1b462", on: "#1d1a2b", display: "'Aref Ruqaa', serif", body: "'Tajawal', sans-serif" },
  { file: "ribbon", name: { en: "Silk ribbon", ar: "شريط الحرير" }, top: 380, paper: "#ead2cb", ink: "#4a2a2b", muted: "#80595a", accent: "#a65a62", on: "#fff6f3", display: "'Aref Ruqaa', serif", body: "'Amiri', serif" },
  { file: "alula", name: { en: "AlUla", ar: "العُلا" }, top: 380, paper: "#f5ebdf", ink: "#3c2a26", muted: "#7d655b", accent: "#c0704f", on: "#fff8f1", display: "'Reem Kufi', sans-serif", body: "'Tajawal', sans-serif" },
  { file: "mashrabiya", name: { en: "Mashrabiya light", ar: "ضوء المشربية" }, top: 380, paper: "#0f3a30", ink: "#f4e6c4", muted: "#c9c19c", accent: "#d9a85b", on: "#10352c", display: "'El Messiri', sans-serif", body: "'IBM Plex Sans Arabic', sans-serif" },
  { file: "crescent", name: { en: "Crescent lanterns", ar: "هلال وفوانيس" }, top: 380, paper: "#0f1a38", ink: "#f3e3bd", muted: "#b9b098", accent: "#d6ac5c", on: "#101a36", display: "'Aref Ruqaa', serif", body: "'Tajawal', sans-serif" },
  { file: "balloons", name: { en: "Balloons", ar: "بالونات" }, top: 380, paper: "#fbf8f2", ink: "#33403b", muted: "#77807a", accent: "#e08d6d", on: "#ffffff", display: "'Marhey', sans-serif", body: "'Tajawal', sans-serif" },
];

export const ATELIER_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&family=Reem+Kufi:wght@400;600&family=El+Messiri:wght@400;600&family=IBM+Plex+Sans+Arabic:wght@400;500&family=Tajawal:wght@400;500;700&family=Marhey:wght@500;700&display=swap";

// One palette per artwork (the art sets the colours), so the colour picker stays hidden.
export const atelierPalette = (n: number): Palette => {
  const a = ATELIER_ART[n - 1];
  return { bg: a.paper, ink: a.ink, muted: a.muted, accent: a.accent, on: a.on, soft: a.paper, line: a.muted };
};

function rgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${alpha})`;
}

export interface AtelierText {
  kicker: string;
  title: string;
  en: string;
  nameA: string;
  nameB: string;
  body: string;
  day: string;
  dnum: string;
  month: string;
  year: string;
  time: string;
  venue: string;
  city: string;
  cta: string;
  note: string;
}

// The card markup (420×760). Every value is escaped; the artwork is our own static file.
export function atelierMarkup(n: number, t: AtelierText, hasCta: boolean) {
  const a = ATELIER_ART[n - 1];
  const e = (s: string) => escapeHtml(s);
  const couple = Boolean(t.nameB.trim());
  const and = `<span style="font-size:22px;color:${a.accent};margin:0 8px">و</span>`;
  // Short couples share one line; longer names stack.
  const names = !couple
    ? `<div style="font-size:44px;line-height:1.15">${e(t.nameA)}</div>`
    : Array.from(t.nameA + t.nameB).length <= 12
      ? `<div style="font-size:42px;line-height:1.2">${e(t.nameA)}${and}${e(t.nameB)}</div>`
      : `<div style="font-size:34px;line-height:1.1">${e(t.nameA)}</div><div style="line-height:1">${and}</div><div style="font-size:34px;line-height:1.1">${e(t.nameB)}</div>`;
  const cell = (top: string, big: string) =>
    `<div style="flex:1;padding:0 6px"><div style="font-size:11px;color:${a.muted}">${e(top)}</div><div style="font-size:15px;font-weight:700;margin-top:2px">${e(big)}</div></div>`;
  const rule = `<span style="width:1px;align-self:stretch;background:${rgba(a.ink, 0.25)}"></span>`;
  const place = [t.venue, t.city].filter((s) => s.trim()).map(e).join(" · ");

  return `<div dir="rtl" style="width:420px;height:760px;position:relative;overflow:hidden;background:${a.paper};color:${a.ink};font-family:${a.body};text-wrap:balance">
<img src="/designs/art/${a.file}.jpg" alt="" style="position:absolute;inset:0;width:420px;height:760px;object-fit:cover">
<div style="position:absolute;inset:0;background:linear-gradient(180deg,${rgba(a.paper, 0)} ${a.top - 150}px,${rgba(a.paper, 0.78)} ${a.top + 10}px,${rgba(a.paper, 0.9)} 100%)"></div>
<div style="position:absolute;inset:${a.top}px 30px 20px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:7px">
<div style="font-size:12.5px;color:${a.muted}">${e(t.kicker)}</div>
<div style="display:flex;align-items:center;gap:10px;font-size:15px;color:${a.accent};font-weight:700"><span style="width:28px;height:1px;background:${a.accent}"></span>${e(t.title)}<span style="width:28px;height:1px;background:${a.accent}"></span></div>
<div style="font-family:${a.display};color:${a.ink}">${names}</div>
<div style="font-size:13px;line-height:1.65;color:${a.muted};max-width:320px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${e(t.body)}</div>
<div style="display:flex;align-items:center;width:100%;max-width:300px;padding:6px 0;border-top:1px solid ${rgba(a.ink, 0.2)};border-bottom:1px solid ${rgba(a.ink, 0.2)}">${cell(t.day, t.dnum)}${rule}${cell(t.month, t.year)}${rule}${cell("الوقت", t.time)}</div>
${place ? `<div style="font-size:13px">${place}</div>` : ""}
${hasCta ? `<div style="margin-top:4px;padding:8px 26px;border-radius:999px;background:${a.accent};color:${a.on};font-size:14px;font-weight:700">${e(t.cta)}</div>` : ""}
${t.note.trim() ? `<div style="font-size:12px;color:${a.muted}">${e(t.note)}</div>` : ""}
</div>
</div>`;
}
