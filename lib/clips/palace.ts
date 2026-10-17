import type { OccasionType } from "../occasions";
import type { ClipFonts, ClipText } from "./engine";
import { CLIP_THEMES } from "./themes";
import { CREAM, drawNames, GOLD, GOLD_DEEP, GOLD_LIGHT, goldGradient, IVORY, leaf, pillar, rose, roseFrame } from "./royal";
import { easeInOut, easeOutCubic, hash, mix, noise, progress, rgba, rng, wind } from "./util";

// "Grand palace": a longer, cinematic invitation in four stages.
//   0–4s    a tall ivory-and-gold gate, framed by drapes, lanterns and roses, opens
//   2–7s    beyond it, a fairy-tale castle at the end of a garden path; we glide toward it
//   7–11s   gilded double doors under a crest swing open
//   9–18s   a hall with a flaring grand staircase, garlands and chandeliers; the names appear
// Original artwork, drawn in code.

type Ctx = CanvasRenderingContext2D;
const W = 720;
const H = 1280;
export const PALACE_DURATION = 18;

const easeIn = (x: number) => x * x * x;

function zoomAt(ctx: Ctx, cx: number, cy: number, z: number, tx = cx, ty = cy) {
  ctx.translate(tx, ty);
  ctx.scale(z, z);
  ctx.translate(-cx, -cy);
}

// ------------------------------------------------------------ shared pieces

