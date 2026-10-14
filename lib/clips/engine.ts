import type { OccasionType } from "../occasions";
import { CLIP_THEMES, type ClipStyle, type CollageTheme, type Motif, type ThreadsTheme } from "./themes";

// Draws one frame of an animated invitation at time `t` (seconds). Pure and
// deterministic: the same inputs always give the same pixels, so the browser
// player and the offline MP4 renderer (scripts/render-clips.mts) match exactly.
// Uses only the basic Canvas 2D API so it runs on both.

export const CLIP_W = 720;
export const CLIP_H = 1280;
export const CLIP_DURATION = 12; // seconds; the player loops

type Ctx = CanvasRenderingContext2D;

export interface ClipText {
  lang: "ar" | "en";
  label: string; // occasion name, e.g. "حفل زواج"
  kicker: string; // opening line
  title: string; // event name
  date: string;
  hijri: string;
  venue: string;
  host: string; // e.g. "الداعي: عائلة العتيبي"
  cta: string; // closing line
}

// Font families as CSS font-family values (resolved by the caller: next/font
// names in the browser, registered names offline).
export interface ClipFonts {
  display: string; // Latin display
  displayAr: string; // Arabic display
  body: string; // Latin body
  bodyAr: string; // Arabic body
}

export interface ClipSpec {
  style: ClipStyle;
  occasion: OccasionType;
  text: ClipText;
  fonts: ClipFonts;
}

