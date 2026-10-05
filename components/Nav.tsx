"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarHeart, LogOut, Plus, ReceiptText, ShieldCheck } from "lucide-react";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Events", icon: CalendarHeart, match: (p: string) => p === "/" || (p.startsWith("/events/") && p !== "/events/new") },
  { href: "/events/new", label: "New event", icon: Plus, match: (p: string) => p === "/events/new" },
  { href: "/billing", label: "Billing", icon: ReceiptText, match: (p: string) => p.startsWith("/billing") },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-pine text-white font-serif text-lg">O</span>
      <span className="font-serif text-xl">Occasion</span>
    </Link>
  );
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    // Drop cached signed-in pages so "back" can't show them.
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      disabled={busy}
      className={compact ? "grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-line/50 hover:text-ink" : "text-muted hover:text-ink"}
      aria-label="Sign out"
      title="Sign out"
    >
      <LogOut size={compact ? 18 : 16} />
    </button>
  );
}

export default function Nav({ phone, isAdmin }: { phone: string; isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-line bg-surface/60 px-5 py-7 sticky top-0 h-screen">
        <Logo />
        <nav className="mt-10 flex flex-col gap-1 text-sm">
          {LINKS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition ${
                  active ? "bg-pine-soft text-pine" : "text-muted hover:bg-paper hover:text-ink"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-brass-soft p-4 text-xs leading-relaxed text-ink/80">
          <p className="font-semibold text-ink mb-1">Invites go out on WhatsApp</p>
          Guests reply with one tap, and get their entry pass instantly.
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-4">
          <div className="min-w-0">
            <p className="text-[11px] text-muted">Signed in as</p>
            <p className="text-sm font-medium tabular-nums truncate">{phone}</p>
            {isAdmin && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-pine">
                <ShieldCheck size={12} /> Admin — sees all events
              </p>
            )}
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur">
        <Logo />
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted tabular-nums">{phone}</span>
          <SignOutButton compact />
        </div>
      </header>

      {/* Mobile tab bar */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {LINKS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active ? "text-pine" : "text-muted"}`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
