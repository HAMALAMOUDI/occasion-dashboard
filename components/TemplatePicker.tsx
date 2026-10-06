"use client";

import { CardTemplate } from "@/lib/types";
import { Check } from "lucide-react";
import { useLocale, useT } from "./I18nProvider";

export default function TemplatePicker({
  templates,
  occasionType,
  selectedId,
  onSelect,
}: {
  templates: CardTemplate[];
  occasionType: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const relevant = templates.filter((tpl) => tpl.occasionType === occasionType);

  if (relevant.length === 0) {
    return <p className="text-sm text-muted">{t.newEvent.noDesigns}</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="radiogroup" aria-label={t.newEvent.designs}>
      {relevant.map((tpl) => {
        const selected = selectedId === tpl.id;
        return (
          <button
            type="button"
            role="radio"
            aria-checked={selected}
            key={tpl.id}
            onClick={() => onSelect(tpl.id)}
            className={`group relative overflow-hidden rounded-2xl border bg-surface text-start transition ${
              selected ? "border-pine ring-4 ring-pine/10" : "border-line hover:border-ink/25"
            }`}
          >
            <div className="relative h-24" style={{ backgroundColor: tpl.previewColor }}>
              <div className="absolute inset-2 rounded-md border border-white/25" />
              {selected && (
                <span className="absolute end-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-pine shadow">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
            </div>
            <p className="px-3 py-2.5 text-sm font-medium">{locale === "ar" ? tpl.nameAr : tpl.name}</p>
          </button>
        );
      })}
    </div>
  );
}
