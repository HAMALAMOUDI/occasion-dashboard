"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarHeart, LogOut, Plus, ReceiptText, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useT } from "./I18nProvider";
import LanguageToggle from "./LanguageToggle";

const LINKS = [
  { href: "/", key: "events", icon: CalendarHeart, match: (p: string) => p === "/" || (p.startsWith("/events/") && p !== "/events/new") },
  { href: "/events/new", key: "newEvent", icon: Plus, match: (p: string) => p === "/events/new" },
  { href: "/billing", key: "billing", icon: ReceiptText, match: (p: string) => p.startsWith("/billing") },
] as const;

export function Logo() {
  const t = useT();
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-pine text-white font-serif text-lg">{t.brand.initial}</span>
      <span className="font-serif text-xl">{t.brand.name}</span>
    </Link>
  );
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  const t = useT();
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
      aria-label={t.nav.signOut}
      title={t.nav.signOut}
    >
      <LogOut size={compact ? 18 : 16} className="rtl:-scale-x-100" />
    </button>
  );
}

export default function Nav({ phone, isAdmin }: { phone: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const t = useT();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-e border-line bg-surface/60 px-5 py-7 sticky top-0 h-screen">
        <Logo />
        <nav className="mt-10 flex flex-col gap-1 text-sm">
          {LINKS.map(({ href, key, icon: Icon, match }) => {
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
                {t.nav[key]}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-brass-soft p-4 text-xs leading-relaxed text-ink/80">
          <p className="font-semibold text-ink mb-1">{t.nav.promoTitle}</p>
          {t.nav.promoBody}
        </div>
        <LanguageToggle className="mt-4 self-start" />
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-4">
          <div className="min-w-0">
            <p className="text-[11px] text-muted">{t.nav.signedInAs}</p>
            <p className="text-sm font-medium tabular-nums truncate" dir="ltr">
              {phone}
            </p>
            {isAdmin && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-pine">
                <ShieldCheck size={12} /> {t.nav.admin}
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
          <LanguageToggle className="me-1 px-2.5" />
          <SignOutButton compact />
        </div>
      </header>

      {/* Mobile tab bar */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {LINKS.map(({ href, key, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active ? "text-pine" : "text-muted"}`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              {t.nav[key]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
