import { Stats } from "@/lib/types";

// Stacked bar showing how the guest list breaks down. Renders an empty track
// when nobody has been invited yet.
export default function RsvpBar({ stats, className = "" }: { stats: Stats; className?: string }) {
  const segments = [
    { value: stats.accepted, color: "bg-accept", label: "coming" },
    { value: stats.declined, color: "bg-decline/70", label: "can't make it" },
    { value: stats.pending, color: "bg-pending/40", label: "waiting" },
    { value: stats.invalid, color: "bg-invalid/30", label: "number issue" },
  ];
  const label = segments.map((s) => `${s.value} ${s.label}`).join(", ");
  return (
    <div className={`flex h-2 w-full overflow-hidden rounded-full bg-line/70 ${className}`} role="img" aria-label={label}>
      {stats.total > 0 &&
        segments.map((s) =>
          s.value > 0 ? <div key={s.label} className={`${s.color} h-full`} style={{ width: `${(s.value / stats.total) * 100}%` }} /> : null
        )}
    </div>
  );
}
