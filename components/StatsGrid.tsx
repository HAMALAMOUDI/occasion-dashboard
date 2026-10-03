import { Stats } from "@/lib/types";

export default function StatsGrid({ stats }: { stats: Stats }) {
  const cells: { label: string; value: number; bg: string; text: string }[] = [
    { label: "Accepted", value: stats.accepted, bg: "bg-accept-bg", text: "text-accept" },
    { label: "Declined", value: stats.declined, bg: "bg-decline-bg", text: "text-decline" },
    { label: "No response", value: stats.pending, bg: "bg-pending-bg", text: "text-pending" },
    { label: "Invalid number", value: stats.invalid, bg: "bg-invalid-bg", text: "text-invalid" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cells.map((c) => (
        <div key={c.label} className={`${c.bg} rounded-lg px-4 py-3`}>
          <p className={`${c.text} text-xs mb-1`}>{c.label}</p>
          <p className={`${c.text} text-2xl font-serif`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