// ------------------------------------------------------------ helpers

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOutBack = (x: number) => {
  const c1 = 1.4, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const progress = (t: number, start: number, dur: number) => clamp01((t - start) / dur);

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mix(a: string, b: string, k: number, alpha = 1) {
  const [r1, g1, b1] = hexToRgb(a), [r2, g2, b2] = hexToRgb(b);
  return `rgba(${Math.round(r1 + (r2 - r1) * k)},${Math.round(g1 + (g2 - g1) * k)},${Math.round(b1 + (b2 - b1) * k)},${alpha})`;
}
const rgba = (hex: string, a: number) => mix(hex, hex, 0, a);

// ------------------------------------------------------------ motifs (centred at 0,0, size s)

function motifPath(ctx: Ctx, m: Motif, s: number) {
  const h = s / 2;
  ctx.beginPath();
  switch (m) {
    case "leaf":
      ctx.moveTo(0, -h);
      ctx.quadraticCurveTo(h * 0.95, -h * 0.15, 0, h);
      ctx.quadraticCurveTo(-h * 0.95, -h * 0.15, 0, -h);
      break;
    case "maple": {
      const pts = 5;
      for (let i = 0; i <= pts * 2; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / pts;
        const r = i % 2 === 0 ? h : h * 0.45;
        const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.95;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      break;
    }
    case "petal":
      ctx.moveTo(0, -h);
      ctx.bezierCurveTo(h, -h * 0.2, h * 0.6, h, 0, h);
      ctx.bezierCurveTo(-h * 0.6, h, -h, -h * 0.2, 0, -h);
      break;
    case "blossom":
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const cx = Math.cos(a) * h * 0.48, cy = Math.sin(a) * h * 0.48;
        ctx.moveTo(cx + h * 0.42, cy);
        ctx.arc(cx, cy, h * 0.42, 0, Math.PI * 2);
      }
      break;
    case "heart":
      ctx.moveTo(0, h * 0.85);
      ctx.bezierCurveTo(-h * 1.3, -h * 0.1, -h * 0.55, -h * 1.05, 0, -h * 0.35);
      ctx.bezierCurveTo(h * 0.55, -h * 1.05, h * 1.3, -h * 0.1, 0, h * 0.85);
      break;
    case "star":
      for (let i = 0; i <= 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? h : h * 0.42;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      break;
    case "crescent":
      ctx.arc(0, 0, h, Math.PI * 0.32, Math.PI * 1.68, false);
      ctx.arc(h * 0.38, -h * 0.05, h * 0.78, Math.PI * 1.55, Math.PI * 0.45, true);
      break;
    case "lantern":
      ctx.moveTo(-h * 0.15, -h);
      ctx.lineTo(h * 0.15, -h);
      ctx.lineTo(h * 0.35, -h * 0.7);
      ctx.quadraticCurveTo(h * 0.7, 0, h * 0.35, h * 0.7);
      ctx.lineTo(h * 0.2, h);
      ctx.lineTo(-h * 0.2, h);
      ctx.lineTo(-h * 0.35, h * 0.7);
      ctx.quadraticCurveTo(-h * 0.7, 0, -h * 0.35, -h * 0.7);
      ctx.closePath();
      break;
    case "paisley":
      ctx.moveTo(h * 0.2, -h);
      ctx.bezierCurveTo(h * 1.1, -h * 0.4, h * 0.9, h, -h * 0.1, h * 0.9);
      ctx.bezierCurveTo(-h * 0.9, h * 0.8, -h * 0.7, -h * 0.1, 0, -h * 0.2);
      ctx.bezierCurveTo(h * 0.4, -h * 0.3, h * 0.1, -h * 0.7, h * 0.2, -h);
      break;
    case "confetti":
      ctx.rect(-h * 0.55, -h * 0.18, h * 1.1, h * 0.36);
      break;
    case "balloon":
      ctx.ellipse(0, -h * 0.15, h * 0.62, h * 0.8, 0, 0, Math.PI * 2);
      ctx.moveTo(-h * 0.1, h * 0.68);
      ctx.lineTo(h * 0.1, h * 0.68);
      ctx.lineTo(0, h * 0.82);
      ctx.closePath();
      break;
    case "cloud":
      ctx.arc(-h * 0.45, h * 0.1, h * 0.38, 0, Math.PI * 2);
      ctx.moveTo(h * 0.95, h * 0.05);
      ctx.arc(h * 0.5, h * 0.05, h * 0.45, 0, Math.PI * 2);
      ctx.moveTo(h * 0.55, -h * 0.25);
      ctx.arc(0, -h * 0.25, h * 0.55, 0, Math.PI * 2);
      break;
    case "shard":
      ctx.moveTo(0, -h);
      ctx.lineTo(h * 0.8, h * 0.6);
      ctx.lineTo(-h * 0.55, h * 0.85);
      ctx.closePath();
      break;
    case "cap":
      ctx.moveTo(0, -h * 0.7);
      ctx.lineTo(h, -h * 0.25);
      ctx.lineTo(0, h * 0.2);
      ctx.lineTo(-h, -h * 0.25);
      ctx.closePath();
      ctx.rect(-h * 0.5, 0, h, h * 0.45);
      break;
  }
}

// Paper detail drawn on top of a filled motif: veins, centres, strings.
function motifDetail(ctx: Ctx, m: Motif, s: number, color: string) {
  const h = s / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, s / 40);
  ctx.beginPath();
  if (m === "leaf" || m === "petal") {
    ctx.moveTo(0, -h * 0.8);
    ctx.quadraticCurveTo(h * 0.08, 0, 0, h * 0.9);
    ctx.stroke();
  } else if (m === "maple") {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * h * 0.75, Math.sin(a) * h * 0.75);
    }
    ctx.stroke();
  } else if (m === "blossom") {
    ctx.fillStyle = color;
    ctx.arc(0, 0, h * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (m === "balloon") {
    ctx.moveTo(0, h * 0.82);
    ctx.quadraticCurveTo(h * 0.25, h * 1.3, -h * 0.1, h * 1.9);
    ctx.stroke();
  } else if (m === "lantern") {
    ctx.moveTo(-h * 0.45, 0);
    ctx.lineTo(h * 0.45, 0);
    ctx.moveTo(0, -h);
    ctx.lineTo(0, -h * 1.3);
    ctx.stroke();
  } else if (m === "paisley") {
    ctx.arc(h * 0.12, h * 0.25, h * 0.22, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ------------------------------------------------------------ background

function paperGround(ctx: Ctx, theme: CollageTheme) {
  const g = ctx.createLinearGradient(0, 0, 0, CLIP_H);
  g.addColorStop(0, theme.ground[0]);
  g.addColorStop(1, theme.ground[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CLIP_W, CLIP_H);
  // soft light from the top-left, like a studio shot of paper art
  const light = ctx.createRadialGradient(200, 160, 40, 200, 160, 900);
  light.addColorStop(0, "rgba(255,255,255,0.55)");
  light.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, CLIP_W, CLIP_H);
}

function deepGround(ctx: Ctx, theme: ThreadsTheme) {
  const g = ctx.createRadialGradient(CLIP_W / 2, CLIP_H * 0.42, 60, CLIP_W / 2, CLIP_H * 0.5, CLIP_H * 0.75);
  g.addColorStop(0, theme.ground[0]);
  g.addColorStop(1, theme.ground[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CLIP_W, CLIP_H);
}

// ------------------------------------------------------------ collage scene

interface Piece {
  motif: Motif;
  color: string;
  size: number;
  x: number;
  y: number;
  rot: number;
  sx: number;
  sy: number;
  srot: number;
  arrive: number;
  phase: number;
  loose: boolean;
  speed: number;
}

const pieceCache = new Map<string, Piece[]>();

function collagePieces(key: string, theme: CollageTheme): Piece[] {
  const cached = pieceCache.get(key);
  if (cached) return cached;
  const r = rng(hash(key));
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const pieces: Piece[] = [];

  // A wreath arc above the text and a cluster below it, framing the invitation.
  const arcs = [
    { cx: 360, cy: 400, rx: 340, ry: 290, from: Math.PI * 1.02, to: Math.PI * 1.98, n: theme.calm ? 22 : 64 },
    { cx: 360, cy: 1080, rx: 340, ry: 190, from: Math.PI * 0.04, to: Math.PI * 0.96, n: theme.calm ? 16 : 46 },
  ];
  for (const a of arcs) {
    for (let i = 0; i < a.n; i++) {
      const k = (i + r() * 0.6) / a.n;
      const ang = a.from + (a.to - a.from) * k;
      const depth = (r() - 0.4) * 110;
      const x = a.cx + Math.cos(ang) * (a.rx + depth);
      const y = a.cy + Math.sin(ang) * (a.ry + depth);
      const side = r();
      pieces.push({
        motif: pick(theme.motifs),
        color: pick(theme.pieces),
        size: (theme.calm ? 40 : 46) + r() * (theme.calm ? 40 : 58),
        x,
        y,
        rot: ang + Math.PI / 2 + (r() - 0.5) * 1.2,
        sx: side < 0.5 ? -120 - r() * 200 : CLIP_W + 120 + r() * 200,
        sy: y - 300 - r() * 500,
        srot: (r() - 0.5) * 8,
        arrive: (theme.calm ? 0.5 : 0.1) + k * (theme.calm ? 3.4 : 2.4) + r() * 0.6,
        phase: r() * Math.PI * 2,
        loose: false,
        speed: 0,
      });
    }
  }
  // Loose pieces that keep drifting down through the whole clip.
  const loose = theme.calm ? 14 : 12;
  for (let i = 0; i < loose; i++) {
    pieces.push({
      motif: pick(theme.motifs),
      color: pick(theme.pieces),
      size: 28 + r() * 34,
      x: r() * CLIP_W,
      y: r() * CLIP_H,
      rot: r() * Math.PI * 2,
      sx: 0,
      sy: 0,
      srot: (r() - 0.5) * 2,
      arrive: 0,
      phase: r() * Math.PI * 2,
      loose: true,
      speed: (theme.calm ? 28 : 55) + r() * 50,
    });
  }
  pieces.sort((a, b) => Number(a.loose) - Number(b.loose) || b.size - a.size);
  pieceCache.set(key, pieces);
  return pieces;
}

function drawPiece(ctx: Ctx, p: Piece, x: number, y: number, rot: number, alpha: number, theme: CollageTheme) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  // paper casts a soft shadow onto the board
  ctx.shadowColor = "rgba(60,40,20,0.22)";
  ctx.shadowBlur = p.size * 0.22;
  ctx.shadowOffsetX = p.size * 0.06;
  ctx.shadowOffsetY = p.size * 0.1;
  const g = ctx.createLinearGradient(0, -p.size / 2, 0, p.size / 2);
  g.addColorStop(0, mix(p.color, "#ffffff", 0.18));
  g.addColorStop(1, mix(p.color, "#000000", 0.08));
  ctx.fillStyle = g;
  motifPath(ctx, p.motif, p.size);
  ctx.fill(p.motif === "cloud" || p.motif === "blossom" ? "nonzero" : "evenodd");
  ctx.shadowColor = "transparent";
  motifDetail(ctx, p.motif, p.size, p.motif === "blossom" ? theme.accent : mix(p.color, "#000000", 0.25, 0.55));
  ctx.restore();
}

function drawCollage(ctx: Ctx, t: number, key: string, theme: CollageTheme) {
  paperGround(ctx, theme);
  const pieces = collagePieces(key, theme);
  const flight = theme.calm ? 2.6 : 1.5;
  for (const p of pieces) {
    if (p.loose) {
      const y = ((p.y + p.speed * t) % (CLIP_H + 160)) - 80;
      const x = p.x + Math.sin(t * 0.8 + p.phase) * 30;
      drawPiece(ctx, p, x, y, p.rot + p.srot * t, 0.85, theme);
      continue;
    }
    const k = clamp01((t - p.arrive) / flight);
    if (k <= 0) continue;
    const e = theme.calm ? easeOutCubic(k) : easeOutBack(k);
    // curved flight: swing sideways on the way in
    const x = p.sx + (p.x - p.sx) * e + Math.sin(k * Math.PI) * 60 * Math.sign(p.x - p.sx);
    const y = p.sy + (p.y - p.sy) * easeOutCubic(k);
    const sway = Math.sin(t * 1.3 + p.phase) * (k === 1 ? 0.06 : 0);
    const bob = Math.sin(t * 1.1 + p.phase) * (k === 1 ? 2.5 : 0);
    drawPiece(ctx, p, x, y + bob, p.srot * (1 - e) + p.rot + sway, Math.min(1, k * 3), theme);
  }
}

// ------------------------------------------------------------ threads scene

interface Bundle {
  px: number;
  py: number;
  angle: number;
  spread: number;
  len: number;
  delay: number;
  phase: number;
  dir: number;
  colors: [string, string];
}

const bundleCache = new Map<string, { bundles: Bundle[]; motes: { x: number; y: number; s: number; speed: number; phase: number }[] }>();

function threadsSetup(key: string, theme: ThreadsTheme) {
  const cached = bundleCache.get(key);
  if (cached) return cached;
  const r = rng(hash(key));
  const bundles: Bundle[] = [];
  const n = theme.calm ? 3 : 6;
  for (let i = 0; i < n; i++) {
    bundles.push({
      px: 360 + (r() - 0.5) * 120,
      py: 610 + (r() - 0.5) * 80,
      angle: (i / n) * Math.PI * 2 + r() * 0.6,
      spread: 1.5 + r() * 0.9,
      len: 430 + r() * 220,
      delay: 0.15 + i * 0.25,
      phase: r() * Math.PI * 2,
      dir: r() < 0.5 ? -1 : 1,
      colors: theme.strands[i % theme.strands.length],
    });
  }
  const motes = Array.from({ length: theme.sparkle ? 46 : 0 }, () => ({
    x: r() * CLIP_W,
    y: r() * CLIP_H,
    s: 3 + r() * 6,
    speed: 40 + r() * 70,
    phase: r() * Math.PI * 2,
  }));
  const out = { bundles, motes };
  bundleCache.set(key, out);
  return out;
}

function drawThreads(ctx: Ctx, t: number, key: string, theme: ThreadsTheme) {
  deepGround(ctx, theme);
  const { bundles, motes } = threadsSetup(key, theme);
  const tempo = theme.calm ? 0.35 : 0.85;
  // After the opening, the dance drifts upward and softens behind the text.
  const settle = easeInOut(progress(t, 3, 2.5));
  ctx.save();
  ctx.globalCompositeOperation = theme.calm ? "source-over" : "lighter";
  const strands = theme.calm ? 60 : 96;
  for (const b of bundles) {
    const grow = easeOutCubic(progress(t, b.delay, 2.4));
    if (grow <= 0) continue;
    const len = b.len * grow * (1 - settle * 0.2);
    const px = b.px, py = b.py - settle * 280;
    const swirl = Math.sin(t * tempo + b.phase) * 0.7 * b.dir + t * 0.18 * b.dir;
    const alpha = (theme.calm ? 0.24 : 0.2) * (1 - settle * 0.4);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < strands; i++) {
      const k = i / (strands - 1);
      const a = b.angle + swirl + (k - 0.5) * b.spread;
      const bend = Math.sin(t * tempo * 1.3 + b.phase + k * 3) * 0.55 * b.dir;
      const l = len * (0.75 + 0.25 * Math.sin(k * 9 + b.phase));
      const c1x = px + Math.cos(a - bend * 0.5) * l * 0.35, c1y = py + Math.sin(a - bend * 0.5) * l * 0.35;
      const c2x = px + Math.cos(a + bend) * l * 0.75, c2y = py + Math.sin(a + bend) * l * 0.75;
      const ex = px + Math.cos(a + bend * 1.6) * l, ey = py + Math.sin(a + bend * 1.6) * l;
      ctx.strokeStyle = mix(b.colors[0], b.colors[1], k, alpha);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
      ctx.stroke();
    }
  }
  ctx.restore();

  // A scarf of fine threads sweeping diagonally across, like a dancer's sash.
  const rib = easeOutCubic(progress(t, 0.8, 2.2));
  if (rib > 0) {
    ctx.save();
    ctx.globalCompositeOperation = theme.calm ? "source-over" : "lighter";
    const threads = 26, steps = 48;
    const lift = settle * 120;
    for (let s = 0; s < threads; s++) {
      const off = (s / (threads - 1) - 0.5) * 2; // -1..1 across the scarf
      ctx.strokeStyle = mix(theme.ribbon, "#ffffff", Math.max(0, off) * 0.25, (theme.calm ? 0.18 : 0.32) * (1 - settle * 0.35));
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const k = (i / steps) * rib;
        // diagonal path from lower-left to upper-right, with a lazy S-curve
        const bx = -60 + k * (CLIP_W + 120);
        const by = 980 - lift - k * 760 + Math.sin(k * Math.PI * 2 + t * (theme.calm ? 0.5 : 1.1)) * 90;
        const width = Math.sin(k * Math.PI) * 34 * Math.cos(k * 5 + t * 0.9); // twists as it flows
        const x = bx + off * width * 0.35;
        const y = by + off * width;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Falling petals catching the light.
  if (theme.sparkle) {
    const on = progress(t, 1, 1.5);
    ctx.save();
    for (const m of motes) {
      const y = ((m.y + m.speed * t) % (CLIP_H + 40)) - 20;
      const x = m.x + Math.sin(t * 1.2 + m.phase) * 18;
      const flicker = 0.55 + 0.45 * Math.sin(t * 3 + m.phase);
      ctx.globalAlpha = on * flicker;
      ctx.fillStyle = theme.sparkle;
      ctx.beginPath();
      ctx.ellipse(x, y, m.s, m.s * 0.55, t * 2 + m.phase, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Darken softly behind the text so it stays readable.
  const veil = progress(t, 2.8, 1.5);
  if (veil > 0) {
    const g = ctx.createRadialGradient(CLIP_W / 2, 790, 60, CLIP_W / 2, 790, 520);
    g.addColorStop(0, rgba(theme.ground[1], 0.78 * veil));
    g.addColorStop(1, rgba(theme.ground[1], 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CLIP_W, CLIP_H);
  }
}

// ------------------------------------------------------------ text

function wrap(ctx: Ctx, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawText(ctx: Ctx, t: number, spec: ClipSpec, colors: { ink: string; muted: string; accent: string }, panel: string | null) {
  const { text: tx, fonts } = spec;
  const ar = tx.lang === "ar";
  const display = ar ? fonts.displayAr : fonts.display;
  const body = ar ? fonts.bodyAr : fonts.body;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = ar ? "rtl" : "ltr";
  const cx = CLIP_W / 2;

  // Layout first (so every line keeps its place while animating in).
  type Line = { text: string; font: string; color: string; size: number; start: number; gap: number; wipe?: boolean };
  const lines: Line[] = [];
  const add = (text: string, font: string, size: number, color: string, start: number, gap: number, wipe = false) => {
    if (text) lines.push({ text, font, color, size, start, gap, wipe });
  };
  add(ar ? tx.label : tx.label.toUpperCase(), `500 ${ar ? 26 : 20}px ${body}`, ar ? 26 : 20, colors.accent, 3.0, 22);
  add(tx.kicker, `400 ${ar ? 30 : 28}px ${display}`, ar ? 30 : 28, colors.muted, 3.4, 30);
  // Title: as large as fits in three lines.
  let titleSize = ar ? 72 : 64;
  let titleLines: string[] = [];
  for (; titleSize >= 40; titleSize -= 4) {
    ctx.font = `700 ${titleSize}px ${display}`;
    titleLines = wrap(ctx, tx.title, 560);
    if (titleLines.length <= 3) break;
  }
  titleLines.forEach((l, i) => add(l, `700 ${titleSize}px ${display}`, titleSize, colors.ink, 4.0 + i * 0.25, i === titleLines.length - 1 ? 64 : 10, true));
  const ornamentIndex = lines.length;
  add(tx.date, `500 ${ar ? 30 : 28}px ${body}`, ar ? 30 : 28, colors.ink, 6.0, 8);
  add(tx.hijri, `400 ${ar ? 24 : 22}px ${body}`, ar ? 24 : 22, colors.muted, 6.4, 26);
  add(tx.venue, `400 ${ar ? 28 : 26}px ${body}`, ar ? 28 : 26, colors.ink, 6.9, 30);
  add(tx.host, `400 ${ar ? 26 : 24}px ${body}`, ar ? 26 : 24, colors.muted, 7.6, 40);
  add(tx.cta, `400 ${ar ? 36 : 32}px ${display}`, ar ? 36 : 32, colors.accent, 8.6, 0);

  const total = lines.reduce((s, l) => s + l.size * 1.25 + l.gap, 0) + 30;
  let y = Math.max(470, 790 - total / 2);

  // A soft paper panel behind the text (collage) keeps it legible over pieces.
  if (panel) {
    const p = easeOutCubic(progress(t, 2.7, 1.2));
    if (p > 0) {
      ctx.save();
      ctx.globalAlpha = 0.82 * p;
      ctx.fillStyle = panel;
      ctx.shadowColor = "rgba(60,40,20,0.18)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      const w = 620, h = total + 70, x0 = cx - w / 2, y0 = y - 50;
      ctx.beginPath();
      ctx.moveTo(x0 + 18, y0);
      ctx.lineTo(x0 + w - 18, y0);
      ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + 18);
      ctx.lineTo(x0 + w, y0 + h - 18);
      ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - 18, y0 + h);
      ctx.lineTo(x0 + 18, y0 + h);
      ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - 18);
      ctx.lineTo(x0, y0 + 18);
      ctx.quadraticCurveTo(x0, y0, x0 + 18, y0);
      ctx.fill();
      // fine double rule, like a printed card
      ctx.shadowColor = "transparent";
      ctx.globalAlpha = 0.55 * p;
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 14, y0 + 14, w - 28, h - 28);
      ctx.globalAlpha = 0.3 * p;
      ctx.strokeRect(x0 + 20, y0 + 20, w - 40, h - 40);
      ctx.restore();
    }
  }

  lines.forEach((l, i) => {
    y += l.size * 1.25;
    const p = progress(t, l.start, 0.9);
    if (p > 0) {
      ctx.save();
      ctx.font = l.font;
      ctx.fillStyle = l.color;
      ctx.globalAlpha = easeOutCubic(p);
      if (l.wipe) {
        // reveal from the centre outward
        const w = CLIP_W * easeInOut(p);
        ctx.beginPath();
        ctx.rect(cx - w / 2, y - l.size * 1.3, w, l.size * 1.7);
        ctx.clip();
      }
      ctx.fillText(l.text, cx, y + (1 - easeOutCubic(p)) * 16);
      ctx.restore();
    }
    // Ornament after the title: a hairline with a small diamond.
    if (i === ornamentIndex - 1) {
      const o = easeInOut(progress(t, 5.3, 1));
      if (o > 0) {
        ctx.save();
        ctx.strokeStyle = colors.accent;
        ctx.fillStyle = colors.accent;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 1.4;
        const half = 150 * o, oy = y + l.gap * 0.62;
        ctx.beginPath();
        ctx.moveTo(cx - half, oy);
        ctx.lineTo(cx - 14, oy);
        ctx.moveTo(cx + 14, oy);
        ctx.lineTo(cx + half, oy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, oy - 7 * o);
        ctx.lineTo(cx + 7 * o, oy);
        ctx.lineTo(cx, oy + 7 * o);
        ctx.lineTo(cx - 7 * o, oy);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    y += l.gap;
  });
  ctx.restore();
}

// ------------------------------------------------------------ public

export function renderClipFrame(ctx: Ctx, t: number, spec: ClipSpec) {
  const theme = CLIP_THEMES[spec.occasion] ?? CLIP_THEMES.other;
  const key = `${spec.style}:${spec.occasion}`;
  ctx.save();
  if (spec.style === "collage") {
    drawCollage(ctx, t, key, theme.collage);
    drawText(ctx, t, spec, theme.collage, mix(theme.collage.ground[0], "#ffffff", 0.55));
  } else {
    drawThreads(ctx, t, key, theme.threads);
    drawText(ctx, t, spec, theme.threads, null);
  }
  // fade in from the ground colour at the very start, so loops feel seamless
  const fade = 1 - progress(t, 0, 0.6);
  if (fade > 0) {
    ctx.globalAlpha = fade;
    ctx.fillStyle = spec.style === "collage" ? theme.collage.ground[0] : theme.threads.ground[1];
    ctx.fillRect(0, 0, CLIP_W, CLIP_H);
  }
  ctx.restore();
}
