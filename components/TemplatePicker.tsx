"use client";

import { CardTemplate } from "@/lib/types";

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
    return <p className="text-sm text-ink/60">No card templates for this occasion type yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {relevant.map((t) => (
        <button
          type="button"
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`rounded-lg overflow-hidden border text-left transition ${
            selectedId === t.id ? "border-brass ring-1 ring-brass" : "border-line hover:border-ink/30"
          }`}
        >
          <div className="h-20" style={{ backgroundColor: t.previewColor }} />
          <div className="px-3 py-2">
            <p className="text-sm">{t.name}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
