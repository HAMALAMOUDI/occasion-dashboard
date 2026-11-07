import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import GuestJourney from "@/components/landing/GuestJourney";
import HeroClip from "@/components/landing/HeroClip";
import OccasionShowcase from "@/components/landing/OccasionShowcase";
import Reveal from "@/components/landing/Reveal";
import { Invitation } from "@/components/landing/fragments";
import DesignFrame from "@/components/DesignFrame";
import PhoneFrame from "@/components/PhoneFrame";
import { FooterGroups, InviteButton, SiteHeader, Wordmark, createHref as createLink, siteLinks } from "@/components/landing/SiteChrome";
import { Check, Star } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CLIP_STYLES } from "@/lib/clips/themes";
import { DESIGN_COUNT, LAYOUT_NAMES, type DesignCategory, type DesignStyle } from "@/lib/designs/catalog";
import { designSrc, galleryPath } from "@/lib/designs/urls";
import { getLocale, getMessages } from "@/lib/i18n-server";
import { OCCASIONS } from "@/lib/occasions";
import { CONTACT_EMAIL, PLANS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const CONTACT = { email: CONTACT_EMAIL, phone: "+966 55 123 4567", tel: "+966551234567" };
// Found pictures of the world around the occasions (credited in the footer).
// They show Saudi celebration and hospitality, never Hikayati's own customers.
const CREDITS = [
  { title: "حصاد الورد الطائفي في السعودية سنة 2026م", by: "وكالة الأنباء السعودية", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/w/index.php?curid=192752189" },
  { title: "Saudi Ardha in At-Turaif district, Diriyah", by: "Ahad.F", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Saudi_Ardha_(Najdi_Sword_Dance)_in_At-Turaif_district,_Diriyah,_Saudi_Arabia.jpg" },
  { title: "Arabic dallah (coffee pot)", by: "Bluehillies", licence: "CC0", page: "https://commons.wikimedia.org/w/index.php?curid=57948288" },
  { title: "رجل يحصد الورد الطائفي في السعودية سنة 2026م", by: "وكالة الأنباء السعودية", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/w/index.php?curid=192752187" },
  { title: "Henna hands", by: "Izzah Zainab", licence: "CC BY 2.0", page: "https://commons.wikimedia.org/w/index.php?curid=74800224" },
];

// The live count of invitations shows only once it says something.
const SENT_THRESHOLD = 100;

// One card from each style, across occasions, for the landing's design strip.
const FEATURED: { style: DesignStyle; category: DesignCategory; layout: number }[] = [
  { style: "signature", category: "wedding", layout: 1 },
  { style: "classic", category: "engagement", layout: 3 },
  { style: "modern", category: "birthday", layout: 6 },
  { style: "signature", category: "ramadan", layout: 7 },
];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: `Hikayati · حكايتي — ${t.landing.heroLine1} ${t.landing.heroLine2}`, description: t.landing.heroSub };
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
  const [t, locale, user, counters, reviews] = await Promise.all([
    getMessages(),
    getLocale(),
    currentUser(),
    // The landing never fails over a number or a quote.
    db.getCounters().catch(() => null),
    db.getReviews("approved").catch(() => []),
  ]);
  const L = t.landing;
  const createHref = createLink(!!user);
  // A real, scannable QR for the sample guest pass.
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US");
  const stats = [
    { value: DESIGN_COUNT, label: L.counters.designs },
    { value: OCCASIONS.length, label: L.counters.occasions },
    { value: 2, label: L.counters.languages },
    { value: 1, label: L.counters.payment },
    ...(counters && counters.invitationsSent >= SENT_THRESHOLD ? [{ value: counters.invitationsSent, label: L.counters.sent }] : []),
  ];
  const plans = [
    { ...PLANS.standard, copy: L.pricing.plans[0], href: createHref, primary: true },
    { ...PLANS.custom, copy: L.pricing.plans[1], href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(L.pricing.plans[1].name)}`, primary: false },
  ];
  const qr = await QRCode.toString("HIKAYATI-SAMPLE-PASS", { type: "svg", margin: 0, color: { dark: "#24241f", light: "#0000" } });

  return (
    <>
      <SiteHeader L={L} signedIn={!!user} />

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
              <InviteButton href={createHref} className="flex min-h-14 w-full sm:inline-flex sm:w-auto">
                {L.create}
              </InviteButton>
            </div>
          </div>
        </section>

        {/* ---------- Counters: what Hikayati is, in numbers ---------- */}
        <section aria-label={L.counters.label} className="border-y border-ink-deep/15 px-safe py-10">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:flex lg:justify-between">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse">
                <dt className="mt-1 text-[0.9375rem] text-ink-soft">{s.label}</dt>
                <dd className="font-editorial text-[clamp(2.5rem,5vw,4rem)] font-medium leading-none tabular-nums">{nf.format(s.value)}</dd>
              </div>
            ))}
          </dl>
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

        {/* ---------- Designs: four cards on phones, and the way into the whole library ---------- */}
        <section id="designs" aria-labelledby="designs-title" className="scroll-mt-20 px-safe py-[clamp(7rem,14vw,12rem)]">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <Reveal className="md:col-span-6">
              <h2 id="designs-title" className="font-editorial text-[clamp(2.5rem,4.6vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.02em]">
                {L.designsTitle}
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="md:col-span-5 md:col-start-8">
              <p className="text-[1.25rem] leading-[1.6] text-ink-deep">{L.designsBody(DESIGN_COUNT)}</p>
              <InviteButton href="/gallery" className="mt-8 flex w-full sm:inline-flex sm:w-auto">
                {L.designsCta}
              </InviteButton>
            </Reveal>
          </div>
          <ul className="mt-16 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {FEATURED.map((d, i) => {
              const name = LAYOUT_NAMES[d.style][d.layout - 1][locale];
              return (
                <li key={`${d.style}-${d.category}-${d.layout}`} className={i % 2 ? "md:mt-16" : ""}>
                  <Reveal delay={i * 0.06}>
                    <Link href={galleryPath(d.style, d.category, d.layout)} className="group block tap-control">
                      <PhoneFrame className="transition duration-300 group-hover:-translate-y-1">
                        <DesignFrame src={designSrc(d)} title={name} />
                      </PhoneFrame>
                      <span className="mt-4 block text-[1.0625rem] text-ink-deep group-hover:underline group-hover:decoration-champagne group-hover:decoration-2 group-hover:underline-offset-[6px]">
                        {name}
                      </span>
                      <span className="block text-[0.875rem] text-ink-soft">{t.designs[d.style]}</span>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
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
          <OccasionShowcase
            rows={OCCASIONS.map((o) => ({ id: o.id, label: o.label[locale], line: o.cardLine[locale] }))}
            tableNote={L.occasionsTable}
            photo={
              <Reveal>
                <Photo src="/landing/henna-hands.jpg" alt={L.photos.henna} ratio="aspect-[4/5]" sizes="(min-width: 768px) 30vw, 70vw" className="ms-auto w-[70%] md:ms-0 md:w-full" />
              </Reveal>
            }
          />
        </section>

        {/* ---------- Pricing: one payment per occasion ---------- */}
        <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-20 bg-bone px-safe py-[clamp(7rem,14vw,12rem)]">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <Reveal className="md:col-span-6">
              <h2 id="pricing-title" className="font-editorial text-[clamp(2.5rem,4.6vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.02em]">
                {L.pricing.title}
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="md:col-span-5 md:col-start-8">
              <p className="text-[1.25rem] leading-[1.6] text-ink-deep">{L.pricing.body}</p>
            </Reveal>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {plans.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08} className="h-full">
                <article className={`flex h-full flex-col p-8 sm:p-10 ${p.primary ? "bg-ink-deep text-ivory" : "bg-ivory text-ink-deep ring-1 ring-ink-deep/15"}`}>
                  <h3 className="font-editorial text-[2rem] font-medium leading-none">{p.copy.name}</h3>
                  <p className={`mt-3 text-[1.0625rem] ${p.primary ? "text-ivory/80" : "text-ink-soft"}`}>{p.copy.line}</p>
                  <p className="mt-8 flex items-baseline gap-2">
                    <span className="font-editorial text-[clamp(3.5rem,7vw,5rem)] font-medium leading-none tabular-nums">{nf.format(p.price)}</span>
                    <span className="text-[1.125rem]">{L.pricing.currency}</span>
                  </p>
                  <p className={`mt-1 text-[0.9375rem] ${p.primary ? "text-ivory/80" : "text-ink-soft"}`}>{L.pricing.once}</p>
                  <ul className="mt-8 space-y-3 text-[1.0625rem]">
                    {p.copy.features.map((f) => (
                      <li key={f} className="flex gap-3">
                        <Check size={20} aria-hidden="true" className={`mt-0.5 shrink-0 ${p.primary ? "text-champagne" : "text-gold-ink"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-10">
                    {p.primary ? (
                      <InviteButton href={p.href} className="flex w-full">
                        {p.copy.cta}
                      </InviteButton>
                    ) : (
                      <a href={p.href} className="press tap-control flex min-h-12 items-center justify-center border border-ink-deep px-6 text-[1.0625rem] hover:bg-ink-deep hover:text-ivory">
                        {p.copy.cta}
                      </a>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-[0.9375rem] text-ink-soft">
            {L.pricing.note}{" "}
            <Link href="/refund" className="tap-control underline underline-offset-4 hover:no-underline">
              {L.pricing.refundLink}
            </Link>
          </p>
        </section>

        {/* ---------- Reviews: only what families wrote, and only once approved ---------- */}
        {reviews.length > 0 && (
          <section aria-labelledby="reviews-title" className="px-safe py-[clamp(7rem,14vw,12rem)]">
            <Reveal>
              <h2 id="reviews-title" className="font-editorial text-[clamp(2.5rem,4.6vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.02em]">
                {L.reviewsTitle}
              </h2>
            </Reveal>
            <ul className="mt-16 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((r, i) => (
                <li key={r.id}>
                  <Reveal delay={(i % 3) * 0.06}>
                    <figure className="border-t border-ink-deep/15 pt-6">
                      <p className="flex gap-0.5 text-gold-ink" role="img" aria-label={t.review.stars(r.rating)}>
                        {Array.from({ length: 5 }, (_, k) => (
                          <Star key={k} size={16} aria-hidden="true" fill={k < r.rating ? "currentColor" : "none"} />
                        ))}
                      </p>
                      <blockquote className="mt-4 whitespace-pre-line text-[1.1875rem] leading-[1.6] text-ink-deep">{r.body}</blockquote>
                      <figcaption className="mt-4 text-[0.9375rem] text-ink-soft">{r.author}</figcaption>
                    </figure>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- Questions: the ones people ask before they begin ---------- */}
        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 px-safe py-[clamp(7rem,14vw,12rem)]">
          <div className="grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <h2 id="faq-title" className="font-editorial text-[clamp(2.5rem,4.6vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.02em] lg:sticky lg:top-28">
                {L.faqTitle}
              </h2>
            </Reveal>
            <div className="border-t border-ink-deep/15 lg:col-span-7 lg:col-start-6">
              {L.faq.map((f) => (
                <details key={f.q} className="group border-b border-ink-deep/15">
                  <summary className="tap-control flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[1.1875rem] text-ink-deep [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bone text-[1.25rem] leading-none transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="max-w-[40rem] pb-6 text-[1.0625rem] leading-[1.7] text-ink-soft">{f.a}</p>
                </details>
              ))}
            </div>
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

        <FooterGroups L={L} />

        <div className="grid gap-6 text-[0.875rem] leading-6 md:grid-cols-[auto_1fr_auto] md:items-end md:gap-12">
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {siteLinks(L).map((n) => (
              <Link key={n.href} href={n.href} className="tap-control underline-offset-4 hover:underline">
                {n.label}
              </Link>
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
