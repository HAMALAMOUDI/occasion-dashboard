"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import DesignFrame from "@/components/DesignFrame";
import PhoneFrame from "@/components/PhoneFrame";
import { useT } from "@/components/I18nProvider";
import { defaultPaletteIndex, palettesFor, type DesignCategory, type DesignStyle } from "@/lib/designs/catalog";
import { designSrc, pickDesignHref } from "@/lib/designs/urls";

// One design on its public page: the card on a phone, its colours to try, and the way in.
export default function DesignShowcase({
  style,
  category,
  layout,
  title,
  signedIn,
}: {
  style: DesignStyle;
  category: DesignCategory;
  layout: number;
  title: string;
  signedIn: boolean;
}) {
  const t = useT();
  const G = t.gallery;
  const palettes = palettesFor(style, category, layout);
  const [palette, setPalette] = useState(defaultPaletteIndex(style, category, layout));

  return (
    <div className="grid items-start gap-10 md:grid-cols-12">
      <PhoneFrame className="mx-auto w-[min(100%,20rem)] md:col-span-5 md:col-start-2">
        <DesignFrame src={designSrc({ style, category, layout, palette })} title={title} />
      </PhoneFrame>

      <div className="md:col-span-5 md:col-start-8 md:pt-6">
        <p className="text-[0.9375rem] text-ink-soft">{G.colours}</p>
        <div className="mt-3 flex flex-wrap gap-3" role="radiogroup" aria-label={G.colours}>
          {palettes.map((p, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={palette === i}
              aria-label={`${G.colours} ${i + 1}`}
              onClick={() => setPalette(i)}
              className={`tap-control grid h-12 w-12 place-items-center rounded-full ring-offset-2 ring-offset-ivory transition ${
                palette === i ? "ring-2 ring-ink-deep" : "ring-1 ring-ink-deep/15 hover:ring-ink-deep/40"
              }`}
              style={{ background: `linear-gradient(135deg, ${p.bg} 0 50%, ${p.accent} 50% 100%)` }}
            >
              {palette === i && <Check size={16} strokeWidth={3} style={{ color: p.on }} />}
            </button>
          ))}
        </div>

        <Link
          href={pickDesignHref(signedIn, { style, category, layout, palette })}
          className="btn-invite press tap-control mt-10 flex min-h-14 w-full text-[1.0625rem] sm:inline-flex sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-deep"
        >
          <span className="btn-invite-label">{G.use}</span>
          <span className="btn-invite-tab" aria-hidden="true">
            <ArrowRight size={18} className="rtl:rotate-180" />
          </span>
        </Link>
        {!signedIn && <p className="mt-4 max-w-[26rem] text-[0.9375rem] leading-6 text-ink-soft">{G.useHint}</p>}
      </div>
    </div>
  );
}
