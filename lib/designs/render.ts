import { MARKUP } from "./markup.generated";
import { renderTemplate, escapeHtml } from "./engine";
import {
  CLASSIC_FONTS,
  MODERN_FONTS,
  SAMPLE,
  categoryIndex,
  defaultPaletteIndex,
  palettesFor,
  sampleFields,
  type DesignCategory,
  type DesignFields,
  type DesignStyle,
} from "./catalog";

// A design applied to an event (stored on the event).
export interface DesignChoice {
  style: DesignStyle;
  category: DesignCategory;
  layout: number; // 1–20
  palette: number | null; // index into palettesFor(); null = the layout's default
  fields: DesignFields;
}

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function rgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

// Text values shared by both styles (ported from the canvas's renderVals()).
function textValues(f: DesignFields, venue: string, ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const couple = Boolean(f.nameB.trim());
  const first = (s: string) => Array.from(s.trim())[0] ?? "";
  return {
    couple,
    t: {
      kicker: f.kicker, title: f.title, body: f.body, time: f.time, venue, city: f.city, cta: f.cta, en: f.en, note: f.note,
      nameA: f.nameA, nameB: f.nameB, nameLine: couple ? `${f.nameA} و ${f.nameB}` : f.nameA,
      iA: first(f.nameA), mono: couple ? `${first(f.nameA)} & ${first(f.nameB)}` : first(f.nameA),
      second: couple ? f.nameB : f.title.split(" ")[0], word: f.title.split(" ").slice(-1)[0],
      day: DAYS[wd], dnum: String(d), month: MONTHS[m - 1], year: String(y),
      dNum: `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`,
      dShort: `${d} ${MONTHS[m - 1]}`, dateLine: `${DAYS[wd]} ${d} ${MONTHS[m - 1]} ${y}`,
    },
    date: { y, m, d },
  };
}

function classicValues(choice: DesignChoice, venue: string, ymd: string) {
  const { layout: n, category } = choice;
  const palettes = palettesFor("classic", category, n);
  const c = palettes[choice.palette ?? defaultPaletteIndex("classic", category, n)] ?? palettes[0];
  const [d, b] = CLASSIC_FONTS[n - 1];
  const { couple, t, date } = textValues(choice.fields, venue, ymd);

  // Month grid for the "Calendar" layout, with the event day highlighted.
  const firstWeekday = new Date(Date.UTC(date.y, date.m - 1, 1)).getUTCDay();
  const len = new Date(Date.UTC(date.y, date.m, 0)).getUTCDate();
  const base = "width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; ";
  const cal = [
    ...Array.from({ length: firstWeekday }, () => ({ n: "", st: base })),
    ...Array.from({ length: len }, (_, i) => ({
      n: String(i + 1),
      st: i + 1 === date.d ? `${base}background: ${c.accent}; color: ${c.on}; font-weight: 700` : base,
    })),
  ];
  return { c, d, b, t, couple, single: !couple, cal, wk: ["ح", "ن", "ث", "ر", "خ", "ج", "س"] };
}

