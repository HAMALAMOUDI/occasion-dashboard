import type { OccasionType } from "../occasions";
import { CLIP_THEMES, MOODS, OCCASION_MOODS, type MoodPalette } from "./themes";
import { clamp01, easeInOut, easeOutBack, easeOutCubic, hash, mix, noise, progress, rgba, rng, wind } from "./util";

// Four natural scenes for animated invitations — a growing garden, a desert
// under moon or sun, a sea at the horizon, and a palm oasis. Nothing human:
// motion comes from wind noise, swell, parallax and light. Each returns where
// the invitation text should sit and in which colours.

type Ctx = CanvasRenderingContext2D;
export type NatureStyle = "bloom" | "dunes" | "sea" | "oasis";
export const NATURE_STYLES: NatureStyle[] = ["bloom", "dunes", "sea", "oasis"];

export interface SceneLayout {
  centerY: number;
  colors: { ink: string; muted: string; accent: string };
  ground: string; // colour to fade in from
}

const W = 720;
const H = 1280;

// ------------------------------------------------------------ shared pieces

function sky(ctx: Ctx, m: MoodPalette, horizon: number) {
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, m.sky[0]);
  g.addColorStop(0.6, m.sky[1]);
  g.addColorStop(1, m.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(-40, -40, W + 80, horizon + 41);
}