function chandelier(ctx: Ctx, x: number, top: number, len: number, s: number, t: number, seed: string) {
  const r = rng(hash(seed));
  ctx.save();
  ctx.translate(x, top);
  ctx.rotate(Math.sin(t * 0.6 + x) * 0.015);
  ctx.strokeStyle = rgba(GOLD, 0.9);
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, len);
  ctx.stroke();
  ctx.translate(0, len);
  // light halo
  const halo = ctx.createRadialGradient(0, 40 * s, 5, 0, 40 * s, 200 * s);
  halo.addColorStop(0, "rgba(255,246,214,0.75)");
  halo.addColorStop(1, "rgba(255,246,214,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(-200 * s, -160 * s, 400 * s, 400 * s);
  // tiers of crystal drops, widest at the bottom
  for (let tier = 0; tier < 4; tier++) {
    const rx = (36 + tier * 26) * s, ry = rx * 0.22, cy = tier * 26 * s;
    ctx.strokeStyle = goldGradient(ctx, -rx, 0, rx, 0);
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.ellipse(0, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    const n = 10 + tier * 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const px = Math.cos(a) * rx, py = cy + Math.sin(a) * ry;
      const dl = (14 + tier * 4 + r() * 8) * s;
      const sp = 0.5 + 0.5 * Math.max(0, Math.sin(t * 2.6 + r() * 12));
      ctx.strokeStyle = `rgba(255,255,255,${0.35 + 0.4 * sp})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py + dl);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * sp})`;
      ctx.beginPath();
      ctx.moveTo(px, py + dl - 2 * s);
      ctx.lineTo(px + 2.6 * s, py + dl + 5 * s);
      ctx.lineTo(px, py + dl + 10 * s);
      ctx.lineTo(px - 2.6 * s, py + dl + 5 * s);
      ctx.closePath();
      ctx.fill();
      if (sp > 0.93) {
        ctx.fillStyle = "rgba(255,250,225,0.9)";
        ctx.fillRect(px - 7 * s, py + dl + 4.4 * s, 14 * s, 1.2);
        ctx.fillRect(px - 0.6, py + dl - 2 * s, 1.2, 13 * s);
      }
    }
  }
  // candle arms on the top tier
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const px = Math.cos(a) * 52 * s, py = Math.sin(a) * 11 * s - 14 * s;
    const f = 0.8 + 0.2 * Math.sin(t * 9 + i * 1.7);
    ctx.fillStyle = `rgba(255,226,150,${0.9 * f})`;
    ctx.beginPath();
    ctx.ellipse(px, py - 6 * s, 2.4 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = goldGradient(ctx, -8 * s, 0, 8 * s, 0);
  ctx.beginPath();
  ctx.ellipse(0, 112 * s, 8 * s, 14 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function flowerCluster(ctx: Ctx, x: number, y: number, size: number, r: () => number, tint: string, open = 1, count = 7) {
  const colors = [IVORY, CREAM, "#f6dfc6", "#ffffff", mix(tint, "#ffffff", 0.65)];
  for (let j = 0; j < count; j++) {
    const a = r() * Math.PI * 2, d = r() * size;
    leaf(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, size * 0.55, a + 0.5, open);
  }
  for (let j = 0; j < count; j++) {
    const a = r() * Math.PI * 2, d = r() * size * 0.8;
    rose(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, size * (0.35 + r() * 0.25), colors[Math.floor(r() * colors.length)], open, r() * Math.PI);
  }
}

function drape(ctx: Ctx, side: -1 | 1, reach: number, t: number) {
  ctx.save();
  if (side === 1) {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  const sway = Math.sin(t * 0.8) * 6;
  for (let i = 0; i < 4; i++) {
    const g = ctx.createLinearGradient(0, 0, reach, 0);
    g.addColorStop(0, "rgba(255,252,244,0.95)");
    g.addColorStop(1, "rgba(250,242,226,0.55)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(reach - i * 40, -10);
    ctx.quadraticCurveTo(reach * 0.35 - i * 10 + sway, 260 + i * 60, 40 - i * 8, 760 + i * 70);
    ctx.lineTo(-10, 820 + i * 70);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(214,196,160,0.35)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------ stage 1: the gate

function gateLeaf(ctx: Ctx, hinge: number, dir: 1 | -1, open: number) {
  const width = 340;
  const ang = open * 1.35;
  const c = Math.cos(ang), s = Math.sin(ang);
  const bars = 14;
  const X = (u: number) => hinge + dir * u * width * c;
  const grow = (u: number) => 1 + 0.25 * s * u; // the swinging edge nears the viewer
  const Y = (u: number, y: number) => 1190 - (1190 - y) * grow(u);
  const topY = (u: number) => 170 - Math.sin(u * Math.PI * 0.5) * 70;
  ctx.save();
  // tall ivory bars
  for (let i = 0; i <= bars; i++) {
    const u = i / bars, x = X(u), bw = 15 * Math.max(0.25, c) + 2;
    const g = ctx.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0);
    g.addColorStop(0, "#e6d9bf");
    g.addColorStop(0.5, "#fffcf4");
    g.addColorStop(1, "#d8c7a4");
    ctx.fillStyle = g;
    const yt = Y(u, topY(u));
    ctx.fillRect(x - bw / 2, yt, bw, 1190 - yt);
    // gilded spear tip
    ctx.fillStyle = goldGradient(ctx, x - 8, 0, x + 8, 0);
    ctx.beginPath();
    ctx.moveTo(x, yt - 26 * grow(u));
    ctx.quadraticCurveTo(x + 9, yt - 8, x + 4, yt + 2);
    ctx.lineTo(x - 4, yt + 2);
    ctx.quadraticCurveTo(x - 9, yt - 8, x, yt - 26 * grow(u));
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, yt + 8, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // gold rails
  ctx.lineCap = "round";
  for (const y of [330, 1170]) {
    ctx.strokeStyle = goldGradient(ctx, X(0), 0, X(1), 0, 0.4);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0, y));
    ctx.lineTo(X(1), Y(1, y));
    ctx.stroke();
  }
  // the lower ornamental panel: a gold rail rising to the centre, with scrolls
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const u = i / 24, y = Y(u, 880 - Math.sin(u * Math.PI * 0.5) * 70);
    if (i === 0) ctx.moveTo(X(u), y);
    else ctx.lineTo(X(u), y);
  }
  ctx.stroke();
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const u = (i + 0.5) / 6, x = X(u), g = grow(u), rx = 24 * g * Math.max(0.3, c);
    for (const y of [985, 1085]) {
      ctx.beginPath();
      ctx.ellipse(x, Y(u, y), rx, 34 * g, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x, Y(u, y), rx * 0.45, 14 * g, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // a gold medallion where the two leaves meet
  const mx = X(1), my = Y(1, 790);
  ctx.fillStyle = goldGradient(ctx, mx - 30, 0, mx + 30, 0, 0.5);
  ctx.beginPath();
  ctx.ellipse(mx - dir * 4, my, 22 * Math.max(0.3, c) * grow(1), 30 * grow(1), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function gateStage(ctx: Ctx, t: number, key: string, tint: string) {
  const open = easeInOut(progress(t, 1.2, 2.6));
  const z = 1 + easeIn(progress(t, 2.4, 2.0)) * 1.8;
  const alpha = 1 - progress(t, 3.3, 1.0);
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  zoomAt(ctx, W / 2, 720, z);
  // a soft light spills through the opening
  const glow = ctx.createRadialGradient(W / 2, 700, 10, W / 2, 700, 300 + open * 300);
  glow.addColorStop(0, `rgba(255,248,226,${0.6 * open})`);
  glow.addColorStop(1, "rgba(255,248,226,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  gateLeaf(ctx, 22, 1, open);
  gateLeaf(ctx, W - 22, -1, open);
  pillar(ctx, 28, t, -1);
  pillar(ctx, W - 28, t, 1);
  drape(ctx, -1, 300, t);
  drape(ctx, 1, 300, t);
  const r = rng(hash(key + "gateflowers"));
  for (const [x, y, s] of [[60, 70, 120], [W - 60, 70, 120], [190, 20, 80], [W - 190, 20, 80], [60, 1230, 130], [W - 60, 1230, 130], [230, 1260, 110], [W - 230, 1260, 110], [W / 2, 1275, 100]] as const)
    flowerCluster(ctx, x, y, s, r, tint);
  ctx.restore();
}

// ------------------------------------------------------------ stage 2: the castle

function tower(ctx: Ctx, x: number, top: number, base: number, w: number, roofH: number, haze: number) {
  const tone = (c: string) => mix(c, "#f4ead2", haze);
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, tone("#efe4cc"));
  g.addColorStop(0.45, tone("#fffbf2"));
  g.addColorStop(1, tone("#d9c7a2"));
  ctx.fillStyle = g;
  ctx.fillRect(x - w / 2, top, w, base - top);
  // gold band and corbels under the roof
  ctx.fillStyle = tone(GOLD_LIGHT);
  ctx.fillRect(x - w / 2 - 4, top, w + 8, Math.max(3, w * 0.08));
  // conical roof with a gentle concave curve
  const rg = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  rg.addColorStop(0, tone("#ecd9a8"));
  rg.addColorStop(0.45, tone("#fff6dc"));
  rg.addColorStop(1, tone("#c9a35a"));
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - w * 0.12, top + 1);
  ctx.quadraticCurveTo(x - w * 0.1, top - roofH * 0.35, x, top - roofH);
  ctx.quadraticCurveTo(x + w * 0.1, top - roofH * 0.35, x + w / 2 + w * 0.12, top + 1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = tone(GOLD);
  ctx.lineWidth = Math.max(1, w * 0.03);
  ctx.beginPath();
  ctx.moveTo(x, top - roofH);
  ctx.lineTo(x, top - roofH - roofH * 0.18);
  ctx.stroke();
  ctx.fillStyle = tone(GOLD_LIGHT);
  ctx.beginPath();
  ctx.arc(x, top - roofH * 1.05, Math.max(1.5, w * 0.05), 0, Math.PI * 2);
  ctx.fill();
  // arched windows
  const rows = Math.max(1, Math.floor((base - top) / (w * 1.6)));
  for (let i = 0; i < rows; i++) {
    const wy = top + w * 0.5 + i * w * 1.6, ww = w * 0.22, wh = w * 0.55;
    if (wy + wh > base - 4) break;
    ctx.fillStyle = tone("#c9a35a");
    ctx.beginPath();
    ctx.moveTo(x - ww, wy + wh);
    ctx.lineTo(x - ww, wy + ww);
    ctx.arc(x, wy + ww, ww, Math.PI, 0);
    ctx.lineTo(x + ww, wy + wh);
    ctx.closePath();
    ctx.fill();
  }
}

function tree(ctx: Ctx, x: number, y: number, size: number, flip: number, r: () => number, t: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip, 1);
  ctx.strokeStyle = "#8a7a58";
  ctx.lineWidth = size * 0.06;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.2);
  ctx.quadraticCurveTo(size * 0.3, size * 0.1, size * 0.9, size * 0.35);
  ctx.moveTo(size * 0.3, size * 0.05);
  ctx.quadraticCurveTo(size * 0.5, size * 0.4, size * 0.7, size * 0.75);
  ctx.stroke();
  const greens = ["#b6b48a", "#a3a476", "#c9c6a0", "#8f9466", "#d6d1ad"];
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * size;
    const lx = Math.cos(a) * d * 1.1 + size * 0.35, ly = Math.sin(a) * d * 0.6 + size * 0.2;
    const sway = wind(t, lx, i) * 4;
    ctx.fillStyle = greens[i % greens.length];
    ctx.beginPath();
    ctx.ellipse(lx + sway, ly, size * (0.07 + r() * 0.06), size * (0.05 + r() * 0.04), r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function castleStage(ctx: Ctx, t: number, key: string, tint: string) {
  if (t > 7.6) return;
  const push = easeIn(progress(t, 2.6, 4.6));
  const z = 1 + push * 2.6;
  const r = rng(hash(key + "castle"));
  ctx.save();
  zoomAt(ctx, W / 2, 742, z, W / 2, 742 - push * 80);
  // sky with soft clouds and sun behind the castle
  const sky = ctx.createLinearGradient(0, -200, 0, 760);
  sky.addColorStop(0, "#e9dcbc");
  sky.addColorStop(1, "#fbf3df");
  ctx.fillStyle = sky;
  ctx.fillRect(-200, -400, W + 400, 1200);
  const sun = ctx.createRadialGradient(W / 2, 520, 10, W / 2, 520, 420);
  sun.addColorStop(0, "rgba(255,252,236,1)");
  sun.addColorStop(1, "rgba(255,252,236,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(-200, 100, W + 400, 900);
  for (let i = 0; i < 9; i++) {
    const cx = ((r() * (W + 400) + t * 8 * (0.5 + r())) % (W + 400)) - 200, cy = 120 + r() * 380, s = 60 + r() * 80;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.ellipse(cx + (k - 1.5) * s * 0.5, cy + Math.sin(k * 2) * s * 0.1, s * 0.5, s * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // far hills in haze
  ctx.fillStyle = "rgba(214,206,172,0.55)";
  ctx.beginPath();
  ctx.moveTo(-200, 760);
  for (let x = -200; x <= W + 200; x += 40) ctx.lineTo(x, 700 + Math.sin(x * 0.012) * 18 + noise(x * 0.01, 4) * 20);
  ctx.lineTo(W + 200, 780);
  ctx.closePath();
  ctx.fill();

  // the castle: a back rank of hazy towers, then the front rank around the main hall
  const cx = W / 2;
  for (const [dx, top, w, roof] of [[60, 380, 40, 170], [150, 450, 38, 140], [235, 520, 34, 110], [300, 580, 30, 90]] as const)
    for (const s of [-1, 1]) tower(ctx, cx + s * dx, top, 740, w, roof, 0.45);
  for (const [dx, top, w, roof] of [[300, 620, 36, 80], [245, 580, 44, 100], [170, 520, 52, 130], [100, 470, 50, 150]] as const)
    for (const s of [-1, 1]) tower(ctx, cx + s * dx, top, 760, w, roof, 0.1);
  // main hall with a gabled front and the golden door
  const hall = ctx.createLinearGradient(cx - 130, 0, cx + 130, 0);
  hall.addColorStop(0, "#efe4cc");
  hall.addColorStop(0.5, "#fffbf2");
  hall.addColorStop(1, "#ddcca9");
  ctx.fillStyle = hall;
  ctx.fillRect(cx - 130, 600, 260, 160);
  ctx.beginPath();
  ctx.moveTo(cx - 140, 604);
  ctx.lineTo(cx, 520);
  ctx.lineTo(cx + 140, 604);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const wx = cx - 105 + i * 42;
    if (Math.abs(wx - cx + 0) < 30) continue;
    ctx.fillStyle = "#cfa95f";
    ctx.beginPath();
    ctx.moveTo(wx - 7, 700);
    ctx.lineTo(wx - 7, 640);
    ctx.arc(wx, 640, 7, Math.PI, 0);
    ctx.lineTo(wx + 7, 700);
    ctx.fill();
  }
  // the central spire rises above everything
  tower(ctx, cx, 420, 600, 64, 250, 0);
  const door = ctx.createLinearGradient(0, 690, 0, 760);
  door.addColorStop(0, "#f1cf7c");
  door.addColorStop(1, "#b07c2c");
  ctx.fillStyle = door;
  ctx.beginPath();
  ctx.moveTo(cx - 22, 760);
  ctx.lineTo(cx - 22, 708);
  ctx.arc(cx, 708, 22, Math.PI, 0);
  ctx.lineTo(cx + 22, 760);
  ctx.closePath();
  ctx.fill();
  const dg = ctx.createRadialGradient(cx, 730, 2, cx, 730, 60);
  dg.addColorStop(0, "rgba(255,236,170,0.6)");
  dg.addColorStop(1, "rgba(255,236,170,0)");
  ctx.fillStyle = dg;
  ctx.fillRect(cx - 60, 670, 120, 120);

  // the garden: lawns, a pale path to the door, hedges and flowering shrubs
  const lawn = ctx.createLinearGradient(0, 740, 0, 1300);
  lawn.addColorStop(0, "#e2dcb8");
  lawn.addColorStop(1, "#cfc79a");
  ctx.fillStyle = lawn;
  ctx.fillRect(-200, 756, W + 400, 700);
  const path = ctx.createLinearGradient(0, 760, 0, 1300);
  path.addColorStop(0, "#fbf3e0");
  path.addColorStop(1, "#efe2c4");
  ctx.fillStyle = path;
  ctx.beginPath();
  ctx.moveTo(cx - 26, 760);
  ctx.lineTo(cx + 26, 760);
  ctx.lineTo(cx + 230, 1300);
  ctx.lineTo(cx - 230, 1300);
  ctx.closePath();
  ctx.fill();
  // flowering hedges lining the path, wider as they come toward us
  const fl = [IVORY, "#ffffff", "#f3dfc4", mix(tint, "#ffffff", 0.6)];
  const hr = rng(hash(key + "hedge"));
  for (const side of [-1, 1]) {
    const edge = (k: number) => cx + side * (30 + k * 210);
    const yk = (k: number) => 762 + k * 540;
    const hw = (k: number) => 6 + k * 80;
    const hh = (k: number) => 4 + k * 46;
    const g = ctx.createLinearGradient(0, 760, 0, 1300);
    g.addColorStop(0, "#b4b588");
    g.addColorStop(1, "#8d9364");
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) ctx.lineTo(edge(i / 30), yk(i / 30) - hh(i / 30));
    for (let i = 30; i >= 0; i--) ctx.lineTo(edge(i / 30) + side * hw(i / 30), yk(i / 30));
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 70; i++) {
      const k = Math.pow(hr(), 0.7), x = edge(k) + side * hw(k) * hr() * 0.9, y = yk(k) - hh(k) * (0.6 + hr() * 0.5);
      ctx.fillStyle = fl[i % fl.length];
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + k * 13 * (0.6 + hr() * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // cone-shaped topiaries further out
  for (let i = 0; i < 7; i++) {
    const k = i / 6, y = 790 + k * k * 420, s = 10 + k * 60;
    for (const side of [-1, 1]) {
      const x = cx + side * (120 + k * 360);
      ctx.fillStyle = mix("#9fa271", "#7f8659", k);
      ctx.beginPath();
      ctx.moveTo(x - s * 0.45, y);
      ctx.quadraticCurveTo(x, y - s * 2.6, x + s * 0.45, y);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();

  // Trees at the top and flowers at the bottom are closer to us, so they slide away faster.
  ctx.save();
  zoomAt(ctx, W / 2, 640, 1 + push * 4.5);
  const tr = rng(hash(key + "trees"));
  tree(ctx, -40, 80, 260, 1, tr, t);
  tree(ctx, W + 40, 80, 260, -1, tr, t);
  ctx.restore();
  ctx.save();
  zoomAt(ctx, W / 2, 640, 1 + push * 4.5);
  const fr = rng(hash(key + "front"));
  for (const [x, y, s] of [[40, 1240, 120], [W - 40, 1240, 120], [180, 1290, 90], [W - 180, 1290, 90]] as const) flowerCluster(ctx, x, y, s, fr, tint);
  ctx.restore();
}

// ------------------------------------------------------------ stage 3: the golden doors

function doorway(ctx: Ctx, grow = 0) {
  ctx.moveTo(200 - grow, 1000);
  ctx.lineTo(200 - grow, 480);
  ctx.arc(360, 480, 160 + grow, Math.PI, 0);
  ctx.lineTo(520 + grow, 1000);
  ctx.closePath();
}

const archTop = (x: number) => 480 - Math.sqrt(Math.max(0, 160 * 160 - (x - 360) * (x - 360)));

function doorLeaf(ctx: Ctx, hinge: number, dir: 1 | -1, open: number) {
  const ang = open * 1.4, c = Math.cos(ang), s = Math.sin(ang);
  if (c < 0.02) return;
  const X = (u: number) => hinge + dir * u * 160 * c;
  const grow = (u: number) => 1 + 0.18 * s * u;
  const Y = (u: number, y: number) => 1000 - (1000 - y) * grow(u);
  const closedX = (u: number) => hinge + dir * u * 160;
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(X(0), 1000);
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      ctx.lineTo(X(u), Y(u, archTop(closedX(u))));
    }
    ctx.lineTo(X(1), 1000);
    ctx.closePath();
  };
  ctx.save();
  outline();
  ctx.fillStyle = goldGradient(ctx, Math.min(X(0), X(1)), 0, Math.max(X(0), X(1)) + 1, 0, 0.3);
  ctx.fill();
  ctx.clip();
  // amber glass panel (upper) and raised panel (lower), with tracery
  const panel = (u0: number, u1: number, y0: number, y1: number, glass: boolean) => {
    ctx.beginPath();
    ctx.moveTo(X(u0), Y(u0, y1));
    ctx.lineTo(X(u0), Y(u0, y0));
    ctx.lineTo(X(u1), Y(u1, y0));
    ctx.lineTo(X(u1), Y(u1, y1));
    ctx.closePath();
    if (glass) {
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, "#fbe6a6");
      g.addColorStop(1, "#d39b3c");
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.strokeStyle = GOLD_DEEP;
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  panel(0.18, 0.82, 560, 780, true);
  panel(0.18, 0.82, 820, 960, false);
  panel(0.28, 0.72, 850, 930, false);
  ctx.strokeStyle = rgba(GOLD_DEEP, 0.8);
  ctx.lineWidth = 2;
  for (const u of [0.39, 0.61]) {
    ctx.beginPath();
    ctx.moveTo(X(u), Y(u, 560));
    ctx.lineTo(X(u), Y(u, 780));
    ctx.stroke();
  }
  for (const y of [630, 705]) {
    ctx.beginPath();
    ctx.moveTo(X(0.18), Y(0.18, y));
    ctx.lineTo(X(0.82), Y(0.82, y));
    ctx.stroke();
  }
  // handle
  ctx.fillStyle = GOLD_DEEP;
  ctx.beginPath();
  ctx.ellipse(X(0.9), Y(0.9, 800), 5 * Math.max(0.3, c), 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // shade as it swings away from the light
  ctx.fillStyle = `rgba(90,60,20,${0.35 * s})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function crest(ctx: Ctx, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  // scrolled wings
  ctx.strokeStyle = goldGradient(ctx, -120, 0, 120, 0, 0.5);
  ctx.lineWidth = 6;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 40, 10);
    ctx.bezierCurveTo(s * 90, -30, s * 130, 10, s * 110, 50);
    ctx.bezierCurveTo(s * 95, 80, s * 70, 60, s * 80, 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 40, 50);
    ctx.bezierCurveTo(s * 70, 90, s * 110, 100, s * 140, 80);
    ctx.stroke();
  }
  // shield
  ctx.fillStyle = goldGradient(ctx, -50, 0, 50, 0, 0.5);
  ctx.beginPath();
  ctx.moveTo(-46, -20);
  ctx.lineTo(46, -20);
  ctx.lineTo(46, 40);
  ctx.quadraticCurveTo(46, 90, 0, 112);
  ctx.quadraticCurveTo(-46, 90, -46, 40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#7d6a4a";
  ctx.beginPath();
  ctx.moveTo(-32, -8);
  ctx.lineTo(32, -8);
  ctx.lineTo(32, 38);
  ctx.quadraticCurveTo(32, 76, 0, 94);
  ctx.quadraticCurveTo(-32, 76, -32, 38);
  ctx.closePath();
  ctx.fill();
  // an eight-point star on the shield
  ctx.fillStyle = GOLD_LIGHT;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, rr = i % 2 ? 9 : 20;
    ctx.lineTo(Math.cos(a) * rr, 38 + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  // crown
  ctx.fillStyle = goldGradient(ctx, -40, 0, 40, 0, 0.6);
  ctx.beginPath();
  ctx.moveTo(-38, -24);
  ctx.lineTo(-42, -62);
  ctx.lineTo(-20, -42);
  ctx.lineTo(0, -74);
  ctx.lineTo(20, -42);
  ctx.lineTo(42, -62);
  ctx.lineTo(38, -24);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function doorStage(ctx: Ctx, t: number) {
  if (t < 6.6) return;
  const alpha = 1 - progress(t, 10.3, 0.6);
  if (alpha <= 0) return;
  const open = easeInOut(progress(t, 8.2, 1.8));
  const z = 1.08 - 0.08 * easeOutCubic(progress(t, 6.8, 1.6)) + easeIn(progress(t, 8.7, 2.1)) * 2.8;
  ctx.save();
  ctx.globalAlpha = alpha;
  zoomAt(ctx, W / 2, 720, z);
  // the wall, with the doorway cut out so the hall shows through
  const wall = ctx.createLinearGradient(0, 0, 0, 1000);
  wall.addColorStop(0, "#f3e8d2");
  wall.addColorStop(1, "#fbf5e8");
  ctx.fillStyle = wall;
  ctx.beginPath();
  ctx.rect(-400, -400, W + 800, H + 800);
  doorway(ctx);
  ctx.fill("evenodd");
  // pilasters
  for (const x of [95, W - 95]) {
    const g = ctx.createLinearGradient(x - 28, 0, x + 28, 0);
    g.addColorStop(0, "#e9dcc0");
    g.addColorStop(0.5, "#fffbf2");
    g.addColorStop(1, "#dac9a6");
    ctx.fillStyle = g;
    ctx.fillRect(x - 28, 240, 56, 760);
    ctx.fillStyle = goldGradient(ctx, x - 38, 0, x + 38, 0, 0.4);
    ctx.fillRect(x - 38, 226, 76, 22);
    ctx.fillRect(x - 36, 980, 72, 22);
    ctx.strokeStyle = rgba(GOLD, 0.5);
    ctx.lineWidth = 2;
    for (const dx of [-12, 0, 12]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, 260);
      ctx.lineTo(x + dx, 970);
      ctx.stroke();
    }
  }
  // the gilded arch frame and keystone
  ctx.strokeStyle = goldGradient(ctx, 160, 0, 560, 0, 0.5);
  ctx.lineWidth = 26;
  ctx.beginPath();
  doorway(ctx, 16);
  ctx.stroke();
  ctx.strokeStyle = GOLD_DEEP;
  ctx.lineWidth = 2;
  ctx.beginPath();
  doorway(ctx, 32);
  ctx.stroke();
  ctx.fillStyle = goldGradient(ctx, 330, 0, 390, 0, 0.5);
  ctx.beginPath();
  ctx.moveTo(338, 284);
  ctx.lineTo(382, 284);
  ctx.lineTo(372, 330);
  ctx.lineTo(348, 330);
  ctx.closePath();
  ctx.fill();
  crest(ctx, W / 2, 168);
  // wall lamps
  for (const [x, side] of [[178, -1], [W - 178, 1]] as const) {
    const f = 0.8 + 0.2 * noise(t * 4, side + 7);
    const glow = ctx.createRadialGradient(x, 560, 3, x, 560, 110);
    glow.addColorStop(0, `rgba(255,220,140,${0.7 * f})`);
    glow.addColorStop(1, "rgba(255,220,140,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 110, 450, 220, 220);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x - 3, 580, 6, 60);
    ctx.fillStyle = `rgba(255,240,196,${0.9 * f})`;
    ctx.beginPath();
    ctx.moveTo(x - 14, 530);
    ctx.lineTo(x + 14, 530);
    ctx.lineTo(x + 10, 580);
    ctx.lineTo(x - 10, 580);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = GOLD_DEEP;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // steps up to the door
  for (let i = 0; i < 7; i++) {
    const y = 1000 + i * 42, half = 190 + i * 34;
    const g = ctx.createLinearGradient(0, y, 0, y + 42);
    g.addColorStop(0, "#fffaf0");
    g.addColorStop(1, "#e8dbc0");
    ctx.fillStyle = g;
    ctx.fillRect(W / 2 - half, y, half * 2, 42);
    ctx.fillStyle = rgba(GOLD, 0.35);
    ctx.fillRect(W / 2 - half, y, half * 2, 2);
  }
  // light pouring out as the doors open
  if (open > 0) {
    const lg = ctx.createRadialGradient(W / 2, 760, 20, W / 2, 760, 420);
    lg.addColorStop(0, `rgba(255,250,232,${0.55 * open})`);
    lg.addColorStop(1, "rgba(255,250,232,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(0, 300, W, 1000);
  }
  doorLeaf(ctx, 200, 1, open);
  doorLeaf(ctx, 520, -1, open);
  ctx.restore();
}

// ------------------------------------------------------------ stage 4: the hall

function hallStage(ctx: Ctx, t: number, key: string, tint: string) {
  if (t < 7.2) return;
  const z = 1.14 - 0.12 * easeOutCubic(progress(t, 9, 3.4)) + 0.04 * progress(t, 12.4, 5.6);
  ctx.save();
  zoomAt(ctx, W / 2, 660, z);
  const wall = ctx.createLinearGradient(0, -100, 0, 1100);
  wall.addColorStop(0, "#efe1c3");
  wall.addColorStop(0.5, "#f9f1df");
  wall.addColorStop(1, "#ecdcbd");
  ctx.fillStyle = wall;
  ctx.fillRect(-100, -100, W + 200, H + 200);
  // vaulted ceiling ribs
  ctx.strokeStyle = rgba(GOLD, 0.35);
  ctx.lineWidth = 3;
  for (const rr of [330, 410, 490]) {
    ctx.beginPath();
    ctx.arc(W / 2, 560, rr, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  }
  // tall glowing windows: a grand centre arch and two side arches
  const arch = (x: number, w: number, top: number, bottom: number, glow: number) => {
    const shape = () => {
      ctx.beginPath();
      ctx.moveTo(x - w / 2, bottom);
      ctx.lineTo(x - w / 2, top + w / 2);
      ctx.arc(x, top + w / 2, w / 2, Math.PI, 0);
      ctx.lineTo(x + w / 2, bottom);
      ctx.closePath();
    };
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, `rgba(255,253,244,${glow})`);
    g.addColorStop(1, `rgba(250,236,204,${glow})`);
    shape();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = goldGradient(ctx, x - w / 2, 0, x + w / 2, 0, 0.4);
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.45);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const k of [-1 / 6, 1 / 6]) {
      ctx.moveTo(x + k * w, top + w / 2);
      ctx.lineTo(x + k * w, bottom);
    }
    for (let y = top + w / 2 + 70; y < bottom; y += 80) {
      ctx.moveTo(x - w / 2, y);
      ctx.lineTo(x + w / 2, y);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, top + w / 2, w * 0.22, 0, Math.PI * 2);
    ctx.stroke();
  };
  arch(W / 2, 200, 150, 560, 1);
  arch(115, 120, 250, 560, 0.8);
  arch(W - 115, 120, 250, 560, 0.8);
  const beam = ctx.createRadialGradient(W / 2, 350, 20, W / 2, 350, 520);
  beam.addColorStop(0, "rgba(255,252,238,0.85)");
  beam.addColorStop(1, "rgba(255,252,238,0)");
  ctx.fillStyle = beam;
  ctx.fillRect(-100, -100, W + 200, 1100);
  // columns
  for (const x of [225, W - 225, 20, W - 20]) {
    const g = ctx.createLinearGradient(x - 18, 0, x + 18, 0);
    g.addColorStop(0, "#e5d7ba");
    g.addColorStop(0.5, "#fffbf3");
    g.addColorStop(1, "#d6c39d");
    ctx.fillStyle = g;
    ctx.fillRect(x - 18, 160, 36, 440);
    ctx.fillStyle = goldGradient(ctx, x - 26, 0, x + 26, 0, 0.4);
    ctx.fillRect(x - 26, 150, 52, 16);
  }
  // the landing and its balustrade
  ctx.fillStyle = "#f6ecd8";
  ctx.fillRect(-100, 596, W + 200, 30);
  ctx.fillStyle = "#fffaf0";
  for (let x = -90; x < W + 100; x += 16) ctx.fillRect(x, 560, 8, 36);
  ctx.fillStyle = goldGradient(ctx, 0, 0, W, 0, 0.5);
  ctx.fillRect(-100, 552, W + 200, 8);
  // lower wall behind the stairs
  ctx.fillStyle = "#efe2c8";
  ctx.fillRect(-100, 626, W + 200, 460);

  // the grand staircase, flaring wide at the foot
  const half = (k: number) => 92 + 170 * Math.pow(k, 1.5) + 150 * Math.pow(Math.max(0, (k - 0.7) / 0.3), 2);
  const yAt = (k: number) => 626 + k * 470;
  const steps = 24;
  for (let i = 0; i < steps; i++) {
    const k0 = i / steps, k1 = (i + 1) / steps;
    const y0 = yAt(k0), y1 = yAt(k1), h0 = half(k0), h1 = half(k1);
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, "#fffcf5");
    g.addColorStop(1, mix("#efe3cb", "#f6eddc", k0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(W / 2 - h0, y0);
    ctx.lineTo(W / 2 + h0, y0);
    ctx.lineTo(W / 2 + h1, y1);
    ctx.lineTo(W / 2 - h1, y1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba("#b39a6c", 0.22);
    ctx.fillRect(W / 2 - h1, y1 - 2, h1 * 2, 2);
  }
  // runner carpet up the middle
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.moveTo(W / 2 - 40, yAt(0));
  ctx.lineTo(W / 2 + 40, yAt(0));
  ctx.lineTo(W / 2 + 90, yAt(1));
  ctx.lineTo(W / 2 - 90, yAt(1));
  ctx.closePath();
  ctx.fill();

  // balustrades wound with flower garlands and lit with candles
  const gr = rng(hash(key + "garland"));
  const colors = [IVORY, "#ffffff", CREAM, "#f4dcc0", mix(tint, "#ffffff", 0.6)];
  for (const s of [-1, 1]) {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const k = i / 40;
      pts.push([W / 2 + s * (half(k) + 14), yAt(k) - 46 + k * 10]);
    }
    // the curl at the foot
    const [ex, ey] = pts[pts.length - 1];
    ctx.fillStyle = "#fffaf0";
    for (const [x, y] of pts) ctx.fillRect(x - 3, y, 6, 40);
    ctx.strokeStyle = "#fdf8ee";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.quadraticCurveTo(ex + s * 40, ey + 20, ex + s * 10, ey + 50);
    ctx.stroke();
    ctx.strokeStyle = goldGradient(ctx, 0, 600, 0, 1100, 0.4);
    ctx.lineWidth = 3;
    ctx.stroke();
    // garland
    for (let i = 0; i < pts.length; i += 1) {
      const [x, y] = pts[i];
      const k = i / 40, sz = 7 + k * 12;
      leaf(ctx, x, y, sz * 1.6, gr() * 6, 1);
      ctx.fillStyle = colors[Math.floor(gr() * colors.length)];
      ctx.beginPath();
      ctx.arc(x + (gr() - 0.5) * sz + wind(t, x, i) * 1.5, y - 4 + (gr() - 0.5) * sz, sz * 0.7, 0, Math.PI * 2);
      ctx.fill();
      if (i % 5 === 2) {
        const f = 0.75 + 0.25 * Math.sin(t * 7 + i + s);
        const cg = ctx.createRadialGradient(x, y - 20, 1, x, y - 20, 26 + k * 20);
        cg.addColorStop(0, `rgba(255,232,160,${0.85 * f})`);
        cg.addColorStop(1, "rgba(255,232,160,0)");
        ctx.fillStyle = cg;
        ctx.fillRect(x - 50, y - 70, 100, 100);
      }
    }
  }
  // marble floor with a gold medallion
  const floor = ctx.createLinearGradient(0, 1096, 0, 1400);
  floor.addColorStop(0, "#f7efe0");
  floor.addColorStop(1, "#e9dcc2");
  ctx.fillStyle = floor;
  ctx.fillRect(-100, 1096, W + 200, 400);
  ctx.strokeStyle = rgba(GOLD, 0.55);
  ctx.lineWidth = 2;
  for (const rx of [320, 250, 170, 80]) {
    ctx.beginPath();
    ctx.ellipse(W / 2, 1200, rx, rx * 0.24, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.moveTo(W / 2 + Math.cos(a) * 80, 1200 + Math.sin(a) * 19);
    ctx.lineTo(W / 2 + Math.cos(a) * 250, 1200 + Math.sin(a) * 60);
  }
  ctx.stroke();
  // chandeliers
  chandelier(ctx, W / 2, -40, 120, 1.15, t, key + "c1");
  chandelier(ctx, 130, -40, 190, 0.62, t, key + "c2");
  chandelier(ctx, W - 130, -40, 190, 0.62, t, key + "c3");
  ctx.restore();
}

// ------------------------------------------------------------ entry

export function drawPalace(ctx: Ctx, t: number, occ: OccasionType, tx: ClipText, fonts: ClipFonts) {
  const key = `palace:${occ}`;
  const calm = occ === "condolence";
  const tint = (CLIP_THEMES[occ] ?? CLIP_THEMES.other).collage.accent;

  // back to front: the hall waits behind the doors, which wait behind the castle's flash
  hallStage(ctx, t, key, tint);
  doorStage(ctx, t);
  castleStage(ctx, t, key, tint);

  // a warm flash carries us from the castle to its doors
  const flash = Math.max(0, 1 - Math.abs(t - 6.9) / 0.55);
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,250,236,${easeInOut(flash)})`;
    ctx.fillRect(0, 0, W, H);
  }
  gateStage(ctx, t, key, tint);

  // the invitation: a hazy veil over the hall, drapes, roses and the names
  const veil = progress(t, 10.4, 1.6);
  if (veil > 0) {
    ctx.fillStyle = rgba(IVORY, 0.32 * veil);
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = veil;
    drape(ctx, -1, 200, t);
    drape(ctx, 1, 200, t);
    ctx.restore();
  }
  if (t > 9.8) roseFrame(ctx, t, key, tint, calm, 10.2);

  // petals and floating sparkles throughout
  const r = rng(hash(key + "petals"));
  for (let i = 0; i < (calm ? 0 : 26); i++) {
    const x0 = r() * W, sp = 36 + r() * 50, ph = r() * 9, s = 5 + r() * 6;
    const y = ((r() * H + t * sp) % (H + 60)) - 30;
    ctx.save();
    ctx.translate(x0 + Math.sin(t * 0.9 + ph) * 30, y);
    ctx.rotate(t * 1.5 + ph);
    ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + ph)));
    ctx.fillStyle = rgba(i % 3 ? "#ffffff" : GOLD_LIGHT, 0.85);
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (let i = 0; i < 22; i++) {
    const x = r() * W, y = r() * H * 0.8, ph = r() * 7;
    const a = Math.max(0, Math.sin(t * 1.3 + ph)) * 0.8;
    if (a < 0.05) continue;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
    g.addColorStop(0, `rgba(255,244,200,${a})`);
    g.addColorStop(1, "rgba(255,244,200,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - 14, y - 14, 28, 28);
  }

  drawNames(ctx, t, tx, fonts, 5.4);
  return { ground: IVORY, gold: GOLD };
}
