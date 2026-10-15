// Small shared helpers for the clip scenes: seeded randomness, easing, colour, noise.


export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOutBack = (x: number) => {
  const c1 = 1.4, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
export const progress = (t: number, start: number, dur: number) => clamp01((t - start) / dur);

// Parses "#rrggbb" or "rgb(a)(r,g,b[,a])" into [r, g, b].
export function rgb(color: string): number[] {
  if (color.startsWith("#")) {
    const h = color.slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = color.match(/[\d.]+/g) ?? ["0", "0", "0"];
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}
export function mix(a: string, b: string, k: number, alpha = 1) {
  const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b);
  return `rgba(${Math.round(r1 + (r2 - r1) * k)},${Math.round(g1 + (g2 - g1) * k)},${Math.round(b1 + (b2 - b1) * k)},${alpha})`;
}
export const rgba = (hex: string, a: number) => mix(hex, hex, 0, a);


// Smooth 1-D value noise in [-1, 1]: natural, non-repeating drift (wind, swell).
export function noise(x: number, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const h = (n: number) => {
    const v = Math.sin((n + seed * 101.3) * 127.1) * 43758.5453;
    return (v - Math.floor(v)) * 2 - 1;
  };
  const u = f * f * (3 - 2 * f);
  return h(i) * (1 - u) + h(i + 1) * u;
}

// Gentle layered wind: slow gusts plus a little flutter.
export function wind(t: number, x = 0, seed = 0) {
  return noise(t * 0.35 + x * 0.004, seed) * 0.7 + noise(t * 1.3 + x * 0.01, seed + 7) * 0.3;
}
