import { Stats } from "@/lib/types";

// Stacked bar showing how the guest list breaks down. Renders an empty track
// when nobody has been invited yet. `label` is the accessible description.
// Pass the height in `className` (defaults to h-2) so it never fights a second h-*.
export default function RsvpBar({ stats, label, className = "h-2" }: { stats: Stats; label: string; className?: string }) {
  const segments = [
    { value: stats.accepted, color: "bg-accept" },
    { value: stats.declined, color: "bg-decline/70" },
    { value: stats.pending, color: "bg-pending/45" },
    { value: stats.invalid, color: "bg-invalid/35" },
  ];
  return (
    // A hairline gap between segments keeps neighbouring shares apart; each
    // share grows in proportion but never shrinks below a visible sliver,
    // so one declined guest out of 2,000 still shows.
    <div className={`flex w-full gap-px overflow-hidden rounded-full bg-line/70 ${className}`} role="img" aria-label={label}>
      {stats.total > 0 &&
        segments.map((s, i) =>
          s.value > 0 ? (
            <div
              key={i}
              className={`${s.color} h-full min-w-1 basis-0 transition-[flex-grow] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none`}
              style={{ flexGrow: s.value }}
            />
          ) : null,
        )}
    </div>
  );
}
