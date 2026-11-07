import Link from "next/link";
import { ArrowRight } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import type { Messages } from "@/lib/messages";

const btnInvite =
  "btn-invite press tap-control min-h-12 text-[1.0625rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-deep";

// The "Create invitation" button: label, then a gold tab with the arrow.
export function InviteButton({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={`${btnInvite} ${className}`}>
      <span className="btn-invite-label">{children}</span>
      <span className="btn-invite-tab" aria-hidden="true">
        <ArrowRight size={18} className="rtl:rotate-180" />
      </span>
    </Link>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-baseline gap-2.5 ${className}`}>
      <span className="font-editorial text-xl font-medium tracking-[0.2em]" lang="en">
        HIKAYATI
      </span>
      <span className="font-[family-name:var(--font-ruqaa)] text-lg text-gold-ink" lang="ar">
        حكايتي
      </span>
    </span>
  );
}

// The public site's links. Section links point at the landing page, so they work from any page.
export function siteLinks(L: Messages["landing"]) {
  return [
    { href: "/gallery", label: L.nav.designs },
    { href: "/#how", label: L.nav.how },
    { href: "/#occasions", label: L.nav.occasions },
    { href: "/#pricing", label: L.nav.pricing },
    { href: "/#faq", label: L.nav.faq },
  ];
}

// Policies and the longer pages, listed in every footer.
export function footerGroups(L: Messages["landing"]) {
  const F = L.footer;
  return [
    {
      title: F.explore,
      links: [
        { href: "/about", label: F.about },
        { href: "/digital-invitations", label: F.digital },
        { href: "/guest-list-management", label: F.guestList },
        { href: "/invitations-riyadh", label: F.riyadh },
        { href: "/invitations-jeddah", label: F.jeddah },
        { href: "/guides", label: F.guides },
      ],
    },
    {
      title: F.policies,
      links: [
        { href: "/privacy", label: F.privacy },
        { href: "/terms", label: F.terms },
        { href: "/refund", label: F.refund },
      ],
    },
  ];
}

export function FooterGroups({ L }: { L: Messages["landing"] }) {
  return (
    <div className="grid grid-cols-2 gap-8 text-[0.9375rem] leading-7 sm:flex sm:gap-16">
      {footerGroups(L).map((g) => (
        <nav key={g.title} aria-label={g.title}>
          <h2 className="text-[0.8125rem] uppercase tracking-[0.14em] text-champagne rtl:tracking-normal">{g.title}</h2>
          <ul className="mt-2">
            {g.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="tap-control underline-offset-4 hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  );
}

export function createHref(signedIn: boolean) {
  return signedIn ? "/events/new" : "/login?next=/events/new";
}

// Wordmark, the site links, then language, sign-in and the one action.
export function SiteHeader({ L, signedIn, current }: { L: Messages["landing"]; signedIn: boolean; current?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-deep/8 bg-ivory/85 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
      <div className="flex h-[4.5rem] items-center justify-between gap-6 px-safe">
        <Link href="/" aria-label="Hikayati · حكايتي" className="tap-control">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-8 whitespace-nowrap text-[1.0625rem] text-ink-soft lg:flex">
          {siteLinks(L).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={current === n.href ? "page" : undefined}
              className="tap-control transition-colors hover:text-ink-deep active:text-ink-deep aria-[current=page]:text-ink-deep aria-[current=page]:underline aria-[current=page]:decoration-champagne aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-[6px]"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 whitespace-nowrap">
          <LanguageToggle className="press tap-control min-h-10 rounded-full border-ink-deep/15 bg-white/70 text-[0.875rem] text-ink-deep active:text-ink" />
          <Link href={signedIn ? "/events" : "/login"} className="tap-control hidden text-[1.0625rem] text-ink-soft hover:text-ink-deep active:text-ink-deep md:inline">
            {signedIn ? L.myEvents : L.signIn}
          </Link>
          <InviteButton href={createHref(signedIn)} className="btn-invite-sm hidden min-h-11 sm:inline-flex">
            {L.headerCta}
          </InviteButton>
        </div>
      </div>
      {/* Below lg the links sit in a scrolling row, so Designs is never more than a tap away. */}
      <nav className="flex gap-6 overflow-x-auto whitespace-nowrap px-safe pb-3 text-[0.9375rem] text-ink-soft [scrollbar-width:none] lg:hidden">
        {siteLinks(L).map((n) => (
          <Link key={n.href} href={n.href} aria-current={current === n.href ? "page" : undefined} className="tap-control hover:text-ink-deep aria-[current=page]:text-ink-deep">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

// A short footer for the pages beyond the landing (the landing keeps its large contact footer).
export function SiteFooter({ L, signedIn }: { L: Messages["landing"]; signedIn: boolean }) {
  return (
    <footer className="bg-pine-deep px-safe pb-[max(2rem,env(safe-area-inset-bottom,0px))] pt-12 text-ivory">
      <div className="flex flex-wrap items-start justify-between gap-8 text-[0.9375rem] leading-6">
        <div className="space-y-2">
          <Wordmark className="[&_span:last-child]:text-champagne" />
          <p className="max-w-[28rem] text-ivory/75">{L.footerLine}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {siteLinks(L).map((n) => (
            <Link key={n.href} href={n.href} className="tap-control underline-offset-4 hover:underline">
              {n.label}
            </Link>
          ))}
          <Link href="/#contact" className="tap-control underline-offset-4 hover:underline">
            {L.nav.contact}
          </Link>
          <Link href={signedIn ? "/events" : "/login"} className="tap-control underline-offset-4 hover:underline">
            {signedIn ? L.myEvents : L.signIn}
          </Link>
        </nav>
      </div>
      <div className="mt-10">
        <FooterGroups L={L} />
      </div>
      <p className="mt-10 text-[0.875rem] text-ivory/60">{L.rights(new Date().getFullYear())}</p>
    </footer>
  );
}
