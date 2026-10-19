"use client";

import { useEffect, useRef } from "react";
import { loadFonts, pageFonts } from "@/components/ClipPlayer";
import { CLIP_H, CLIP_W, clipDuration, renderClipFrame } from "@/lib/clips/engine";
import { clipSampleText } from "@/lib/clips/content";
import type { Lang } from "@/lib/occasions";

// The animated invitation set inside the hero sentence. Drawn at half resolution
// (the slot is small), capped at 30fps like the downloaded videos, paused off
// screen, and held on the finished still for anyone who prefers less motion.
const SCALE = 0.5;
const STYLE = "bloom";

export default function HeroClip({ lang, label }: { lang: Lang; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const fonts = pageFonts();
    const text = clipSampleText("wedding", lang);
    const spec = { style: STYLE, occasion: "wedding", text, fonts } as const;
    const duration = clipDuration(STYLE);
    const draw = (t: number) => {
      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      renderClipFrame(ctx, t, spec);
    };
    const still = duration - 2;
    let raf = 0;
    let visible = false;
    let alive = true;
    let start = performance.now();
    let last = 0;

    const tick = (now: number) => {
      if (now - last >= 33) {
        last = now;
        draw(((now - start) / 1000) % duration);
      }
      raf = requestAnimationFrame(tick);
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduced && alive) {
        start = performance.now() - 1500; // open on buds already rising, not a blank first frame
        raf = requestAnimationFrame(tick);
      }
    });

    draw(still);
    loadFonts(fonts, text).then(() => {
      if (!alive) return;
      draw(still);
      io.observe(el);
    });
    return () => {
      alive = false;
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [lang]);

  return (
    <canvas
      ref={canvas}
      width={CLIP_W * SCALE}
      height={CLIP_H * SCALE}
      role="img"
      aria-label={label}
      className="block h-full w-full object-cover object-[50%_86%]"
    />
  );
}
