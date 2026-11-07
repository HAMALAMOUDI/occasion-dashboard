"use client";

import { useEffect, useRef } from "react";
import { CLIP_H, CLIP_W, clipDuration, renderClipScene } from "@/lib/clips/engine";
import type { ClipStyle } from "@/lib/clips/themes";
import type { OccasionType } from "@/lib/occasions";

// Where each scene's interest sits (in clip pixels), so a wide crop keeps it in view.
const FOCUS: Record<ClipStyle, number> = {
  palace: 470, // the castle's towers and spires
  royal: 520, // chandelier and the top of the stairs
  bloom: 900, // the flowers
  dunes: 860, // dune crests under the stars
  sea: 760, // the sun on the horizon
  oasis: 780, // palms over the pool
  collage: 130, // the top of the wreath
  threads: 330, // the swirl
};

const FRAME_MS = 1000 / 30; // ambient motion doesn't need more, and it spares batteries

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A clip's artwork, without words, cropped to fill its box like `object-fit: cover`.
// Decorative: hidden from assistive technology.
//   motion "always" — drifts gently while on screen (one hero per page)
//   motion "hover"  — a still that comes alive while the pointer is over the
//                     nearest [data-scene-host] ancestor (cards in a grid)
export default function SceneCanvas({
  style,
  occasion,
  motion = "always",
  className = "",
}: {
  style: ClipStyle;
  occasion: OccasionType;
  motion?: "always" | "hover";
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    // Start on the settled scene (the poster moment) and keep going from there.
    let time = clipDuration(style) - 2;
    let visible = false;
    let hovering = false;
    let raf = 0;
    let last = 0;

    const draw = () => {
      const w = el.width, h = el.height;
      if (!w || !h) return;
      const k = Math.max(w / CLIP_W, h / CLIP_H);
      const ox = (w - CLIP_W * k) / 2;
      const oy = Math.min(0, Math.max(h - CLIP_H * k, h / 2 - FOCUS[style] * k));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.setTransform(k, 0, 0, k, ox, oy);
      renderClipScene(ctx, time, style, occasion);
    };

    const tick = (now: number) => {
      if (now - last >= FRAME_MS) {
        if (last) time += Math.min(now - last, 100) / 1000;
        last = now;
        draw();
      }
      raf = requestAnimationFrame(tick);
    };
    const update = () => {
      const run = visible && !reducedMotion() && (motion === "always" || hovering);
      if (run && !raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = el.getBoundingClientRect();
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      update();
    });
    io.observe(el);

    const host = (el.closest("[data-scene-host]") as HTMLElement | null) ?? el;
    const enter = () => {
      hovering = true;
      update();
    };
    const leave = () => {
      hovering = false;
      update();
    };
    if (motion === "hover") {
      host.addEventListener("pointerenter", enter);
      host.addEventListener("pointerleave", leave);
      host.addEventListener("focusin", enter);
      host.addEventListener("focusout", leave);
    }
    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("focusin", enter);
      host.removeEventListener("focusout", leave);
    };
  }, [style, occasion, motion]);

  return <canvas ref={canvas} aria-hidden="true" className={`block h-full w-full ${className}`} />;
}
