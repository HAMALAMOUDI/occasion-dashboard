"use client";

import { CardTemplate } from "@/lib/types";
import { Check } from "lucide-react";

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
  const relevant = templates.filter((t) => t.occasionType === occasionType);

  if (relevant.length === 0) {
    return <p className="text-sm text-muted">No card designs for this occasion yet — we&apos;ll use our classic design.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Card design">
      {relevant.map((t) => {
        const selected = selectedId === t.id;
        return (
          <button
            type="button"
            role="radio"
            aria-checked={selected}
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`group relative overflow-hidden rounded-2xl border bg-surface text-left transition ${
              selected ? "border-pine ring-4 ring-pine/10" : "border-line hover:border-ink/25"
            }`}
          >
            <div className="relative h-24" style={{ backgroundColor: t.previewColor }}>
              <div className="absolute inset-2 rounded-md border border-white/25" />
              {selected && (
                <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-pine shadow">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
            </div>
            <p className="px-3 py-2.5 text-sm font-medium">{t.name}</p>
          </button>
        );
      })}
    </div>
  );
}
