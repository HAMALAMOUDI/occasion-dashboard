"use client";

import { Guest } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import { useState } from "react";

export default function GuestTable({ guests, onChange }: { guests: Guest[]; onChange: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function respond(guestId: string, decision: "accept" | "decline") {
    setBusyId(guestId);
    await fetch(`/api/guests/${guestId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setBusyId(null);
    onChange();
  }

  if (guests.length === 0) {
    return <p className="text-sm text-ink/60">No guests yet. Upload a CSV above to send invites.</p>;
  }

  return (
    <div className="border border-line rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-line/30 text-left">
          <tr>
            <th className="px-4 py-2 font-medium">Guest</th>
            <th className="px-4 py-2 font-medium">Phone</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium text-right">Demo actions</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((g) => (
            <tr key={g.id} className="border-t border-line">
              <td className="px-4 py-2.5">{g.name}</td>
              <td className="px-4 py-2.5 text-ink/60">{g.phone}</td>
              <td className="px-4 py-2.5">
                <StatusBadge status={g.status} />
              </td>
              <td className="px-4 py-2.5 text-right">
                {(g.status === "pending" || g.status === "no_response") && (
                  <div className="flex gap-2 justify-end">
                    <button
                      disabled={busyId === g.id}
                      onClick={() => respond(g.id, "accept")}
                      className="text-xs px-2.5 py-1 rounded-md border border-line hover:bg-accept-bg hover:text-accept disabled:opacity-50"
                    >
                      Simulate accept
                    </button>
                    <button
                      disabled={busyId === g.id}
                      onClick={() => respond(g.id, "decline")}
                      className="text-xs px-2.5 py-1 rounded-md border border-line hover:bg-decline-bg hover:text-decline disabled:opacity-50"
                    >
                      Simulate decline
                    </button>
                  </div>
                )}
                {g.status === "accepted" && g.barcodeValue && (
                  <span className="text-xs text-ink/50">{g.barcodeValue}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
