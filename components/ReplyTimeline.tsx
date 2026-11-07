"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Guest } from "@/lib/types";
import { niceTicks, replyTimeline, type TimelinePoint } from "@/lib/timeline";
import { formatNumber, formatShortDate } from "@/lib/i18n";
import { useLocale, useT } from "./I18nProvider";

// "Replies over time": running totals of guests coming and not coming, day by
// day since the invitations went out. Drawn on a canvas (crisp at any pixel
// density, with a short reveal), with a crosshair tooltip on hover or arrow
// keys, a legend and direct end labels, and a table view of every value.

const PLOT_H = 180;
const AXIS_H = 26;
const PAD = { top: 14, left: 36, right: 104 };
const REVEAL_MS = 900;

const localDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD, organizer's time zone

type Series = { key: "coming" | "notComing"; color: string; area: boolean };

export default function ReplyTimeline({ guests }: { guests: Guest[] }) {
  const t = useT();
  const locale = useLocale();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const reveal = useRef(0);
  const today = localDay(new Date().toISOString());
  const points = useMemo(() => replyTimeline(guests, today, localDay), [guests, today]);
  const last = points[points.length - 1];

  const plotW = Math.max(60, width - PAD.left - PAD.right);
  const xAt = (i: number) => PAD.left + (points.length > 1 ? (i / (points.length - 1)) * plotW : 0);
  const ticks = niceTicks(Math.max(1, ...points.map((p) => Math.max(p.coming, p.notComing))));
  const top = ticks[ticks.length - 1];
  const yAt = (v: number) => PAD.top + PLOT_H - (v / top) * PLOT_H;

  // Keep the canvas sized to its box.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw; on first appearance the lines sweep in from the left.
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || !width || points.length === 0) return;
    const css = getComputedStyle(document.documentElement);
    const v = (name: string) => css.getPropertyValue(name).trim();
    const C = { accept: v("--accept"), decline: v("--decline"), line: v("--line"), muted: v("--muted"), ink: v("--ink"), surface: v("--surface") || "#fff" };
    const font = v("--font-body") || "system-ui, sans-serif";
    const series: Series[] = [
      { key: "coming", color: C.accept, area: true },
      { key: "notComing", color: C.decline, area: false },
    ];
    const label = { coming: t.timeline.coming, notComing: t.timeline.notComing };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const H = PAD.top + PLOT_H + AXIS_H;
    el.width = width * dpr;
    el.height = H * dpr;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, H);
      // grid and y ticks: hairlines, one step off the surface
      ctx.font = `11px ${font}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      ctx.lineWidth = 1;
      for (const tick of ticks) {
        const y = Math.round(yAt(tick)) + 0.5;
        ctx.strokeStyle = C.line;
        ctx.beginPath();
        ctx.moveTo(PAD.left, y);
        ctx.lineTo(PAD.left + plotW, y);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.fillText(formatNumber(tick, locale), PAD.left - 8, y);
      }
      // x labels: first, middle (when there's room) and last day
      ctx.textBaseline = "alphabetic";
      const xs = points.length > 2 && plotW > 300 ? [0, Math.floor((points.length - 1) / 2), points.length - 1] : [0, points.length - 1];
      xs.forEach((i, n) => {
        ctx.textAlign = n === 0 ? "left" : n === xs.length - 1 ? "right" : "center";
        ctx.fillStyle = C.muted;
        ctx.fillText(formatShortDate(points[i].day, locale), xAt(i), PAD.top + PLOT_H + 18);
      });

      // series, revealed left to right
      ctx.save();
      ctx.beginPath();
      ctx.rect(PAD.left - 6, 0, plotW * reveal.current + 12, PAD.top + PLOT_H + 1);
      ctx.clip();
      for (const s of series) {
        const path = () => {
          ctx.beginPath();
          points.forEach((p, i) => (i ? ctx.lineTo(xAt(i), yAt(p[s.key])) : ctx.moveTo(xAt(i), yAt(p[s.key]))));
        };
        if (s.area) {
          path();
          ctx.lineTo(xAt(points.length - 1), yAt(0));
          ctx.lineTo(xAt(0), yAt(0));
          ctx.closePath();
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = s.color;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        path();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
      }
      ctx.restore();

      const dot = (x: number, y: number, color: string) => {
        ctx.fillStyle = C.surface; // 2px surface ring
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      };

      if (reveal.current >= 1) {
        // end dots and direct labels; when the two ends crowd each other, only
        // "coming" keeps its label (the legend and tooltip carry the other)
        const end = points.length - 1;
        const ends = series.map((s) => ({ s, y: yAt(points[end][s.key]), value: points[end][s.key] }));
        const crowded = Math.abs(ends[0].y - ends[1].y) < 16;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = `12px ${font}`;
        for (const [n, e] of ends.entries()) {
          dot(xAt(end), e.y, e.s.color);
          if (crowded && n > 0) continue;
          ctx.fillStyle = C.ink;
          ctx.fillText(`${formatNumber(e.value, locale)} ${label[e.s.key]}`, xAt(end) + 12, e.y);
        }
      }

      // crosshair snapped to the hovered day
      if (hover !== null && reveal.current >= 1) {
        const x = Math.round(xAt(hover)) + 0.5;
        ctx.strokeStyle = C.muted;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, PAD.top);
        ctx.lineTo(x, PAD.top + PLOT_H);
        ctx.stroke();
        ctx.globalAlpha = 1;
        for (const s of series) dot(xAt(hover), yAt(points[hover][s.key]), s.color);
      }
    };

    if (reveal.current >= 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal.current = 1;
      draw();
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / REVEAL_MS);
      reveal.current = 1 - Math.pow(1 - k, 3);
      draw();
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // xAt/yAt derive from width, points and ticks, which are listed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, points, hover, locale, t]);

  if (points.length === 0) {
    return (
      <div className="card p-5">
        <h2 className="font-serif text-xl">{t.timeline.title}</h2>
        <p className="mt-1 text-sm text-muted">{t.timeline.noInvites}</p>
      </div>
    );
  }

  const nearest = (clientX: number) => {
    const rect = canvas.current!.getBoundingClientRect();
    const i = Math.round(((clientX - rect.left - PAD.left) / plotW) * (points.length - 1));
    return Math.max(0, Math.min(points.length - 1, i));
  };
  const onKey = (e: React.KeyboardEvent) => {
    const i = hover ?? points.length - 1;
    if (e.key === "ArrowLeft") setHover(Math.max(0, i - 1));
    else if (e.key === "ArrowRight") setHover(Math.min(points.length - 1, i + 1));
    else if (e.key === "Home") setHover(0);
    else if (e.key === "End") setHover(points.length - 1);
    else if (e.key === "Escape") setHover(null);
    else return;
    e.preventDefault();
  };
  const tip: TimelinePoint | null = hover === null ? null : points[hover];
  const tipLeft = hover === null ? 0 : Math.max(8, Math.min(width - 168, xAt(hover) - 80));
  const n = (v: number) => formatNumber(v, locale);

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 className="font-serif text-xl">{t.timeline.title}</h2>
          <p className="mt-0.5 text-sm text-muted">{t.timeline.subtitle(n(last.invited))}</p>
        </div>
        <ul className="flex gap-4 text-xs text-muted">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-accept" /> {t.timeline.coming}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-decline" /> {t.timeline.notComing}
          </li>
        </ul>
      </div>

      <div
        ref={wrap}
        dir="ltr"
        tabIndex={0}
        className="relative mt-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-pine/40"
        onPointerMove={(e) => setHover(nearest(e.clientX))}
        onPointerLeave={() => setHover(null)}
        onFocus={() => setHover(points.length - 1)}
        onBlur={() => setHover(null)}
        onKeyDown={onKey}
      >
        <canvas
          ref={canvas}
          role="img"
          aria-label={t.timeline.summary(n(last.coming), n(last.notComing), n(last.invited))}
          className="block w-full"
          style={{ height: PAD.top + PLOT_H + AXIS_H }}
        />
        {tip && (
          <div
            className="pointer-events-none absolute top-0 w-40 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-md"
            style={{ left: tipLeft }}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <p className="text-muted">{formatShortDate(tip.day, locale)}</p>
            <p className="mt-1 flex items-center gap-2">
              <span className="h-0.5 w-3 rounded-full bg-accept" />
              <span className="font-semibold text-ink">{n(tip.coming)}</span>
              <span className="text-muted">{t.timeline.coming}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded-full bg-decline" />
              <span className="font-semibold text-ink">{n(tip.notComing)}</span>
              <span className="text-muted">{t.timeline.notComing}</span>
            </p>
            <p className="mt-1 text-muted">
              {t.timeline.invited}: <span className="text-ink">{n(tip.invited)}</span>
            </p>
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs text-muted hover:text-ink">{t.timeline.showTable}</summary>
        <div className="mt-2 max-h-60 overflow-auto rounded-lg border border-line">
          <table className="w-full text-xs tabular-nums">
            <thead className="sticky top-0 bg-paper text-muted">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{t.timeline.date}</th>
                <th className="px-3 py-2 text-end font-medium">{t.timeline.invited}</th>
                <th className="px-3 py-2 text-end font-medium">{t.timeline.coming}</th>
                <th className="px-3 py-2 text-end font-medium">{t.timeline.notComing}</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.day} className="border-t border-line">
                  <td className="px-3 py-1.5">{formatShortDate(p.day, locale)}</td>
                  <td className="px-3 py-1.5 text-end">{n(p.invited)}</td>
                  <td className="px-3 py-1.5 text-end">{n(p.coming)}</td>
                  <td className="px-3 py-1.5 text-end">{n(p.notComing)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
