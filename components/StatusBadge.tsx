import { GuestStatus } from "@/lib/types";

export const STATUS_STYLES: Record<GuestStatus, { bg: string; text: string; dot: string; label: string }> = {
  accepted: { bg: "bg-accept-bg", text: "text-accept", dot: "bg-accept", label: "Coming" },
  declined: { bg: "bg-decline-bg", text: "text-decline", dot: "bg-decline", label: "Can't make it" },
  pending: { bg: "bg-pending-bg", text: "text-pending", dot: "bg-pending", label: "Not sent yet" },
  no_response: { bg: "bg-pending-bg", text: "text-pending", dot: "bg-pending", label: "Waiting to hear" },
  invalid: { bg: "bg-invalid-bg", text: "text-invalid", dot: "bg-invalid", label: "Number issue" },
};

export default function StatusBadge({ status }: { status: GuestStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`${s.bg} ${s.text} inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