function modernValues(choice: DesignChoice, venue: string, ymd: string) {
  const { layout: n, category } = choice;
  const k = categoryIndex(category);
  const palettes = palettesFor("modern", category, n);
  const base = palettes[choice.palette ?? defaultPaletteIndex("modern", category, n)] ?? palettes[0];
  const c = { ...base, glass: rgba(base.soft, 0.55), glassLine: rgba(base.ink, 0.22) };
  const [d, w, b] = MODERN_FONTS[n - 1];
  const { couple, t } = textValues(choice.fields, venue, ymd);
  const v: Record<string, unknown> = { c, d, w, b, t: { ...t, occKey: category }, couple, net: { lines: "", hot: "", nodes: "", lit: "" }, grid: "", wave: [], dots: [] };

  if (n === 12) {
    // Neural network
    const layers: [number, number[]][] = [[60, [60, 130, 200, 270]], [160, [40, 105, 170, 235, 300]], [260, [80, 160, 240]], [360, [120, 210]]];
    let lines = "", hot = "", nodes = "", lit = "";
    for (let li = 0; li < layers.length - 1; li++) {
      const [ax, ays] = layers[li], [bx, bys] = layers[li + 1];
      ays.forEach((ay, ai) =>
        bys.forEach((by, bi) => {
          const seg = `M${ax} ${ay}L${bx} ${by}`;
          if ((ai + bi + li + k) % 4 === 0) hot += seg;
          else lines += seg;
        })
      );
    }
    layers.forEach(([x, ys], lj) =>
      ys.forEach((yy, nj) => {
        const r = 9;
        const circ = `M${x - r} ${yy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
        if ((nj + lj + k) % 3 === 0) lit += circ;
        else nodes += circ;
      })
    );
    v.net = { lines, hot, nodes, lit };
  }
  if (n === 13) {
    // Neon horizon grid
    let g = "";
    for (let gi = 0; gi < 8; gi++) g += `M0 ${(4 + Math.pow(gi / 7, 1.8) * 170).toFixed(1)}H420`;
    for (let gx = -6; gx <= 6; gx++) g += `M${210 + gx * 14} 0L${210 + gx * 70} 180`;
    v.grid = g;
  }
  if (n === 16) {
    // Waveform
    v.wave = Array.from({ length: 44 }, (_, wi) => {
      const h = Math.round(14 + Math.abs(Math.sin(wi * 0.47 + k) * Math.cos(wi * 0.19)) * 130 + (wi % 4) * 3);
      return { st: `width: 4px; height: ${h}px; border-radius: 2px; background: ${wi % 7 === 3 ? c.a2 : c.accent}` };
    });
  }
  if (n === 18) {
    // Dot matrix
    const dots = [];
    for (let ry = 0; ry < 10; ry++)
      for (let rx = 0; rx < 14; rx++) {
        const dist = Math.sqrt(Math.pow(rx - 10 + (k % 3), 2) + Math.pow(ry - 3, 2));
        const s = Math.max(2, Math.round(24 - dist * 2.4));
        dots.push({ st: `width: ${s}px; height: ${s}px; border-radius: 50%; background: ${(rx + ry) % 5 === 0 ? c.a2 : c.accent}` });
      }
    v.dots = dots;
  }
  return v;
}

export function isValidLayout(n: unknown): n is number {
  return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 20;
}

// A complete standalone HTML page for one card (420×760). Served to a
// sandboxed iframe, so it carries its own fonts and never runs scripts.
export function renderDesignHtml(choice: DesignChoice, venue: string, eventDate: string, title = "Invitation") {
  const src = MARKUP[choice.style];
  const layout = src.layouts[choice.layout - 1];
  const values = choice.style === "classic" ? classicValues(choice, venue, eventDate) : modernValues(choice, venue, eventDate);
  for (let j = 1; j <= 20; j++) (values as Record<string, unknown>)[`L${j}`] = j === choice.layout;
  const card = renderTemplate(`${src.root}${layout.markup}</div>`, values);

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=420">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${escapeHtml(src.fontsHref)}">
<style>html,body{margin:0;background:transparent}body{width:420px;height:760px;overflow:hidden}</style>
</head>
<body>${card}</body>
</html>`;
}

// Gallery previews: a design filled with its category's sample wording.
export function sampleChoice(style: DesignStyle, category: DesignCategory, layout: number, palette: number | null = null): DesignChoice {
  return { style, category, layout, palette, fields: sampleFields(category) };
}

export function sampleHtml(style: DesignStyle, category: DesignCategory, layout: number, palette: number | null = null) {
  const s = SAMPLE[category];
  return renderDesignHtml(sampleChoice(style, category, layout, palette), s.venue, s.date);
}
