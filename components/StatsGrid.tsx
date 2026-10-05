import { Stats } from "@/lib/types";
import { CircleCheck, CircleX, Clock, PhoneOff } from "lucide-react";

export default function StatsGrid({ stats }: { stats: Stats }) {
  const pct = (n: number) => (stats.total ? Math.round((n / stats.total) * 100) : 0);
  const cells = [
    { label: "Coming", value: stats.accepted, icon: CircleCheck, bg: "bg-accept-bg", text: "text-accept" },
    { label: "Can't make it", value: stats.declined, icon: CircleX, bg: "bg-decline-bg", text: "text-decline" },
    { label: "Waiting to hear", value: stats.pending, icon: Clock, bg: "bg-pending-bg", text: "text-pending" },
    { label: "Number issue", value: stats.invalid, icon: PhoneOff, bg: "bg-invalid-bg", text: "text-invalid" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cells.map(({ label, value, icon: Icon, bg, text }) => (
        <div key={label} className="card p-4">
          <div className="flex items-center justify-between">
            <span className={`grid h-8 w-8 place-items-center rounded-full ${bg} ${text}`}>
              <Icon size={16} />
            </span>
            {stats.total > 0 && <span className="text-xs text-muted">{pct(value)}%</span>}
          </div>
          <p className="font-serif text-3xl mt-3">{value}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}
