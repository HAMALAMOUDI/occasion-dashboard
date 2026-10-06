import { Stats } from "@/lib/types";

// Stacked bar showing how the guest list breaks down. Renders an empty track
// when nobody has been invited yet. `label` is the accessible description.
export default function RsvpBar({ stats, label, className = "" }: { stats: Stats; label: string; className?: string }) {
  const segments = [
    { value: stats.accepted, color: "bg-accept" },
    { value: stats.declined, color: "bg-decline/70" },
    { value: stats.pending, color: "bg-pending/40" },
    { value: stats.invalid, color: "bg-invalid/30" },
  ];
  return (
    <div className={`flex h-2 w-full overflow-hidden rounded-full bg-line/70 ${className}`} role="img" aria-label={label}>
      {stats.total > 0 &&
        segments.map((s, i) =>
          s.value > 0 ? <div key={i} className={`${s.color} h-full`} style={{ width: `${(s.value / stats.total) * 100}%` }} /> : null
        )}
    </div>
  );
}
