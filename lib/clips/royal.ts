import type { OccasionType } from "../occasions";
import type { ClipFonts, ClipText } from "./engine";
import { CLIP_THEMES } from "./themes";
import { clamp01, easeInOut, easeOutBack, easeOutCubic, hash, mix, noise, progress, rgba, rng, wind } from "./util";

// "Royal entrance": an ivory-and-gold invitation. Curtains part and a gilded
// gate swings open between two lanterns; the view glides into a palace hall
// with a grand staircase and a chandelier; cream roses bloom into a frame and
// the names appear in gold calligraphy. Original artwork, drawn in code.

type Ctx = CanvasRenderingContext2D;
const W = 720;
const H = 1280;

const IVORY = "#fbf6ec";
const CREAM = "#f3e8d4";
const SAND = "#e6d4b4";
const GOLD = "#b8893a";
const GOLD_LIGHT = "#e9cd8a";
const GOLD_DEEP = "#8a6424";

function goldGradient(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, shine = 0) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, GOLD_DEEP);
  g.addColorStop(clamp01(0.35 + shine * 0.3), GOLD_LIGHT);
  g.addColorStop(clamp01(0.55 + shine * 0.3), "#fff3cf");
  g.addColorStop(1, GOLD);
  return g;
}

// ------------------------------------------------------------ the hall (behind the gate)

function hall(ctx: Ctx, t: number, key: string) {
  const wall = ctx.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, "#f6ecdb");
  wall.addColorStop(0.55, IVORY);
  wall.addColorStop(1, "#efe2c8");
  ctx.fillStyle = wall;
  ctx.fillRect(-60, -60, W + 120, H + 120);

  // warm light pouring from the top of the stairs
  const light = ctx.createRadialGradient(W / 2, 520, 20, W / 2, 520, 620);
  light.addColorStop(0, "rgba(255,247,222,0.95)");
  light.addColorStop(1, "rgba(255,247,222,0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, W, H);

  // three tall arches with gilded frames
  for (const [cx, w, top] of [[W / 2, 260, 230], [110, 170, 330], [W - 110, 170, 330]] as const) {
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, 900);
    ctx.lineTo(cx - w / 2, top + w / 2);
    ctx.arc(cx, top + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(cx + w / 2, 900);
    ctx.stroke();
    ctx.fillStyle = rgba("#ffffff", 0.35);
    ctx.fill();
  }
  // columns
  for (const x of [205, W - 205]) {
    const col = ctx.createLinearGradient(x - 18, 0, x + 18, 0);
    col.addColorStop(0, "#e8dcc4");
    col.addColorStop(0.5, "#fffaf0");
    col.addColorStop(1, "#dccdb0");
    ctx.fillStyle = col;
    ctx.fillRect(x - 18, 260, 36, 640);
    ctx.fillStyle = goldGradient(ctx, x - 26, 0, x + 26, 0);
    ctx.fillRect(x - 26, 250, 52, 14);
    ctx.fillRect(x - 26, 892, 52, 14);
  }

  // the grand staircase rising to a landing
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const k = i / steps;
    const y = 1180 - k * 520;
    const half = 300 - k * 190;
    const g = ctx.createLinearGradient(0, y - 30, 0, y);
    g.addColorStop(0, mix(IVORY, "#ffffff", 0.5));
    g.addColorStop(1, mix(SAND, CREAM, k));
    ctx.fillStyle = g;
    ctx.fillRect(W / 2 - half, y - 34 + k * 4, half * 2, 34 - k * 4);
    ctx.strokeStyle = rgba(GOLD, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - half, y - 34 + k * 4);
    ctx.lineTo(W / 2 + half, y - 34 + k * 4);
    ctx.stroke();
  }
  // curving gilded banisters with candle-like glows
  for (const s of [-1, 1]) {
    ctx.strokeStyle = goldGradient(ctx, 0, 660, 0, 1200);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(W / 2 + s * 320, 1200);
    ctx.bezierCurveTo(W / 2 + s * 330, 950, W / 2 + s * 120, 800, W / 2 + s * 120, 650);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const k = i / 5;
      const x = W / 2 + s * (320 - k * 200) + s * Math.sin(k * 3) * 10, y = 1180 - k * 520;
      const f = 0.75 + 0.25 * Math.sin(t * 6 + i * 2 + s);
      const glow = ctx.createRadialGradient(x, y - 30, 2, x, y - 30, 26);
      glow.addColorStop(0, `rgba(255,236,170,${0.9 * f})`);
      glow.addColorStop(1, "rgba(255,236,170,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 26, y - 56, 52, 52);
    }
  }

  // chandelier: a ring of crystals that sways and sparkles
  const sway = Math.sin(t * 0.7) * 0.03;
  ctx.save();
  ctx.translate(W / 2, 40);
  ctx.rotate(sway);
  ctx.strokeStyle = rgba(GOLD, 0.8);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 120);
  ctx.stroke();
  const r = rng(hash(key + "crystal"));
  for (let ring = 0; ring < 3; ring++) {
    const rx = 120 - ring * 34, ry = 26 - ring * 6, cy = 150 + ring * 34;
    ctx.strokeStyle = goldGradient(ctx, -rx, 0, rx, 0);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 18 - ring * 4; i++) {
      const a = (i / (18 - ring * 4)) * Math.PI * 2;
      const x = Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
      const sp = 0.4 + 0.6 * Math.max(0, Math.sin(t * 3 + r() * 9));
      ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * sp})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 3, y + 12);
      ctx.lineTo(x, y + 22);
      ctx.lineTo(x - 3, y + 12);
      ctx.closePath();
      ctx.fill();
      if (sp > 0.9) {
        ctx.fillStyle = "rgba(255,250,220,0.8)";
        ctx.fillRect(x - 6, y + 11, 12, 1.2);
        ctx.fillRect(x - 0.6, y + 5, 1.2, 12);
      }
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------ the gate

