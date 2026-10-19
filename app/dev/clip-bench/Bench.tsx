"use client";

import { useEffect, useRef, useState } from "react";
import { CLIP_H, CLIP_W, clipDuration, renderClipFrame, type ClipFonts } from "@/lib/clips/engine";
import { clipSampleText } from "@/lib/clips/content";
import type { ClipStyle } from "@/lib/clips/themes";

const FONTS: ClipFonts = { display: "Georgia", displayAr: "serif", body: "system-ui", bodyAr: "system-ui", script: "cursive", scriptAr: "serif" };

// Raster cost per calling function: flushes after every draw call, so totals are
// inflated but the ranking shows where the pixels are expensive.
function attribute(ctx: CanvasRenderingContext2D, draw: () => void) {
  const proto = CanvasRenderingContext2D.prototype as unknown as Record<string, (...a: unknown[]) => unknown>;
  const names = ["fill", "fillRect", "stroke", "fillText", "strokeText", "drawImage"];
  const saved = names.map((n) => proto[n]);
  const cost = new Map<string, { ms: number; calls: number; shadowed: number }>();
  const flush = () => ctx.getImageData(0, 0, 1, 1);
  names.forEach((n, i) => {
    proto[n] = function (this: CanvasRenderingContext2D, ...args: unknown[]) {
      flush();
      const a = performance.now();
      const r = saved[i].apply(this, args);
      flush();
      const ms = performance.now() - a;
      const caller = (new Error().stack ?? "").split("\n")[2]?.trim().split(" ")[1] ?? "?";
      const key = `${caller} ${n}`;
      const c = cost.get(key) ?? { ms: 0, calls: 0, shadowed: 0 };
      c.ms += ms;
      c.calls++;
      if (this.shadowBlur > 0 && this.shadowColor !== "rgba(0, 0, 0, 0)") c.shadowed++;
      cost.set(key, c);
      return r;
    };
  });
  draw();
  names.forEach((n, i) => (proto[n] = saved[i]));
  return [...cost].sort((a, b) => b[1].ms - a[1].ms).slice(0, 14).map(([k, v]) => `${v.ms.toFixed(1).padStart(6)}ms ${String(v.calls).padStart(5)} calls ${String(v.shadowed).padStart(4)} shadowed  ${k}`);
}

export default function Bench({ style, noShadow, at }: { style: string; noShadow: boolean; at?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [out, setOut] = useState("running…");

  useEffect(() => {
    const ctx = canvas.current!.getContext("2d")!;
    if (noShadow) Object.defineProperty(CanvasRenderingContext2D.prototype, "shadowBlur", { set() {}, get: () => 0, configurable: true });
    const spec = { style: style as ClipStyle, occasion: "wedding" as const, text: clipSampleText("wedding", "ar"), fonts: FONTS };
    const duration = clipDuration(spec.style);
    if (at !== undefined) {
      renderClipFrame(ctx, at, spec);
      const result = { style, at, top: attribute(ctx, () => renderClipFrame(ctx, at, spec)) };
      (window as unknown as { __bench: unknown }).__bench = result;
      setOut(result.top.join("\n"));
      return;
    }
    renderClipFrame(ctx, 1, spec); // warm up
    ctx.getImageData(0, 0, 1, 1);
    const frames: { t: number; ms: number }[] = [];
    for (let t = 0; t <= duration; t += 1 / 15) {
      const a = performance.now();
      renderClipFrame(ctx, t, spec);
      ctx.getImageData(0, 0, 1, 1); // flush, so the GPU's share is counted too
      frames.push({ t: +t.toFixed(2), ms: performance.now() - a });
    }
    const ms = frames.map((f) => f.ms).sort((a, b) => a - b);
    const q = (p: number) => +ms[Math.floor(p * (ms.length - 1))].toFixed(1);
    const perSecond = Array.from({ length: Math.ceil(duration) }, (_, s) => {
      const slice = frames.filter((f) => f.t >= s && f.t < s + 1).map((f) => f.ms);
      return +Math.max(...slice).toFixed(1);
    });
    const result = { style, noShadow, frames: frames.length, median: q(0.5), p95: q(0.95), max: q(1), over8ms: frames.filter((f) => f.ms > 8).length, over16ms: frames.filter((f) => f.ms > 16.7).length, perSecondMax: perSecond };
    (window as unknown as { __bench: unknown }).__bench = result;
    setOut(JSON.stringify(result, null, 1));
  }, [style, noShadow, at]);

  return (
    <main style={{ padding: 16, font: "12px ui-monospace" }}>
      <pre id="bench">{out}</pre>
      <canvas ref={canvas} width={CLIP_W} height={CLIP_H} style={{ width: 180 }} />
    </main>
  );
}
