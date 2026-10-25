"use client";

import { useState } from "react";
import type { Lang } from "@/lib/occasions";
import { GuestPass, Invitation, RepliedMessage, SentMessage } from "./fragments";

type Copy = { nameLabel: string; defaultName: string; sliderLabel: string; stages: string[]; clauses: string[] };

// One invitation's journey in four stops, driven by a real range input (drag,
// tap a stage name, or use the arrow keys). The name typed here addresses every
// fragment, the way each guest's invitation is addressed to them.
export default function GuestJourney({ lang, copy, qr }: { lang: Lang; copy: Copy; qr: string }) {
  const [stage, setStage] = useState(0);
  const [name, setName] = useState("");
  const guest = name.trim() || copy.defaultName;
  const last = copy.stages.length - 1;

  const fragments = [
    <Invitation key="card" lang={lang} className="w-[min(100%,22rem)] text-[0.82rem]" />,
    <SentMessage key="sent" lang={lang} name={guest} />,
    <RepliedMessage key="reply" lang={lang} name={guest} />,
    <GuestPass key="pass" lang={lang} name={guest} qr={qr} />,
  ];

  return (
    <div className="grid lg:min-h-[88svh] lg:grid-cols-2">
      {/* The product, in the state the slider names. All four are stacked in one cell and crossfade. */}
      <div className="order-1 grid place-items-center bg-bone px-safe py-14 lg:order-2 lg:py-20">
        <div className="grid w-full place-items-center [&>*]:[grid-area:1/1]">
          {fragments.map((f, i) => (
            <div
              key={i}
              inert={i !== stage}
              aria-hidden={i !== stage}
              className={`grid w-full place-items-center transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none ${
                i === stage ? "visible opacity-100" : "pointer-events-none invisible translate-y-2 opacity-0"
              }`}
            >
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="order-2 flex flex-col justify-between gap-10 bg-ivory px-safe py-14 lg:order-1 lg:py-20">
        <div>
          <h2 id="how-title" aria-live="polite" className="font-editorial text-[clamp(2.5rem,4.6vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.02em] text-balance">
            {copy.clauses[stage]}
          </h2>
          <label className="mt-10 block max-w-sm">
            <span className="block text-[1.0625rem] text-ink-deep">{copy.nameLabel}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder={copy.defaultName}
              autoComplete="off"
              enterKeyHint="done"
              className="mt-2 h-12 w-full bg-bone px-4 text-[1.0625rem] text-ink-deep placeholder:text-ink-soft outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-deep"
            />
          </label>
        </div>

        <div>
          <input
            type="range"
            min={0}
            max={last}
            step={1}
            value={stage}
            onChange={(e) => setStage(Number(e.target.value))}
            aria-label={copy.sliderLabel}
            aria-valuetext={`${copy.stages[stage]}: ${copy.clauses[stage]}`}
            className="journey-range w-full"
            style={{ "--fill": `${(stage / last) * 100}%` } as React.CSSProperties}
          />
          <ol className="mt-4 grid grid-cols-4 gap-2 text-[1.0625rem]">
            {copy.stages.map((s, i) => (
              <li key={s} className={i === 0 ? "text-start" : i === last ? "text-end" : "text-center"}>
                <button
                  type="button"
                  onClick={() => setStage(i)}
                  aria-current={i === stage ? "step" : undefined}
                  className={`press tap-control min-h-11 px-1 ${i === stage ? "font-medium text-ink-deep" : "text-ink-soft hover:text-ink-deep"}`}
                >
                  {s}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
