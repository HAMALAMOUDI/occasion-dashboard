import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowRight } from "lucide-react";
import GuestJourney from "@/components/landing/GuestJourney";
import HeroClip from "@/components/landing/HeroClip";
import Reveal from "@/components/landing/Reveal";
import { Invitation } from "@/components/landing/fragments";
import LanguageToggle from "@/components/LanguageToggle";
import { currentUser } from "@/lib/auth";
import { CLIP_STYLES } from "@/lib/clips/themes";
import { DESIGN_CATEGORIES, DESIGN_STYLES } from "@/lib/designs/catalog";
import { getLocale, getMessages } from "@/lib/i18n-server";
import { OCCASIONS } from "@/lib/occasions";

export const dynamic = "force-dynamic";

const CONTACT = { email: "hikayati@gmail.com", phone: "+966 55 123 4567", tel: "+966551234567" };
const DESIGN_COUNT = DESIGN_STYLES.length * DESIGN_CATEGORIES.length * 20;

// Found pictures of the world around the occasions (credited in the footer).
// They show Saudi celebration and hospitality, never Hikayati's own customers.
const CREDITS = [
  { title: "حصاد الورد الطائفي في السعودية سنة 2026م", by: "وكالة الأنباء السعودية", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/w/index.php?curid=192752189" },
  { title: "Saudi Ardha in At-Turaif district, Diriyah", by: "Ahad.F", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Saudi_Ardha_(Najdi_Sword_Dance)_in_At-Turaif_district,_Diriyah,_Saudi_Arabia.jpg" },
  { title: "Arabic dallah (coffee pot)", by: "Bluehillies", licence: "CC0", page: "https://commons.wikimedia.org/w/index.php?curid=57948288" },
  { title: "رجل يحصد الورد الطائفي في السعودية سنة 2026م", by: "وكالة الأنباء السعودية", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/w/index.php?curid=192752187" },
  { title: "Henna hands", by: "Izzah Zainab", licence: "CC BY 2.0", page: "https://commons.wikimedia.org/w/index.php?curid=74800224" },
];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: `Hikayati · حكايتي — ${t.landing.heroLine1} ${t.landing.heroLine2}`, description: t.landing.heroSub };
}

const btnSolid =
  "press tap-control min-h-12 items-center justify-center gap-3 bg-ink-deep px-7 text-[1.0625rem] font-medium text-ivory hover:bg-olive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-deep";

function Wordmark({ className = "" }: { className?: string }) {
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

// A captioned photograph; every picture on the page is cropped by its frame, never stretched.
function Photo({ src, alt, ratio, sizes, className = "" }: { src: string; alt: string; ratio: string; sizes: string; className?: string }) {
  return (
    <figure className={className}>
      <div className={`relative overflow-hidden bg-bone ${ratio}`}>
        <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
      </div>
      <figcaption className="mt-3 max-w-[34ch] text-[0.875rem] leading-6 text-ink-soft">{alt}</figcaption>
    </figure>
  );
}

export default async function LandingPage() {
  const [t, locale, user] = await Promise.all([getMessages(), getLocale(), currentUser()]);
  const L = t.landing;
  const createHref = user ? "/events/new" : "/login?next=/events/new";
  // A real, scannable QR for the sample guest pass.
  const qr = await QRCode.toString("HIKAYATI-SAMPLE-PASS", { type: "svg", margin: 0, color: { dark: "#24241f", light: "#0000" } });
  const nav = [
    { href: "#how", label: L.nav.how },
    { href: "#occasions", label: L.nav.occasions },
    { href: "#contact", label: L.nav.contact },
  ];

  return (
    <>
      {/* ---------- Header: wordmark, three links, one action ---------- */}
      <header className="sticky top-0 z-40 bg-ivory pt-[env(safe-area-inset-top,0px)]">
        <div className="flex h-[4.5rem] items-center justify-between gap-6 px-safe">
          <a href="#home" aria-label="Hikayati · حكايتي" className="tap-control">
            <Wordmark />
          </a>
          <nav className="hidden items-center gap-8 whitespace-nowrap text-[1.0625rem] text-ink-soft lg:flex">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="tap-control transition-colors hover:text-ink-deep active:text-ink-deep">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4 whitespace-nowrap">
            <LanguageToggle className="press tap-control min-h-10 border-transparent bg-bone text-[0.875rem] text-ink-deep active:text-ink" />
            <Link href={user ? "/events" : "/login"} className="tap-control hidden text-[1.0625rem] text-ink-soft hover:text-ink-deep active:text-ink-deep md:inline">
              {user ? L.myEvents : L.signIn}
            </Link>
            <Link href={createHref} className={`${btnSolid} hidden min-h-10 px-5 sm:inline-flex`}>
              {L.headerCta}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ---------- Hero: the sentence, with the animated invitation set inside it ---------- */}
        <section id="home" className="scroll-mt-20 px-safe pb-[clamp(3rem,5vw,5rem)] pt-[clamp(4rem,12svh,9rem)]">
          <h1 className="hero-sentence font-editorial text-[clamp(3.25rem,10.5vw,11.5rem)] font-medium leading-[0.95] tracking-[-0.035em] rtl:leading-[1.15] rtl:tracking-normal">
            <span className="block">
              {L.heroLine1}
              <span className="hero-slot shutter" aria-hidden="true">
                <HeroClip lang={locale} label={L.heroClipLabel} />
              </span>
            </span>
            <span className="block">{L.heroLine2}</span>
          </h1>
          <div className="mt-10 grid items-end gap-8 md:mt-12 md:grid-cols-12">
            <p className="text-[1.25rem] leading-[1.55] text-ink-deep md:col-span-7 lg:col-span-6">{L.heroSub}</p>
            <div className="md:col-span-5 md:justify-self-end lg:col-span-6">
              <Link href={createHref} className={`${btnSolid} flex w-full sm:inline-flex sm:w-auto`}>
                {L.create} <ArrowRight size={18} className="rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- About: the statement holds still on the left while its world passes on the right ---------- */}
        <section aria-labelledby="about-title" className="grid gap-x-6 gap-y-16 px-safe pb-[clamp(7rem,14vw,12rem)] pt-[clamp(4rem,8vw,7rem)] lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(4.5rem+12svh)]">
              <Reveal>
                <h2 id="about-title" className="font-editorial text-[clamp(2.5rem,4.6vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.02em]">
                  {L.aboutTitle}
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="mt-8 max-w-[34rem] text-[1.25rem] leading-[1.6] text-ink-deep">{L.aboutBody}</p>
              </Reveal>
            </div>
          </div>
          <div className="grid gap-y-[clamp(3rem,5vw,4rem)] lg:col-span-7 lg:col-start-6 lg:grid-cols-7 lg:gap-x-6">
            <Reveal className="lg:col-span-4">
              <Photo src="/landing/taif-rose-harvest.jpg" alt={L.photos.harvest} ratio="aspect-[4/5]" sizes="(min-width: 1024px) 30vw, 100vw" />
            </Reveal>
            <Reveal delay={0.08} className="w-[70%] justify-self-end lg:col-span-3 lg:w-full lg:self-end">
              <Photo src="/landing/dallah.jpg" alt={L.photos.dallah} ratio="aspect-square" sizes="(min-width: 1024px) 22vw, 70vw" />
            </Reveal>
            <Reveal className="lg:col-span-7">
              <Photo src="/landing/ardha-turaif.jpg" alt={L.photos.ardha} ratio="aspect-[16/10]" sizes="(min-width: 1024px) 55vw, 100vw" />
            </Reveal>
          </div>
        </section>

        {/* ---------- Showcase: the card in front of its own description ---------- */}
        <section aria-labelledby="card-title" className="relative overflow-hidden bg-bone px-safe py-[clamp(7rem,14vw,12rem)]">
          <div className="relative">
            <div className="whitespace-nowrap font-editorial text-[clamp(2.875rem,9vw,9.5rem)] font-medium leading-[0.92] tracking-[-0.035em] rtl:leading-[1.2] rtl:tracking-normal">
              <Reveal>
                <p className="text-ink-soft">{L.showcaseLines[0]}</p>
              </Reveal>
              <Reveal delay={0.08}>
                <h2 id="card-title" className="text-ink-deep">
                  {L.showcaseLines[1]}
                </h2>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="text-ink-soft">{L.showcaseLines[2]}</p>
              </Reveal>
            </div>
            <div className="mt-14 grid gap-12 md:grid-cols-12 md:items-start">
              <Reveal className="md:col-span-5 md:col-start-1">
                <Invitation lang={locale} className="card-tilt mx-auto w-[min(100%,26rem)] text-[clamp(0.85rem,1.1vw,1rem)]" />
              </Reveal>
              <Reveal delay={0.12} className="space-y-6 text-[1.25rem] leading-[1.6] text-ink-deep md:col-span-5 md:col-start-8 md:pt-10">
                <p>{L.showcaseFact}</p>
                <p>{L.showcaseCounts(DESIGN_COUNT, CLIP_STYLES.length)}</p>
                <Image src="/landing/taif-rose-sack.jpg" alt="" width={1920} height={1279} sizes="(min-width: 768px) 40vw, 100vw" className="mt-4 aspect-[3/2] w-full object-cover" />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- How it works: one invitation's journey, addressed to the name typed in ---------- */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-[4.5rem]">
          <GuestJourney lang={locale} copy={L.journey} qr={qr} />
        </section>

        {/* ---------- Occasions: statement, then the table pushed right ---------- */}
        <section id="occasions" aria-labelledby="occasions-title" className="scroll-mt-20 px-safe py-[clamp(7rem,14vw,12rem)]">
          <Reveal>
            <h2 id="occasions-title" className="font-editorial text-[clamp(2.5rem,4.6vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.02em] md:ps-[3vw]">
              {L.occasionsTitle}
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-x-6 gap-y-14 md:mt-24 md:grid-cols-12">
            <Reveal className="order-2 self-end md:order-1 md:col-span-4">
              <Photo src="/landing/henna-hands.jpg" alt={L.photos.henna} ratio="aspect-[4/5]" sizes="(min-width: 768px) 30vw, 70vw" className="ms-auto w-[70%] md:ms-0 md:w-full" />
            </Reveal>
            <p className="order-1 hidden text-[0.875rem] text-ink-soft md:order-2 md:col-span-2 md:col-start-6 md:block md:text-end">{L.occasionsTable}</p>
            <Reveal delay={0.08} as="div" className="order-1 md:order-3 md:col-span-5 md:col-start-8">
              <ul className="text-[1.0625rem]">
                {OCCASIONS.map((o, i) => (
                  <li key={o.id} className={`flex items-baseline justify-between gap-6 py-[0.8rem] ${i > 0 && i % 4 === 0 ? "mt-6" : ""}`}>
                    <span className="text-ink-deep">{o.label[locale]}</span>
                    <span className="text-end text-ink-soft">{o.cardLine[locale]}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ---------- Closing: the sentence has a blank, and the blank is the form ---------- */}
        <section aria-labelledby="begin-title" className="bg-bone px-safe py-[clamp(7rem,14vw,12rem)]">
          <form action="/events/new" method="get" className="font-editorial text-[clamp(2.5rem,6vw,6.25rem)] font-medium leading-[1.15] tracking-[-0.02em] rtl:tracking-normal">
            <h2 id="begin-title" className="flex flex-wrap items-baseline gap-x-[0.3em] gap-y-[0.15em]">
              <label htmlFor="occasion-name">{L.closingLead}</label>
              <input
                id="occasion-name"
                name="name"
                maxLength={120}
                autoComplete="off"
                enterKeyHint="go"
                placeholder={L.closingPlaceholder}
                className="h-[1.15em] w-full min-w-0 bg-ivory px-[0.25em] text-[1em] tracking-[inherit] text-ink-deep outline-none placeholder:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-deep sm:w-[7.5em]"
              />
              <span>{L.closingAnd}</span>
              <button type="submit" className="press tap-control bg-ink-deep px-[0.25em] leading-[1.15] text-ivory hover:bg-olive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-deep">
                {L.closingButton}
              </button>
            </h2>
          </form>
          <p className="mt-8 max-w-[40rem] text-[1.0625rem] leading-[1.6] text-ink-soft">{L.closingNote}</p>
        </section>
      </main>

      {/* ---------- Footer: the way to get in touch is the headline ---------- */}
      <footer id="contact" className="flex min-h-[90svh] scroll-mt-[4.5rem] flex-col justify-between gap-16 bg-olive px-safe pb-[max(2rem,env(safe-area-inset-bottom,0px))] pt-10 text-ivory">
        <div className="flex flex-wrap items-start justify-between gap-8 text-[0.875rem] leading-6">
          <div className="grid gap-x-12 gap-y-2 sm:grid-cols-[auto_auto]">
            <Wordmark className="[&_span:last-child]:text-ivory" />
            <p className="max-w-[28rem]">{L.footerLine}</p>
            <p className="sm:col-start-2">{L.locationValue}</p>
          </div>
          <a href="#home" className="tap-control underline underline-offset-4 hover:no-underline">
            {L.backToTop}
          </a>
        </div>

        <div>
          <h2 className="sr-only">{L.nav.contact}</h2>
          <a
            href={`mailto:${CONTACT.email}`}
            dir="ltr"
            className="block font-editorial text-[13vw] font-medium rtl:text-right leading-[0.95] tracking-[-0.03em] hover:text-bone md:text-[11.5vw]"
          >
            hikayati<wbr />@gmail.com
          </a>
          <a href={`tel:${CONTACT.tel}`} dir="ltr" className="mt-6 inline-block text-[1.25rem] underline underline-offset-4 hover:no-underline">
            {CONTACT.phone}
          </a>
        </div>

        <div className="grid gap-6 text-[0.875rem] leading-6 md:grid-cols-[auto_1fr_auto] md:items-end md:gap-12">
          <nav className="flex gap-6">
            {nav.slice(0, 2).map((n) => (
              <a key={n.href} href={n.href} className="tap-control underline-offset-4 hover:underline">
                {n.label}
              </a>
            ))}
            <Link href={user ? "/events" : "/login"} className="tap-control underline-offset-4 hover:underline">
              {user ? L.myEvents : L.signIn}
            </Link>
          </nav>
          <p className="max-w-[60rem]">
            {L.picturesCredit}:{" "}
            {CREDITS.map((c, i) => (
              <span key={c.page}>
                <a href={c.page} className="underline underline-offset-2 hover:no-underline">
                  <bdi>{c.title}</bdi>
                </a>{" "}
                <bdi>{c.by}</bdi>, {c.licence}
                {i < CREDITS.length - 1 ? "; " : "."}
              </span>
            ))}
          </p>
          <p>{L.rights(new Date().getFullYear())}</p>
        </div>
      </footer>
    </>
  );
}
