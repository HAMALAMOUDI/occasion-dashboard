"use client";

import { Guest } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import { useState } from "react";
import { postJson } from "@/lib/client";

export default function GuestTable({ guests, onChange }: { guests: Guest[]; onChange: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(guestId: string, decision: "accept" | "decline") {
    setBusyId(guestId);
    setError(null);
    const result = await postJson(`/api/guests/${guestId}/respond`, { decision });
    setBusyId(null);
    if (!result.ok) setError(result.error);
    onChange();
  }

  if (guests.length === 0) {
    return <p className="text-sm text-ink/60">No guests yet. Upload a CSV above to send invites.</p>;
  }

  return (
    <>
      {error && <p className="text-xs text-decline mb-2">{error}</p>}
      <div className="border border-line rounded-lg overflow-x-auto">
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
                <td className="px-4 py-2.5 text-ink/60 whitespace-nowrap">{g.phone}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={g.status} />
                  {g.lastError && g.status !== "invalid" && (
                    <p className="text-xs text-decline mt-1" title={g.lastError}>
                      Last send failed
                    </p>
                  )}
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
                    <span className="text-xs text-ink/50 font-mono">{g.barcodeValue}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