function gateDoor(ctx: Ctx, hingeX: number, dir: 1 | -1, open: number) {
  const width = 300, top = 640, bottom = 1170;
  const angle = open * 1.3;
  const c = Math.cos(angle), s = Math.sin(angle);
  const bars = 13;
  const proj = (u: number) => hingeX + dir * u * width * c; // projected x of a point u (0 hinge → 1 middle)
  const grow = (u: number) => 1 + 0.22 * s * u; // the swinging edge comes toward us
  const archY = (u: number) => top - Math.sin(u * Math.PI * 0.5) * 70; // rises to the centre
  ctx.save();
  ctx.lineCap = "round";
  // vertical bars with spear finials
  for (let i = 0; i <= bars; i++) {
    const u = i / bars;
    const x = proj(u), g = grow(u);
    const yTop = 1170 - (1170 - archY(u)) * g;
    ctx.strokeStyle = goldGradient(ctx, x - 4, 0, x + 4, 0);
    ctx.lineWidth = 4.5 * Math.max(0.4, c) + 1;
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, yTop);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(x, yTop - 18 * g);
    ctx.lineTo(x + 5, yTop - 4);
    ctx.lineTo(x - 5, yTop - 4);
    ctx.closePath();
    ctx.fill();
  }
  // rails and the curved top rail
  ctx.strokeStyle = goldGradient(ctx, hingeX, 0, proj(1), 0);
  ctx.lineWidth = 5;
  for (const yy of [1080, 940]) {
    ctx.beginPath();
    ctx.moveTo(proj(0), yy);
    ctx.lineTo(proj(1), 1170 - (1170 - yy) * grow(1));
    ctx.stroke();
  }
  ctx.beginPath();
  for (let i = 0; i <= 20; i++) {
    const u = i / 20, x = proj(u), y = 1170 - (1170 - (archY(u) + 30)) * grow(u);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // scrollwork between the rails
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 6; i++) {
    const u = (i + 0.5) / 6, x = proj(u), g = grow(u);
    const y = 1170 - (1170 - 1010) * g, rr = 22 * g * Math.max(0.35, c);
    ctx.beginPath();
    ctx.ellipse(x, y, rr, 26 * g, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y, rr * 0.4, 10 * g, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function pillar(ctx: Ctx, x: number, t: number, side: number) {
  const g = ctx.createLinearGradient(x - 50, 0, x + 50, 0);
  g.addColorStop(0, "#e7dac0");
  g.addColorStop(0.5, "#fffaf0");
  g.addColorStop(1, "#d9c8a6");
  ctx.fillStyle = g;
  ctx.fillRect(x - 50, 860, 100, 420);
  ctx.fillStyle = goldGradient(ctx, x - 58, 0, x + 58, 0);
  ctx.fillRect(x - 58, 850, 116, 16);
  // lantern with a flickering flame
  const flicker = 0.8 + 0.2 * noise(t * 4, side + 3);
  const glow = ctx.createRadialGradient(x, 790, 4, x, 790, 120);
  glow.addColorStop(0, `rgba(255,214,128,${0.65 * flicker})`);
  glow.addColorStop(1, "rgba(255,214,128,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - 120, 670, 240, 240);
  ctx.strokeStyle = GOLD_DEEP;
  ctx.lineWidth = 3;
  ctx.fillStyle = `rgba(255,236,180,${0.85 * flicker})`;
  ctx.beginPath();
  ctx.moveTo(x - 22, 760);
  ctx.lineTo(x + 22, 760);
  ctx.lineTo(x + 16, 830);
  ctx.lineTo(x - 16, 830);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(x - 28, 760);
  ctx.lineTo(x, 735);
  ctx.lineTo(x + 28, 760);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - 20, 830, 40, 10);
}

function curtains(ctx: Ctx, open: number) {
  for (const side of [-1, 1]) {
    const edge = W / 2 + side * (40 + open * 300); // inner edge slides outward
    const outer = side === -1 ? -40 : W + 40;
    const folds = 9;
    for (let i = 0; i < folds; i++) {
      const k0 = i / folds, k1 = (i + 1) / folds;
      const x0 = outer + (edge - outer) * k0, x1 = outer + (edge - outer) * k1;
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, "#efe4d0");
      g.addColorStop(0.5, "#fffbf3");
      g.addColorStop(1, "#e2d3b8");
      ctx.fillStyle = g;
      ctx.beginPath();
      // the drape gathers toward the bottom like tied-back fabric
      const gather = (k: number) => outer + (x0 - outer + (x1 - x0) * k) * (1 - 0.35 * open);
      ctx.moveTo(x0, -20);
      ctx.lineTo(x1, -20);
      ctx.quadraticCurveTo(x1, 700, gather(1), 1300);
      ctx.lineTo(gather(0), 1300);
      ctx.quadraticCurveTo(x0, 700, x0, -20);
      ctx.fill();
    }
  }
}

// ------------------------------------------------------------ roses

function rose(ctx: Ctx, x: number, y: number, size: number, color: string, open: number, rot: number) {
  if (open <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(open, open);
  ctx.shadowColor = "rgba(120,90,40,0.18)";
  ctx.shadowBlur = size * 0.25;
  ctx.shadowOffsetY = size * 0.08;
  for (let layer = 3; layer >= 0; layer--) {
    const petals = 5 + layer;
    const rr = size * (0.25 + layer * 0.2);
    for (let p = 0; p < petals; p++) {
      const a = (p / petals) * Math.PI * 2 + layer * 0.6;
      ctx.fillStyle = mix(color, layer === 0 ? GOLD_LIGHT : "#ffffff", layer === 0 ? 0.35 : 0.08 * layer);
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * rr * 0.55, Math.sin(a) * rr * 0.55, rr * 0.55, rr * 0.42, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowColor = "transparent";
  }
  ctx.strokeStyle = rgba(GOLD_DEEP, 0.35);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.18, 0.4, Math.PI * 1.7);
  ctx.stroke();
  ctx.restore();
}

function leaf(ctx: Ctx, x: number, y: number, len: number, a: number, k: number) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.scale(k, k);
  ctx.fillStyle = "#a9b48f";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.25, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.25, 0, 0);
  ctx.fill();
  ctx.restore();
}

