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
