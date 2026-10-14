"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "../I18nProvider";

// Switches the Designs section between printed-style cards and animated invitations,
// keeping the ?event= the organizer is designing for.
export default function DesignTabs() {
  const t = useT();
  const path = usePathname();
  const event = useSearchParams().get("event");
  const q = event ? `?event=${event}` : "";
  const tabs = [
    { href: `/designs${q}`, label: t.clips.tabCards, active: path === "/designs" },
    { href: `/designs/animated${q}`, label: t.clips.tabAnimated, active: path.startsWith("/designs/animated") },
  ];
  return (
    <div className="mb-6 inline-flex rounded-full border border-line bg-paper p-1" role="tablist">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          role="tab"
          aria-selected={tab.active}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${tab.active ? "bg-surface text-pine shadow-sm" : "text-muted hover:text-ink"}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