function roseFrame(ctx: Ctx, t: number, key: string, tint: string, calm: boolean) {
  const r = rng(hash(key + "roses"));
  const colors = [IVORY, CREAM, "#f6dfc6", mix(tint, "#ffffff", 0.6), "#ffffff"];
  const clusters: [number, number, number][] = [
    [40, 60, 1.1], [W - 40, 60, 1.1], [W / 2, 0, 0.9], // top
    [60, H - 70, 1.3], [W - 60, H - 70, 1.3], [W / 2, H - 20, 1], [200, H - 10, 0.9], [W - 200, H - 10, 0.9], // bottom
  ];
  clusters.forEach(([cx, cy, sc], ci) => {
    const start = 4.4 + ci * 0.12;
    for (let j = 0; j < 7; j++) {
      const a = r() * Math.PI * 2, d = r() * 90 * sc;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.7;
      leaf(ctx, x, y, 50 * sc, a + 0.4, easeOutCubic(progress(t, start + 0.1, 1.2)));
    }
    for (let j = 0; j < 6; j++) {
      const a = r() * Math.PI * 2, d = r() * 70 * sc;
      const x = cx + Math.cos(a) * d + wind(t, cx, ci) * 3, y = cy + Math.sin(a) * d * 0.7;
      const open = easeOutBack(progress(t, start + j * 0.08, calm ? 1.6 : 1.1));
      rose(ctx, x, y, (34 + r() * 22) * sc, colors[Math.floor(r() * colors.length)], open, r() * Math.PI);
    }
  });
}

