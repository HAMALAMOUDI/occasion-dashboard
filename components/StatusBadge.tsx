import { GuestStatus } from "@/lib/types";

const STYLES: Record<GuestStatus, { bg: string; text: string; label: string }> = {
  accepted: { bg: "bg-accept-bg", text: "text-accept", label: "Accepted" },
  declined: { bg: "bg-decline-bg", text: "text-decline", label: "Declined" },
  pending: { bg: "bg-pending-bg", text: "text-pending", label: "No response" },
  no_response: { bg: "bg-pending-bg", text: "text-pending", label: "No response" },
  invalid: { bg: "bg-invalid-bg", text: "text-invalid", label: "Invalid number" },
};

export default function StatusBadge({ status }: { status: GuestStatus }) {
  const s = STYLES[status];
  return (
    <span className={`${s.bg} ${s.text} text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap`}>
      {s.label}
    </span>
  );
}