function glowDisk(ctx: Ctx, x: number, y: number, r: number, m: MoodPalette, strength = 1) {
  const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 5);
  g.addColorStop(0, rgba(m.glow, 0.55 * strength));
  g.addColorStop(1, rgba(m.glow, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
  ctx.fillStyle = m.light;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// A true crescent: the lit disc minus an offset circle, with a soft halo.
function crescent(ctx: Ctx, x: number, y: number, r: number, m: MoodPalette) {
  const halo = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 4.5);
  halo.addColorStop(0, rgba(m.glow, 0.35));
  halo.addColorStop(1, rgba(m.glow, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
  const d = r * 0.45, r2 = r * 0.9;
  const xi = (d * d + r * r - r2 * r2) / (2 * d), h = Math.sqrt(r * r - xi * xi);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5);
  ctx.fillStyle = m.light;
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.atan2(h, xi), Math.atan2(-h, xi) + Math.PI * 2, false);
  ctx.arc(d, 0, r2, Math.atan2(-h, xi - d), Math.atan2(h, xi - d), true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const starCache = new Map<string, { x: number; y: number; r: number; p: number; s: number }[]>();
function stars(ctx: Ctx, t: number, key: string, maxY: number, count: number, color: string, alpha: number) {
  let list = starCache.get(key);
  if (!list) {
    const r = rng(hash(key));
    list = Array.from({ length: count }, () => ({ x: r() * W, y: r() * maxY, r: 0.6 + r() * 1.6, p: r() * Math.PI * 2, s: 0.8 + r() * 2.2 }));
    starCache.set(key, list);
  }
  ctx.fillStyle = color;
  for (const st of list) {
    ctx.globalAlpha = alpha * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * st.s + st.p)));
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// A soft wash behind the text so it reads over any scene.
function veil(ctx: Ctx, t: number, cy: number, color: string, strength: number) {
  const v = progress(t, 2.8, 1.5) * strength;
  if (v <= 0) return;
  const g = ctx.createRadialGradient(W / 2, cy, 40, W / 2, cy, 470);
  g.addColorStop(0, rgba(color, v));
  g.addColorStop(0.65, rgba(color, v * 0.55));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Floating motes of pollen, dust or spray drifting on the air.
function motes(ctx: Ctx, t: number, key: string, n: number, color: string, region: [number, number], rise = 18) {
  const r = rng(hash(key + ":motes"));
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, y0 = region[0] + r() * (region[1] - region[0]), s = 1 + r() * 2.6, ph = r() * 9;
    const y = region[0] + ((((y0 - t * rise * (0.5 + r())) - region[0]) % (region[1] - region[0])) + (region[1] - region[0])) % (region[1] - region[0]);
    const x = x0 + noise(t * 0.4 + ph, i) * 40;
    ctx.globalAlpha = (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.7 + ph))) * progress(t, 0.8, 1.5);
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function textColors(occ: OccasionType, m: MoodPalette) {
  const theme = CLIP_THEMES[occ] ?? CLIP_THEMES.other;
  return { ink: m.ink, muted: m.muted, accent: m.dark ? theme.threads.accent : theme.collage.accent };
}

// ------------------------------------------------------------ garden in bloom

function bloom(ctx: Ctx, t: number, occ: OccasionType, m: MoodPalette, calm: boolean): SceneLayout {
  const key = `bloom:${occ}`;
  const r = rng(hash(key));
  const flowers = (CLIP_THEMES[occ] ?? CLIP_THEMES.other).collage.pieces;
  const green = mix("#3f6b3a", m.land[2], 0.3);
  const greenLight = mix("#7aa05a", m.land[0], 0.25);
  const pace = calm ? 0.6 : 1;

  sky(ctx, m, H);
  glowDisk(ctx, 150, 170, 46, m, m.dark ? 0.6 : 0.9);
  if (m.dark) stars(ctx, t, key, 600, 90, m.light, 0.8);

  // far hedges
  for (let k = 0; k < 3; k++) {
    ctx.fillStyle = mix(m.land[k], green, 0.25 + k * 0.15, 0.55 + k * 0.15);
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 1010 + k * 60 + Math.sin(x * 0.012 + k * 2) * 26 + Math.sin(x * 0.03 + k) * 10);
    ctx.lineTo(W, H);
    ctx.fill();
  }

  // grass, swaying in the breeze
  ctx.lineCap = "round";
  for (let i = 0; i < 150; i++) {
    const x = (i / 150) * W + (r() - 0.5) * 10, h = 40 + r() * 90, sway = wind(t * pace, x, 3) * 0.45 * h;
    ctx.strokeStyle = mix(green, greenLight, r(), 0.9);
    ctx.lineWidth = 2 + r() * 2;
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.quadraticCurveTo(x + sway * 0.3, H - h * 0.6, x + sway, H - h * progress(t, 0, 1.2));
    ctx.stroke();
  }

  // stems grow, leaves unfurl, buds open — a paler back row first, for depth
  const count = calm ? 10 : 16;
  for (let i = 0; i < count; i++) {
    const back = i < count / 2;
    const slot = back ? i / (count / 2 - 1) : (i - count / 2) / (count / 2 - 1);
    const baseX = 40 + slot * (W - 80) + (r() - 0.5) * 50;
    const height = (back ? 360 : 260) + r() * (back ? 200 : 240);
    const delay = (back ? 0.1 : 0.6) + r() * 1.2;
    const color = back ? mix(flowers[Math.floor(r() * flowers.length)], m.sky[2], 0.35) : flowers[Math.floor(r() * flowers.length)];
    const petals = 5 + Math.floor(r() * 4);
    const size = (back ? 30 : 44) + r() * (back ? 18 : 30);
    const lean = (r() - 0.5) * 80;
    const g = easeOutCubic(progress(t * pace, delay, 2.6));
    if (g <= 0) continue;
    const sway = wind(t * pace, baseX, i) * 26 * g;
    const tipX = baseX + lean * g + sway, tipY = H - 20 - height * g;
    ctx.strokeStyle = green;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(baseX, H + 10);
    ctx.bezierCurveTo(baseX, H - height * 0.4 * g, tipX - sway * 0.6, tipY + height * 0.3 * g, tipX, tipY);
    ctx.stroke();

    // two leaves
    for (const [at, side] of [[0.35, -1], [0.6, 1]] as const) {
      const lg = easeOutBack(clamp01((g - at) / 0.4));
      if (lg <= 0) continue;
      const lx = baseX + (tipX - baseX) * at * at, ly = H - height * g * at;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(side * (0.9 + wind(t, lx, 9) * 0.15));
      ctx.scale(lg, lg);
      ctx.fillStyle = greenLight;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(22, -16, 52, 0);
      ctx.quadraticCurveTo(22, 14, 0, 0);
      ctx.fill();
      ctx.restore();
    }

    // flower head
    const b = progress(t * pace, delay + 2.1, 1.7);
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(sway * 0.004);
    if (b <= 0) {
      ctx.fillStyle = mix(color, green, 0.45);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 12 * g, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const open = easeOutBack(b) * (1 + Math.sin(t * 1.4 + i) * 0.03);
      for (let p = 0; p < petals; p++) {
        ctx.save();
        ctx.rotate((p / petals) * Math.PI * 2 + i + t * 0.05);
        const len = size * open;
        const grad = ctx.createLinearGradient(0, 0, 0, -len);
        grad.addColorStop(0, mix(color, "#000000", 0.12));
        grad.addColorStop(1, mix(color, "#ffffff", 0.25));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(len * 0.5, -len * 0.25, len * 0.35, -len, 0, -len);
        ctx.bezierCurveTo(-len * 0.35, -len, -len * 0.5, -len * 0.25, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = mix(textColors(occ, m).accent, "#ffd36a", 0.4);
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.18 * Math.min(1, open), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // butterflies drifting through
  if (!calm) {
    for (let k = 0; k < 2; k++) {
      const on = progress(t, 2 + k * 2.5, 1);
      if (on <= 0) continue;
      const x = ((k ? W + 60 : -60) + (k ? -1 : 1) * (t - 2 - k * 2.5) * 70) + noise(t * 0.6, k + 4) * 50;
      const y = 300 + k * 220 + noise(t * 0.5, k + 8) * 90;
      const flap = Math.abs(Math.sin(t * 9 + k));
      const c = flowers[(k * 3 + 1) % flowers.length];
      ctx.save();
      ctx.globalAlpha = on;
      ctx.translate(x, y);
      ctx.rotate(noise(t, k) * 0.3);
      ctx.fillStyle = mix(c, "#000000", 0.1);
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.scale(s * (0.25 + 0.75 * flap), 1);
        ctx.beginPath();
        ctx.ellipse(10, -6, 12, 9, -0.4, 0, Math.PI * 2);
        ctx.ellipse(8, 7, 8, 6, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = mix(m.ink, "#000000", 0.2);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(0, 10);
      ctx.stroke();
      ctx.restore();
    }
  }
  motes(ctx, t, key, calm ? 18 : 34, m.dark ? m.light : "#ffffff", [80, 1100]);
  veil(ctx, t, 470, m.dark ? m.sky[0] : m.sky[2], m.dark ? 0.75 : 0.85);
  return { centerY: 470, colors: textColors(occ, m), ground: m.sky[1] };
}

// ------------------------------------------------------------ desert dunes

function dunes(ctx: Ctx, t: number, occ: OccasionType, m: MoodPalette, mood: string, calm: boolean): SceneLayout {
  const key = `dunes:${occ}`;
  const horizon = 900;
  sky(ctx, m, horizon + 40);
  const night = mood === "night" || mood === "dusk";
  if (night) {
    // a faint band of the Milky Way
    ctx.save();
    ctx.translate(W / 2, 360);
    ctx.rotate(-0.5);
    const band = ctx.createLinearGradient(0, -120, 0, 120);
    band.addColorStop(0, "rgba(255,255,255,0)");
    band.addColorStop(0.5, rgba(m.glow, 0.12));
    band.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = band;
    ctx.fillRect(-700, -120, 1400, 240);
    ctx.restore();
    stars(ctx, t, key, horizon - 60, 220, "#ffffff", 0.95);
    const rise = easeInOut(progress(t, 0, 6));
    crescent(ctx, 545, 620 - rise * 410, 44, m); // clears the text block above the dunes
    // shooting stars
    if (!calm) {
      for (const at of [2.4, 7.8]) {
        const p = progress(t, at, 0.9);
        if (p > 0 && p < 1) {
          const x = 620 - p * 360, y = 120 + p * 170;
          const g = ctx.createLinearGradient(x, y, x + 120, y - 56);
          g.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - p)})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 120, y - 56);
          ctx.stroke();
        }
      }
    }
  } else {
    // sun rising (dawn) or setting (sunset)
    const p = easeInOut(progress(t, 0, 8));
    const y = mood === "dawn" ? horizon + 30 - p * 180 : horizon - 220 + p * 150;
    glowDisk(ctx, 560, y, 58, m, 1);
  }

  // dune layers with drifting parallax and rim light on the crests
  const layers = 5;
  for (let k = 0; k < layers; k++) {
    const base = horizon - 30 + k * 82;
    const drift = t * (3 + k * 5) * (calm ? 0.5 : 1);
    const color = k === 0 ? mix(m.land[0], m.sky[2], 0.35) : mix(m.land[Math.min(2, k - 1)], m.land[2], (k - 1) / 3);
    const crest = (x: number) =>
      base - 46 - Math.sin((x + drift) * 0.006 + k * 1.7) * (34 + k * 8) - Math.sin((x + drift) * 0.017 + k) * 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-40, H);
    for (let x = -40; x <= W + 40; x += 12) ctx.lineTo(x, crest(x));
    ctx.lineTo(W + 40, H);
    ctx.fill();
    ctx.strokeStyle = rgba(m.glow, night ? 0.22 : 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -40; x <= W + 40; x += 12) (x === -40 ? ctx.moveTo : ctx.lineTo).call(ctx, x, crest(x));
    ctx.stroke();
    // sand lifting off the crest in the wind
    if (k >= 2 && !calm) {
      const r = rng(hash(key + k));
      ctx.fillStyle = rgba(mix(m.land[0], "#ffffff", 0.4), 0.5);
      for (let i = 0; i < 26; i++) {
        const x0 = r() * W, life = (t * 0.6 + r()) % 1;
        const x = x0 - life * 140, y = crest(x0) - life * 30 + Math.sin(life * 6 + i) * 6;
        ctx.globalAlpha = (1 - life) * 0.6;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  }
  veil(ctx, t, 560, m.dark ? m.sky[0] : m.sky[2], m.dark ? 0.7 : 0.8);
  return { centerY: 560, colors: textColors(occ, m), ground: m.sky[0] };
}

// ------------------------------------------------------------ sea at the horizon

function sea(ctx: Ctx, t: number, occ: OccasionType, m: MoodPalette, mood: string, calm: boolean): SceneLayout {
  const key = `sea:${occ}`;
  const horizon = 760;
  sky(ctx, m, horizon + 2);
  const night = mood === "night";
  const sunX = 360;
  let sunY = horizon - 90;
  if (night) {
    stars(ctx, t, key, horizon - 40, 170, "#ffffff", 0.9);
    sunY = 300 - easeInOut(progress(t, 0, 7)) * 60;
    crescent(ctx, 470, sunY, 40, m);
  } else {
    const p = easeInOut(progress(t, 0, 9));
    sunY = mood === "sunset" ? horizon - 100 + p * 70 : horizon - 10 - p * 90;
    glowDisk(ctx, sunX, sunY, mood === "mist" ? 50 : 56, m, mood === "mist" ? 0.5 : 1);
  }

  // drifting clouds
  const r = rng(hash(key));
  for (let i = 0; i < 6; i++) {
    const cx = ((r() * W + t * (6 + r() * 8)) % (W + 300)) - 150, cy = 110 + r() * 420, s = 0.7 + r() * 0.9;
    ctx.fillStyle = rgba(mix(m.sky[2], m.glow, 0.4), m.dark ? 0.12 : 0.35);
    for (let j = 0; j < 5; j++) {
      ctx.beginPath();
      ctx.ellipse(cx + (j - 2) * 34 * s, cy + Math.sin(j) * 8, 60 * s, 18 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // the water
  const sg = ctx.createLinearGradient(0, horizon, 0, H);
  sg.addColorStop(0, mix(m.sky[2], m.land[0], 0.5));
  sg.addColorStop(0.4, m.land[1]);
  sg.addColorStop(1, m.land[2]);
  ctx.fillStyle = sg;
  ctx.fillRect(-40, horizon, W + 80, H - horizon + 40);

  // light on the water: a glittering path under the sun or moon
  const pathX = night ? 470 : sunX;
  for (let i = 0; i < 160; i++) {
    const depth = (i % 40) / 40;
    const y = horizon + 6 + Math.pow(depth, 1.6) * (H - horizon - 20) + ((i * 37) % 11);
    const spread = 20 + depth * 220;
    const x = pathX + noise(i * 1.3 + t * 0.8, i) * spread;
    const flick = 0.5 + 0.5 * Math.sin(t * 5 + i * 1.7);
    ctx.fillStyle = rgba(m.light, (0.15 + 0.6 * flick) * (1 - depth * 0.5) * (mood === "mist" ? 0.5 : 1));
    ctx.fillRect(x - (4 + depth * 14), y, 8 + depth * 28, 1.6 + depth * 2);
  }

  // waves, closer ones bigger and slower
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 34; i++) {
    const d = i / 34;
    const y0 = horizon + 8 + Math.pow(d, 1.7) * (H - horizon);
    const amp = 2 + d * 14, speed = calm ? 0.3 : 0.6 + d * 0.5;
    ctx.strokeStyle = rgba(mix(m.land[0], "#ffffff", 0.5), 0.12 + d * 0.22);
    ctx.beginPath();
    for (let x = -20; x <= W + 20; x += 16) {
      const y = y0 + Math.sin(x * (0.02 - d * 0.012) + t * speed + i) * amp + noise(x * 0.01 + t * 0.3, i) * amp * 0.6;
      if (x === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // foam rolling in at the shore
  const roll = 0.5 + 0.5 * Math.sin((t / 6) * Math.PI * 2 - Math.PI / 2);
  const foamY = H - 70 - roll * 50;
  ctx.fillStyle = rgba("#ffffff", m.dark ? 0.18 : 0.45);
  ctx.beginPath();
  ctx.moveTo(-20, H + 10);
  for (let x = -20; x <= W + 20; x += 14) ctx.lineTo(x, foamY + Math.sin(x * 0.03 + t) * 10 + noise(x * 0.02, 5) * 8);
  ctx.lineTo(W + 20, H + 10);
  ctx.fill();

  // gulls gliding over the water
  if (!calm && !night) {
    ctx.strokeStyle = mix(m.ink, m.sky[0], 0.3);
    ctx.lineWidth = 2.2;
    for (let k = 0; k < 3; k++) {
      const x = ((t * (34 + k * 9) + k * 260) % (W + 200)) - 100;
      const y = 560 + k * 46 + noise(t * 0.5, k) * 30;
      const flap = Math.sin(t * 5 + k * 2) * 7;
      ctx.beginPath();
      ctx.moveTo(x - 14, y - flap);
      ctx.quadraticCurveTo(x - 6, y - 6 - flap * 0.4, x, y);
      ctx.quadraticCurveTo(x + 6, y - 6 - flap * 0.4, x + 14, y - flap);
      ctx.stroke();
    }
  }
  veil(ctx, t, 360, m.dark ? m.sky[0] : m.sky[1], m.dark ? 0.7 : 0.75);
  return { centerY: 360, colors: textColors(occ, m), ground: m.sky[0] };
}

// ------------------------------------------------------------ palm oasis

interface Palm {
  x: number;
  y: number;
  s: number;
  lean: number;
  seed: number;
}

function drawPalm(ctx: Ctx, t: number, p: Palm, trunk: string, leaf: string, calm: boolean) {
  const height = 520 * p.s;
  const sway = wind(t * (calm ? 0.5 : 1), p.x, p.seed) * 18 * p.s;
  const topX = p.x + p.lean * p.s + sway, topY = p.y - height;
  // trunk: tapered, gently curved, with growth rings
  ctx.fillStyle = trunk;
  ctx.beginPath();
  const segs = 16;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segs; i++) {
    const k = i / segs;
    const x = p.x + (topX - p.x) * Math.pow(k, 1.6);
    const y = p.y - height * k;
    pts.push([x, y, (16 - 9 * k) * p.s]);
  }
  pts.forEach(([x, y, w], i) => (i ? ctx.lineTo(x - w, y) : ctx.moveTo(x - w, y)));
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] + pts[i][2], pts[i][1]);
  ctx.fill();
  ctx.strokeStyle = mix(trunk, "#000000", 0.25, 0.6);
  ctx.lineWidth = 1.5;
  for (let i = 1; i < segs; i++) {
    const [x, y, w] = pts[i];
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x, y + 4 * p.s, x + w, y);
    ctx.stroke();
  }
  // fronds: drooping spines with leaflets, each fluttering in the wind
  const r = rng(p.seed);
  const fronds = 12;
  for (let f = 0; f < fronds; f++) {
    const base = -Math.PI + (f / (fronds - 1)) * Math.PI + (r() - 0.5) * 0.25;
    const len = (170 + r() * 70) * p.s;
    const flutter = wind(t * (calm ? 0.6 : 1.3), f * 40 + p.x, p.seed + f) * 0.14;
    const a = base + flutter;
    const droop = 0.9 + Math.abs(Math.cos(a)) * 0.6;
    const ex = topX + Math.cos(a) * len, ey = topY + Math.sin(a) * len * 0.55 + len * 0.42 * droop;
    const cx = topX + Math.cos(a) * len * 0.55, cy = topY + Math.sin(a) * len * 0.55 - len * 0.12;
    ctx.strokeStyle = leaf;
    ctx.lineWidth = 3 * p.s;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
    ctx.lineWidth = 1.6 * p.s;
    for (let i = 2; i < 18; i++) {
      const k = i / 18;
      const x = (1 - k) * (1 - k) * topX + 2 * (1 - k) * k * cx + k * k * ex;
      const y = (1 - k) * (1 - k) * topY + 2 * (1 - k) * k * cy + k * k * ey;
      const tx = 2 * (1 - k) * (cx - topX) + 2 * k * (ex - cx), ty = 2 * (1 - k) * (cy - topY) + 2 * k * (ey - cy);
      const tl = Math.hypot(tx, ty) || 1;
      const nx = -ty / tl, ny = tx / tl;
      const ll = (26 - k * 14) * p.s;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (nx * side * 0.8 + tx / tl * 0.3) * ll, y + (ny * side * 0.8 + ty / tl * 0.3) * ll + ll * 0.35);
        ctx.stroke();
      }
    }
  }
}

function oasis(ctx: Ctx, t: number, occ: OccasionType, m: MoodPalette, calm: boolean): SceneLayout {
  const key = `oasis:${occ}`;
  const horizon = 930;
  sky(ctx, m, horizon + 4);
  if (m.dark) stars(ctx, t, key, 700, 120, "#ffffff", 0.85);
  // sun with slowly turning rays
  const sunX = 540, sunY = 250;
  ctx.save();
  ctx.translate(sunX, sunY);
  ctx.rotate(t * 0.04);
  for (let i = 0; i < 12; i++) {
    ctx.rotate((Math.PI * 2) / 12);
    const g = ctx.createLinearGradient(0, 0, 900, 0);
    g.addColorStop(0, rgba(m.glow, m.dark ? 0.05 : 0.12));
    g.addColorStop(1, rgba(m.glow, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(900, -50);
    ctx.lineTo(900, 50);
    ctx.fill();
  }
  ctx.restore();
  if (m.dark) crescent(ctx, sunX, sunY, 42, m);
  else glowDisk(ctx, sunX, sunY, 50, m, 1);

  // distant dunes on the horizon
  ctx.fillStyle = mix(m.land[0], m.sky[2], 0.3);
  ctx.beginPath();
  ctx.moveTo(0, horizon + 4);
  for (let x = 0; x <= W; x += 16) ctx.lineTo(x, horizon - 30 - Math.sin(x * 0.008 + 1) * 24 - Math.sin(x * 0.021) * 8);
  ctx.lineTo(W, horizon + 4);
  ctx.fill();

  // sandy bank down to the water's edge
  const bank = ctx.createLinearGradient(0, horizon - 10, 0, horizon + 44);
  bank.addColorStop(0, mix(m.land[0], m.sky[2], 0.2));
  bank.addColorStop(1, m.land[1]);
  ctx.fillStyle = bank;
  ctx.fillRect(-40, horizon - 4, W + 80, 50);

  const trunk = m.dark ? mix(m.land[2], "#000000", 0.3) : mix("#7a5a3a", m.land[2], 0.35);
  const leaf = m.dark ? mix(m.land[2], "#0a1a10", 0.4) : mix("#2f5a34", m.land[2], 0.25);
  const palms: Palm[] = [
    { x: 250, y: horizon + 12, s: 0.55, lean: 30, seed: 11 },
    { x: 70, y: horizon + 40, s: 1, lean: 120, seed: 3 },
    { x: 670, y: horizon + 30, s: 0.92, lean: -110, seed: 7 },
  ];
  for (const p of palms) drawPalm(ctx, t, p, trunk, leaf, calm);

  // the pool, reflecting sky and palms with gentle ripples
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, horizon + 40, W, H - horizon - 40);
  ctx.clip();
  ctx.translate(0, 2 * (horizon + 40));
  ctx.scale(1, -1);
  ctx.globalAlpha = 0.55;
  sky(ctx, m, horizon + 40);
  for (const p of palms) drawPalm(ctx, t, { ...p, y: p.y + 28 }, trunk, leaf, calm);
  ctx.restore();
  const water = ctx.createLinearGradient(0, horizon + 40, 0, H);
  water.addColorStop(0, rgba(m.land[1], 0.35));
  water.addColorStop(1, rgba(m.land[2], 0.75));
  ctx.fillStyle = water;
  ctx.fillRect(0, horizon + 40, W, H - horizon - 40);
  ctx.strokeStyle = rgba("#ffffff", m.dark ? 0.12 : 0.3);
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 18; i++) {
    const y = horizon + 50 + i * 17 + Math.sin(t * 0.8 + i) * 3;
    const x = (W / 2) + noise(t * 0.3 + i, i) * 200;
    const w = 60 + (i % 5) * 30;
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
  }
  motes(ctx, t, key, calm ? 16 : 30, m.light, [120, horizon], 10);
  veil(ctx, t, 560, m.dark ? m.sky[0] : m.sky[2], m.dark ? 0.7 : 0.8);
  return { centerY: 560, colors: textColors(occ, m), ground: m.sky[0] };
}

// ------------------------------------------------------------ entry

export function drawNature(ctx: Ctx, t: number, style: NatureStyle, occ: OccasionType): SceneLayout {
  const mood = (OCCASION_MOODS[occ] ?? OCCASION_MOODS.other)[style];
  const m = MOODS[mood];
  const calm = occ === "condolence";
  // a slow drift of the "camera" makes the scene feel alive
  const zoom = 1 + 0.04 * (t / 12);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-W / 2 + noise(t * 0.2, 1) * 6, -H / 2 + noise(t * 0.2, 2) * 4);
  let layout: SceneLayout;
  if (style === "bloom") layout = bloom(ctx, t, occ, m, calm);
  else if (style === "dunes") layout = dunes(ctx, t, occ, m, mood, calm);
  else if (style === "sea") layout = sea(ctx, t, occ, m, mood, calm);
  else layout = oasis(ctx, t, occ, m, calm);
  ctx.restore();
  return layout;
}