// ------------------------------------------------------------ names and details

function shimmerText(ctx: Ctx, text: string, x: number, y: number, size: number, font: string, t: number, alpha: number) {
  ctx.save();
  ctx.font = `${size}px ${font}`;
  ctx.globalAlpha = alpha;
  const w = Math.max(80, ctx.measureText(text).width);
  const shine = ((t * 0.35) % 1.4) - 0.2; // a highlight sweeping across the gold
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, GOLD_DEEP);
  g.addColorStop(clamp01(shine - 0.12), GOLD);
  g.addColorStop(clamp01(shine), "#fff1c4");
  g.addColorStop(clamp01(shine + 0.12), GOLD);
  g.addColorStop(1, GOLD_DEEP);
  ctx.fillStyle = g;
  ctx.shadowColor = "rgba(138,100,36,0.25)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function fitSize(ctx: Ctx, text: string, font: string, start: number, maxWidth: number) {
  let size = start;
  for (; size > 34; size -= 4) {
    ctx.font = `${size}px ${font}`;
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  return size;
}

function names(ctx: Ctx, t: number, tx: ClipText, fonts: ClipFonts) {
  const ar = tx.lang === "ar";
  const script = ar ? fonts.scriptAr ?? fonts.displayAr : fonts.script ?? fonts.display;
  const body = ar ? fonts.bodyAr : fonts.body;
  const n = tx.names ?? { a: tx.title, b: "", line: tx.label };
  ctx.save();
  ctx.textAlign = "center";
  ctx.direction = ar ? "rtl" : "ltr";

  // soft ivory glow behind the text
  const v = progress(t, 5.2, 1.4);
  if (v > 0) {
    const g = ctx.createRadialGradient(W / 2, 600, 40, W / 2, 600, 420);
    g.addColorStop(0, rgba(IVORY, 0.92 * v));
    g.addColorStop(0.7, rgba(IVORY, 0.6 * v));
    g.addColorStop(1, rgba(IVORY, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  const reveal = (start: number) => easeOutCubic(progress(t, start, 1.1));
  const line = n.line || tx.label;
  let p = reveal(5.8);
  if (p > 0) {
    ctx.font = `500 ${ar ? 30 : 24}px ${body}`;
    ctx.fillStyle = rgba(GOLD_DEEP, p);
    ctx.fillText(line, W / 2, 400 - (1 - p) * 12);
  }
  const maxW = 600;
  if (n.b) {
    const sA = fitSize(ctx, n.a, script, ar ? 132 : 108, maxW);
    const sB = fitSize(ctx, n.b, script, ar ? 132 : 108, maxW);
    p = reveal(6.4);
    if (p > 0) shimmerText(ctx, n.a, W / 2, 520 - (1 - p) * 16, sA, script, t, p);
    p = reveal(7.0);
    if (p > 0) shimmerText(ctx, ar ? "و" : "&", W / 2, 600 - (1 - p) * 10, ar ? 72 : 64, script, t, p);
    p = reveal(7.5);
    if (p > 0) shimmerText(ctx, n.b, W / 2, 700 - (1 - p) * 16, sB, script, t, p);
  } else {
    const s = fitSize(ctx, n.a, script, ar ? 132 : 112, maxW);
    p = reveal(6.6);
    if (p > 0) shimmerText(ctx, n.a, W / 2, 590 - (1 - p) * 16, s, script, t, p);
  }

  // ornament and details
  const o = easeInOut(progress(t, 8.2, 1));
  if (o > 0) {
    ctx.strokeStyle = rgba(GOLD, 0.8);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 140 * o, 760);
    ctx.lineTo(W / 2 - 12, 760);
    ctx.moveTo(W / 2 + 12, 760);
    ctx.lineTo(W / 2 + 140 * o, 760);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(W / 2, 752);
    ctx.lineTo(W / 2 + 7, 760);
    ctx.lineTo(W / 2, 768);
    ctx.lineTo(W / 2 - 7, 760);
    ctx.closePath();
    ctx.fill();
  }
  const details: [string, number, number, string][] = [
    [tx.date, 8.4, ar ? 30 : 28, "#4a3a22"],
    [tx.hijri, 8.7, ar ? 24 : 22, "#7a6444"],
    [tx.venue, 9.0, ar ? 28 : 26, "#4a3a22"],
    [tx.cta, 9.3, ar ? 28 : 24, GOLD_DEEP],
  ];
  let y = 812;
  for (const [text, start, size, color] of details) {
    if (!text) continue;
    const q = reveal(start);
    if (q > 0) {
      ctx.font = `${text === tx.cta ? (ar ? "600" : "italic 500") : "500"} ${size}px ${text === tx.cta && !ar ? fonts.display : body}`;
      ctx.fillStyle = rgba(color, q);
      ctx.fillText(text, W / 2, y - (1 - q) * 10);
    }
    y += size * 1.45 + (text === tx.hijri ? 14 : 4);
  }
  ctx.restore();
}

// ------------------------------------------------------------ entry

export function drawRoyal(ctx: Ctx, t: number, occ: OccasionType, tx: ClipText, fonts: ClipFonts) {
  const key = `royal:${occ}`;
  const calm = occ === "condolence";
  const tint = (CLIP_THEMES[occ] ?? CLIP_THEMES.other).collage.accent;
  const open = easeInOut(progress(t, 0.9, 2.4));

  // The camera pushes through the opening gate and keeps gliding up the hall.
  const push = easeInOut(progress(t, 1.4, 2.6));
  const zoom = 1 + push * 0.32 + 0.05 * progress(t, 4, 8);
  ctx.save();
  ctx.translate(W / 2, 700);
  ctx.scale(zoom, zoom);
  ctx.translate(-W / 2, -700 - push * 40);
  hall(ctx, t, key);
  ctx.restore();

  // falling petals throughout
  if (!calm) {
    const r = rng(hash(key + "petals"));
    for (let i = 0; i < 28; i++) {
      const x0 = r() * W, sp = 40 + r() * 50, ph = r() * 9, s = 5 + r() * 6;
      const y = ((r() * H + t * sp) % (H + 60)) - 30;
      const x = x0 + Math.sin(t * 0.9 + ph) * 30;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 1.5 + ph);
      ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + ph)));
      ctx.fillStyle = rgba(i % 3 ? "#ffffff" : GOLD_LIGHT, 0.85 * progress(t, 0.5, 1.5));
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Gate, pillars and curtains, fading away as we pass through.
  const gateFade = 1 - progress(t, 3.0, 1.2);
  if (gateFade > 0) {
    ctx.save();
    ctx.globalAlpha = gateFade;
    const gz = 1 + push * 0.6;
    ctx.translate(W / 2, 900);
    ctx.scale(gz, gz);
    ctx.translate(-W / 2, -900);
    pillar(ctx, 40, t, -1);
    pillar(ctx, W - 40, t, 1);
    gateDoor(ctx, 60, 1, open);
    gateDoor(ctx, W - 60, -1, open);
    // the crest over the gate, lifting away as it opens
    ctx.save();
    ctx.globalAlpha = gateFade * (1 - open);
    ctx.fillStyle = goldGradient(ctx, W / 2 - 40, 0, W / 2 + 40, 0, 0.5);
    ctx.beginPath();
    ctx.moveTo(W / 2, 520);
    ctx.bezierCurveTo(W / 2 + 50, 540, W / 2 + 40, 590, W / 2, 600);
    ctx.bezierCurveTo(W / 2 - 40, 590, W / 2 - 50, 540, W / 2, 520);
    ctx.fill();
    ctx.restore();
    curtains(ctx, open);
    ctx.restore();
  }

  roseFrame(ctx, t, key, tint, calm);

  // a butterfly drifting past the roses
  if (!calm) {
    const on = progress(t, 6, 1);
    if (on > 0) {
      const x = 120 + (t - 6) * 70 + noise(t * 0.6, 3) * 40, y = 980 - (t - 6) * 30 + noise(t * 0.5, 5) * 50;
      const flap = Math.abs(Math.sin(t * 8));
      ctx.save();
      ctx.globalAlpha = on * 0.9;
      ctx.translate(x, y);
      ctx.fillStyle = GOLD_LIGHT;
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.scale(s * (0.25 + 0.75 * flap), 1);
        ctx.beginPath();
        ctx.ellipse(11, -6, 13, 10, -0.4, 0, Math.PI * 2);
        ctx.ellipse(9, 8, 9, 7, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  names(ctx, t, tx, fonts);
  return { ground: IVORY };
}
