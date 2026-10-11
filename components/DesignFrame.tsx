"use client";

import { useEffect, useRef, useState } from "react";

const CARD_W = 420;
const CARD_H = 760;

// Shows a rendered card page (/api/designs/render or /api/events/[id]/card),
// scaled to fit its container's width. Sandboxed with scripts, forms, popups
// and navigation all disabled (the card's CSP blocks scripts too).
// allow-same-origin is needed for browsers to display it at all, and is safe
// without allow-scripts. Loads lazily so a gallery of 20 stays light.
export default function DesignFrame({ src, title, className = "" }: { src: string; title: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / CARD_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className={`relative w-full overflow-hidden bg-line/40 ${className}`} style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }}>
      {scale > 0 && (
        <iframe
          src={src}
          title={title}
          sandbox="allow-same-origin"
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 border-0"
          style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: "0 0" }}
        />
      )}
    </div>
  );
}

export function designSrc(params: Record<string, string | number | null | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== "") q.set(k, String(v));
  return `/api/designs/render?${q}`;
}

// Short stable hash, used as a ?v= cache-buster when a saved design changes.
export function versionOf(value: unknown) {
  let h = 5381;
  for (const ch of JSON.stringify(value)) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
}
