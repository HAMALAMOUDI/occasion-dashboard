"use client";

import { useState } from "react";
import SceneCanvas from "@/components/SceneCanvas";
import Reveal from "./Reveal";
import { sceneStyleFor } from "@/lib/clips/themes";
import type { OccasionType } from "@/lib/occasions";

type Row = { id: OccasionType; label: string; line: string };

// The occasions table, with the photo beside it. Pointing at (or tapping) an
// occasion plays that occasion's animated scene over the photo; leaving the
// table brings the photo back. Decorative: the table reads the same without it.
export default function OccasionShowcase({ rows, photo, tableNote }: { rows: Row[]; photo: React.ReactNode; tableNote: string }) {
  const [active, setActive] = useState<OccasionType | null>(null);
  // Keep the last scene mounted while it fades out, so it doesn't vanish mid-fade.
  const [shown, setShown] = useState<OccasionType | null>(null);
  const show = (id: OccasionType) => {
    setActive(id);
    setShown(id);
  };

  return (
    <div className="mt-16 grid gap-x-6 gap-y-14 md:mt-24 md:grid-cols-12" onPointerLeave={() => setActive(null)}>
      <div className="order-2 self-end md:order-1 md:col-span-4">
        <div className="relative">
          {photo}
          {shown && (
            // Sits over the photo's frame only (the caption stays readable beneath).
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 ms-auto aspect-[4/5] w-[70%] overflow-hidden transition-opacity duration-500 motion-reduce:transition-none md:ms-0 md:w-full ${
                active ? "opacity-100" : "opacity-0"
              }`}
            >
              <SceneCanvas key={shown} style={sceneStyleFor(shown)} occasion={shown} />
            </div>
          )}
        </div>
      </div>
      <p className="order-1 hidden text-[0.875rem] text-ink-soft md:order-2 md:col-span-2 md:col-start-6 md:block md:text-end">{tableNote}</p>
      <Reveal delay={0.08} className="order-1 md:order-3 md:col-span-5 md:col-start-8">
        <ul className="text-[1.0625rem]">
          {rows.map((o, i) => (
            <li
              key={o.id}
              onPointerEnter={() => show(o.id)}
              onClick={() => (active === o.id ? setActive(null) : show(o.id))}
              className={`flex cursor-default items-baseline justify-between gap-6 py-[0.8rem] transition-colors ${i > 0 && i % 4 === 0 ? "mt-6" : ""} ${
                active === o.id ? "text-ink-deep" : ""
              }`}
            >
              <span className={`text-ink-deep ${active === o.id ? "underline decoration-champagne decoration-2 underline-offset-[6px]" : ""}`}>{o.label}</span>
              <span className="text-end text-ink-soft">{o.line}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
