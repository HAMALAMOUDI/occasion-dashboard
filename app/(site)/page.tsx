import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowRight, Check, Star } from "lucide-react";
import GuestJourney from "@/components/landing/GuestJourney";
import Reveal from "@/components/landing/Reveal";
import { MiniArrivals, MiniChat, MiniHouseholds, MiniPage, MiniReminders, MiniReplies, MiniScanner, MiniSheet } from "@/components/landing/mockups";
import { GuestPass } from "@/components/landing/fragments";
import DesignFrame from "@/components/DesignFrame";
import PhoneFrame from "@/components/PhoneFrame";
import { FooterGroups, InviteButton, SiteHeader, Wordmark, createHref as createLink, siteLinks } from "@/components/landing/SiteChrome";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORIES_FOR_OCCASION, DESIGN_COUNT, LAYOUT_NAMES, type DesignCategory, type DesignStyle } from "@/lib/designs/catalog";
import { designSrc, galleryPath } from "@/lib/designs/urls";
import { getLocale, getMessages } from "@/lib/i18n-server";
import { OCCASIONS } from "@/lib/occasions";
import { CONTACT_EMAIL, PLANS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const CONTACT = { email: CONTACT_EMAIL, phone: "+966 55 123 4567", tel: "+966551234567" };

// The live count of invitations shows only once it says something.
const SENT_THRESHOLD = 100;

type Design = { style: DesignStyle; category: DesignCategory; layout: number };

// The phone in the hero.
const HERO_DESIGN: Design = { style: "atelier", category: "wedding", layout: 1 };

// The moving strip: one card from across the occasions and styles.
const STRIP: Design[] = [
  { style: "atelier", category: "wedding", layout: 3 },
  { style: "signature", category: "wedding", layout: 4 },
  { style: "atelier", category: "engagement", layout: 6 },
  { style: "classic", category: "engagement", layout: 2 },
  { style: "atelier", category: "ramadan", layout: 9 },
  { style: "modern", category: "birthday", layout: 6 },
  { style: "atelier", category: "henna", layout: 4 },
  { style: "signature", category: "eid", layout: 2 },
  { style: "atelier", category: "gathering", layout: 5 },
  { style: "classic", category: "wedding", layout: 8 },
  { style: "atelier", category: "birthday", layout: 10 },
  { style: "modern", category: "graduation", layout: 3 },
];

// Four cards for the library section, one from each corner of it.
const FEATURED: Design[] = [
  { style: "atelier", category: "wedding", layout: 2 },
  { style: "classic", category: "engagement", layout: 3 },
  { style: "modern", category: "birthday", layout: 6 },
  { style: "signature", category: "ramadan", layout: 7 },
];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: `Hikayati · حكايتي — ${t.landing.heroLine1} ${t.landing.heroLine2}`, description: t.landing.heroSub, alternates: { canonical: "/" } };
}

const h2 = "font-editorial text-[clamp(2.5rem,4.8vw,4.5rem)] font-medium leading-[1.04] tracking-[-0.02em] rtl:leading-[1.25] rtl:tracking-normal text-balance";

// A heading in two tones: the plain half, then the half that carries the meaning.
function TwoTone({ parts, id, className = h2 }: { parts: readonly string[]; id?: string; className?: string }) {
  return (
    <h2 id={id} className={className}>
      {parts[0]} <span className="em-pine">{parts[1]}</span>
    </h2>
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
  const H = L.hero;
  const M = L.mock;
  const guest = L.journey.defaultName;
  const createHref = createLink(!!user);
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US");
  const stats = [
    ...(counters && counters.invitationsSent >= SENT_THRESHOLD ? [{ value: counters.invitationsSent, label: L.counters.sent }] : []),
    { value: DESIGN_COUNT, label: L.counters.designs },
    { value: OCCASIONS.length, label: L.counters.occasions },
    { value: 2, label: L.counters.languages },
    { value: 1, label: L.counters.payment },
  ];
  const plans = [
    { ...PLANS.standard, copy: L.pricing.plans[0], href: createHref, primary: true },
    { ...PLANS.custom, copy: L.pricing.plans[1], href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(L.pricing.plans[1].name)}`, primary: false },
  ];
  const featureMocks = [
    <MiniChat key="chat" lang={locale} name={guest} />,
    <MiniPage key="page" M={M} />,
    <MiniHouseholds key="seats" M={M} />,
    <MiniReplies key="replies" M={M} />,
    <MiniReminders key="reminders" M={M} />,
    <MiniSheet key="sheet" M={M} />,
  ];
  // Real, scannable QR codes for the sample pass and the door scanner.
  const [qr, qrLight] = await Promise.all([
    QRCode.toString("HIKAYATI-SAMPLE-PASS", { type: "svg", margin: 0, color: { dark: "#24241f", light: "#0000" } }),
    QRCode.toString("HIKAYATI-SAMPLE-PASS", { type: "svg", margin: 0, color: { dark: "#111", light: "#fff" } }),
  ]);

  return (
    <>
      <SiteHeader L={L} signedIn={!!user} />

      <main>
        {/* ---------- Hero: the promise on one side, the invitation itself on the other ---------- */}
        <section id="home" className="relative scroll-mt-20 overflow-hidden px-safe pb-16 pt-[clamp(2.5rem,7svh,5rem)] lg:pb-24">
          <div className="grid items-center gap-x-10 gap-y-14 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="eyebrow-site">{H.eyebrow}</p>
              <h1 className="mt-6 font-editorial text-[clamp(3.25rem,7.4vw,6.75rem)] font-medium leading-[0.98] tracking-[-0.03em] rtl:leading-[1.2] rtl:tracking-normal">
                <span className="block">{L.heroLine1}</span>
                <span className="em-pine block">{L.heroLine2}</span>
              </h1>
              <p
                lang={H.otherLang}
                dir={H.otherLang === "ar" ? "rtl" : "ltr"}
                className={`mt-4 text-[clamp(1.5rem,2.4vw,2rem)] text-gold-ink ${H.otherLang === "ar" ? "font-[family-name:var(--font-ruqaa)] text-end lg:text-start" : "font-editorial italic text-start"}`}
              >
                {H.other}
              </p>
              <p className="mt-8 max-w-[34rem] text-[1.1875rem] leading-[1.65] text-ink-deep">{L.heroSub}</p>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                <InviteButton href={createHref} className="min-h-14 text-[1.0625rem]">
                  {L.create}
                </InviteButton>
                <Link href="/gallery" className="tap-control text-[1.0625rem] text-pine underline decoration-champagne decoration-2 underline-offset-[7px] hover:decoration-pine">
                  {H.secondary}
                </Link>
              </div>
              <p className="mt-6 flex items-center gap-2 text-[0.9375rem] text-ink-soft">
                <Check size={16} className="text-pine" aria-hidden="true" /> {H.price(PLANS.standard.price)}
              </p>
            </div>

            {/* The phone, its arch behind it, and the notes that float beside it. Decorative: every fact is also in the text. */}
            <div className="relative mx-auto w-full max-w-[34rem] lg:col-span-6" aria-hidden="true">
              <svg viewBox="0 0 400 480" className="absolute inset-x-[6%] top-[2%] h-[94%] w-[88%] text-bone" preserveAspectRatio="none">
                <path d="M0 480 V200 C0 90 90 0 200 0 C310 0 400 90 400 200 V480 Z" fill="currentColor" />
                <path d="M24 480 V204 C24 104 104 24 200 24 C296 24 376 104 376 204 V480" fill="none" stroke="var(--champagne)" strokeOpacity="0.55" strokeWidth="1.5" />
              </svg>
              <div className="relative mx-auto w-[min(62%,17rem)] pt-10">
                <div className="phone-tilt">
                  <PhoneFrame className="shadow-[0_40px_80px_-30px_rgb(20_58_46/0.55)]">
                    <DesignFrame src={designSrc(HERO_DESIGN)} title={LAYOUT_NAMES[HERO_DESIGN.style][HERO_DESIGN.layout - 1][locale]} />
                  </PhoneFrame>
                </div>
              </div>

              <div className="float absolute end-0 top-[14%] hidden w-[11.5rem] sm:block rounded-2xl bg-white/95 p-4 shadow-[0_18px_40px_-20px_rgb(36_36_31/0.45)] ring-1 ring-ink-deep/5 backdrop-blur">
                <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-pine rtl:tracking-normal">{H.chipDesign}</p>
                <p className="mt-1 font-editorial text-[1.375rem] leading-tight">{LAYOUT_NAMES[HERO_DESIGN.style][HERO_DESIGN.layout - 1][locale]}</p>
                <p className="text-[0.8125rem] text-ink-soft">{H.chipDesignNote}</p>
              </div>

              <div className="float-late absolute bottom-[16%] start-0 flex max-w-[15rem] items-center gap-3 rounded-2xl bg-chat-bg p-3 shadow-[0_18px_40px_-20px_rgb(36_36_31/0.45)]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-olive font-[family-name:var(--font-ruqaa)] text-lg text-paper-warm">ح</span>
                <span className="rounded-xl rounded-ss-sm bg-white px-3 py-2 text-[0.875rem] leading-snug">{H.chipMessage(guest)}</span>
              </div>

              <div className="float absolute bottom-[2%] end-[4%] rounded-2xl bg-white/95 px-4 py-3 shadow-[0_18px_40px_-20px_rgb(36_36_31/0.45)] ring-1 ring-ink-deep/5">
                <p className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.16em] text-pine rtl:tracking-normal">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pine opacity-50 motion-reduce:hidden" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-pine" />
                  </span>
                  {H.chipLive} <span className="text-ink-soft normal-case tracking-normal">· {H.chipSample}</span>
                </p>
                <p className="mt-1 font-editorial text-[1.25rem] rtl:font-clean rtl:text-[1rem]">{H.chipLiveLine(64, 18)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- The designs, gliding past ---------- */}
        <section aria-label={L.marqueeLabel} className="marquee overflow-hidden py-6 [contain:paint]">
          <ul className="marquee-track flex w-max gap-5 px-2">
            {[...STRIP, ...STRIP].map((d, i) => {
              const name = LAYOUT_NAMES[d.style][d.layout - 1][locale];
              const copy = i >= STRIP.length;
              return (
                <li key={i} aria-hidden={copy || undefined} className="w-[9.5rem] shrink-0 sm:w-[11rem]">
                  <Link
                    href={galleryPath(d.style, d.category, d.layout)}
                    tabIndex={copy ? -1 : undefined}
                    className="group block overflow-hidden rounded-[1.25rem] shadow-[0_20px_40px_-26px_rgb(36_36_31/0.55)] ring-1 ring-ink-deep/5 transition-transform duration-300 hover:-translate-y-1.5"
                  >
                    <DesignFrame src={designSrc(d)} title={name} />
                    <span className="sr-only">{name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---------- Counters ---------- */}
        <section aria-label={L.counters.label} className="px-safe py-14">
          <dl className={`grid grid-cols-2 gap-y-10 ${stats.length > 4 ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
            {stats.map((s, i) => (
              <div key={s.label} className={`flex flex-col-reverse items-center px-4 text-center ${i > 0 ? "sm:border-s sm:border-ink-deep/12" : ""}`}>
                <dt className="mt-2 text-[0.9375rem] text-ink-soft">{s.label}</dt>
                <dd className="font-editorial text-[clamp(2.75rem,5vw,4rem)] font-medium leading-none tabular-nums">{nf.format(s.value)}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------- Features: each tile shows the piece of the product it describes ---------- */}
        <section id="features" aria-labelledby="features-title" className="scroll-mt-20 bg-bone/60 px-safe py-[clamp(5rem,10vw,8rem)]">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <Reveal className="md:col-span-7">
              <p className="eyebrow-site">{L.features.eyebrow}</p>
              <TwoTone id="features-title" parts={L.features.title} className={`${h2} mt-5`} />
            </Reveal>
            <Reveal delay={0.08} className="md:col-span-4 md:col-start-9">
              <p className="text-[1.125rem] leading-[1.65] text-ink-deep">{L.features.body}</p>
            </Reveal>
          </div>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {L.features.items.map((f, i) => (
              <li key={f.title}>
                <Reveal delay={(i % 3) * 0.06} className="h-full">
                  <article className="tile flex h-full flex-col overflow-hidden">
                    <div className="grid h-[17rem] place-items-center overflow-hidden bg-ivory px-6">{featureMocks[i]}</div>
                    <div className="p-6">
                      <h3 className="font-editorial text-[1.625rem] font-medium leading-tight">{f.title}</h3>
                      <p className="mt-2 text-[1rem] leading-[1.6] text-ink-soft">{f.body}</p>
                    </div>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- How it works: one invitation's journey, addressed to the name typed in ---------- */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-[4.5rem]">
          <GuestJourney lang={locale} copy={L.journey} qr={qr} eyebrow={L.howEyebrow} />
        </section>

        {/* ---------- On the day: the pass, the scanner, the arrivals ---------- */}
        <section aria-labelledby="day-title" className="relative overflow-hidden bg-pine-deep [contain:paint] px-safe py-[clamp(5rem,10vw,8rem)] text-ivory">
          <div aria-hidden="true" className="pointer-events-none absolute -top-40 end-[-10%] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgb(201_182_139/0.16),transparent_65%)]" />
          <div className="relative grid gap-8 md:grid-cols-12 md:items-end">
            <Reveal className="md:col-span-7">
              <p className="eyebrow-site text-ivory/70">{L.day.eyebrow}</p>
              <h2 id="day-title" className={`${h2} mt-5`}>
                {L.day.title[0]} <span className="italic text-champagne rtl:not-italic">{L.day.title[1]}</span>
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="md:col-span-4 md:col-start-9">
              <p className="text-[1.125rem] leading-[1.65] text-ivory/80">{L.day.body}</p>
            </Reveal>
          </div>
          <ul className="relative mt-14 grid gap-5 md:grid-cols-3">
            {[
              <div key="pass" className="w-full max-w-[17rem] text-ink-deep [&_article]:max-w-none [&_article]:px-5 [&_article]:pb-5 [&_article]:pt-6 [&_h3]:text-[1.5rem] [&_p]:text-[0.8125rem]">
                <GuestPass lang={locale} name={guest} qr={qr} />
              </div>,
              <MiniScanner key="scan" M={M} name={guest} qr={qrLight} />,
              <MiniArrivals key="arrivals" M={M} />,
            ].map((mock, i) => (
              <li key={i}>
                <Reveal delay={i * 0.06} className="h-full">
                  <article className="flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-white/[0.04] ring-1 ring-white/10">
                    <div className="grid min-h-[24rem] place-items-center px-6 py-8">{mock}</div>
                    <div className="border-t border-white/10 p-6">
                      <h3 className="font-editorial text-[1.625rem] font-medium leading-tight">{L.day.items[i].title}</h3>
                      <p className="mt-2 text-[1rem] leading-[1.6] text-ivory/70">{L.day.items[i].body}</p>
                    </div>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Designs: a few cards, and the way into the whole library ---------- */}
        <section id="designs" aria-labelledby="designs-title" className="scroll-mt-20 px-safe py-[clamp(5rem,10vw,8rem)]">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <Reveal className="md:col-span-6">
              <p className="eyebrow-site">{L.designsEyebrow}</p>
              <h2 id="designs-title" className={`${h2} mt-5`}>
                {L.designsTitle}
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="md:col-span-5 md:col-start-8">
              <p className="text-[1.125rem] leading-[1.65] text-ink-deep">{L.designsBody(DESIGN_COUNT)}</p>
            </Reveal>
          </div>
          <ul className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {FEATURED.map((d, i) => {
              const name = LAYOUT_NAMES[d.style][d.layout - 1][locale];
              return (
                <li key={`${d.style}-${d.category}-${d.layout}`}>
                  <Reveal delay={i * 0.06} className="h-full">
                    <Link href={galleryPath(d.style, d.category, d.layout)} className="tile group flex h-full flex-col p-2.5 tap-control">
                      <div className="rounded-[1.1rem] bg-bone px-[12%] pb-6 pt-7">
                        <PhoneFrame className="transition duration-300 group-hover:-translate-y-1.5">
                          <DesignFrame src={designSrc(d)} title={name} />
                        </PhoneFrame>
                      </div>
                      <div className="px-2 pb-2 pt-4">
                        <p className="font-editorial text-[1.375rem] leading-tight">{name}</p>
                        <p className="mt-0.5 text-[0.75rem] uppercase tracking-[0.14em] text-pine rtl:tracking-normal">{t.designs[d.style]}</p>
                        <p className="mt-3 inline-flex items-center gap-1.5 text-[0.9375rem] text-ink-deep underline decoration-champagne underline-offset-4 group-hover:decoration-pine">
                          {L.seeDesign} <ArrowRight size={14} className="rtl:rotate-180" />
                        </p>
                      </div>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
          <div className="mt-12 flex justify-center">
            <Link href="/gallery" className="btn-ghost press tap-control">
              {L.designsCta} <ArrowRight size={16} className="rtl:rotate-180" />
            </Link>
          </div>
        </section>

        {/* ---------- Occasions: every one, with the line its card opens on ---------- */}
        <section id="occasions" aria-labelledby="occasions-title" className="scroll-mt-20 bg-bone/60 px-safe py-[clamp(5rem,10vw,8rem)]">
          <Reveal>
            <p className="eyebrow-site">{L.occasionsEyebrow}</p>
            <h2 id="occasions-title" className={`${h2} mt-5`}>
              {L.occasionsTitle}
            </h2>
          </Reveal>
          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {OCCASIONS.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/gallery?category=${CATEGORIES_FOR_OCCASION[o.id][0]}`}
                  className="tile group flex h-full items-center justify-between gap-4 px-5 py-4 tap-control transition-shadow hover:shadow-[0_0_0_1px_var(--pine),0_24px_48px_-32px_rgb(36_36_31/0.35)]"
                >
                  <span>
                    <span className="block text-[1.0625rem] font-medium text-ink-deep">{o.label[locale]}</span>
                    <span className="mt-0.5 block font-editorial text-[1.0625rem] italic text-ink-soft rtl:not-italic">{o.cardLine[locale]}</span>
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-ink-soft transition-transform group-hover:translate-x-1 group-hover:text-pine rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </Link>
              </li>
            ))}
            <li>
              <Link href="/gallery" className="group flex h-full min-h-[5.5rem] items-center justify-between gap-4 rounded-[1.5rem] bg-pine px-5 py-4 text-ivory tap-control hover:bg-pine-deep">
                <span className="text-[1.0625rem] font-medium">{L.designsCta}</span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-champagne text-pine-deep">
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                </span>
              </Link>
            </li>
          </ul>
        </section>

        {/* ---------- Reviews: only what families wrote, and only once approved ---------- */}
        {reviews.length > 0 && (
          <section aria-labelledby="reviews-title" className="px-safe py-[clamp(5rem,10vw,8rem)]">
            <Reveal>
              <h2 id="reviews-title" className={h2}>
                {L.reviewsTitle}
              </h2>
            </Reveal>
            <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((r, i) => (
                <li key={r.id}>
                  <Reveal delay={(i % 3) * 0.06} className="h-full">
                    <figure className="tile flex h-full flex-col p-7">
                      <p className="flex gap-0.5 text-gold-ink" role="img" aria-label={t.review.stars(r.rating)}>
                        {Array.from({ length: 5 }, (_, k) => (
                          <Star key={k} size={16} aria-hidden="true" fill={k < r.rating ? "currentColor" : "none"} />
                        ))}
                      </p>
                      <blockquote className="mt-4 flex-1 whitespace-pre-line font-editorial text-[1.375rem] italic leading-[1.45] text-ink-deep rtl:not-italic">{r.body}</blockquote>
                      <figcaption className="mt-6 flex items-center gap-3 text-[0.9375rem] text-ink-soft">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-pine-soft font-medium text-pine">{r.author.charAt(0)}</span>
                        {r.author}
                      </figcaption>
                    </figure>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- Pricing: one payment per occasion ---------- */}
        <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-20 px-safe py-[clamp(5rem,10vw,8rem)]">
          <Reveal className="mx-auto max-w-[44rem] text-center">
            <p className="eyebrow-site">{L.pricingEyebrow}</p>
            <h2 id="pricing-title" className={`${h2} mt-5`}>
              {L.pricing.title}
            </h2>
            <p className="mt-5 text-[1.125rem] leading-[1.65] text-ink-deep">{L.pricing.body}</p>
          </Reveal>
          <div className="mx-auto mt-14 grid max-w-[60rem] gap-5 md:grid-cols-2">
            {plans.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08} className="h-full">
                <article className={`flex h-full flex-col rounded-[1.75rem] p-8 sm:p-10 ${p.primary ? "bg-pine-deep text-ivory shadow-[0_40px_80px_-40px_rgb(20_58_46/0.8)]" : "tile text-ink-deep"}`}>
                  <h3 className="font-editorial text-[2rem] font-medium leading-none">{p.copy.name}</h3>
                  <p className={`mt-3 text-[1.0625rem] ${p.primary ? "text-ivory/75" : "text-ink-soft"}`}>{p.copy.line}</p>
                  <p className="mt-8 flex items-baseline gap-2">
                    <span className="font-editorial text-[clamp(3.5rem,7vw,4.75rem)] font-medium leading-none tabular-nums">{nf.format(p.price)}</span>
                    <span className="text-[1.125rem]">{L.pricing.currency}</span>
                  </p>
                  <p className={`mt-1 text-[0.9375rem] ${p.primary ? "text-ivory/75" : "text-ink-soft"}`}>{L.pricing.once}</p>
                  <ul className={`mt-8 space-y-3 border-t pt-8 text-[1.0625rem] ${p.primary ? "border-white/15" : "border-ink-deep/10"}`}>
                    {p.copy.features.map((f) => (
                      <li key={f} className="flex gap-3">
                        <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${p.primary ? "bg-champagne text-pine-deep" : "bg-pine-soft text-pine"}`}>
                          <Check size={12} strokeWidth={3} aria-hidden="true" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-10">
                    {p.primary ? (
                      <InviteButton href={p.href} className="flex w-full min-h-14 bg-ivory! text-pine-deep! hover:bg-white!">
                        {p.copy.cta}
                      </InviteButton>
                    ) : (
                      <a href={p.href} className="btn-ghost press tap-control w-full min-h-14">
                        {p.copy.cta}
                      </a>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-[0.9375rem] text-ink-soft">
            {L.pricing.note}{" "}
            <Link href="/refund" className="tap-control underline underline-offset-4 hover:no-underline">
              {L.pricing.refundLink}
            </Link>
          </p>
        </section>

        {/* ---------- Questions: the ones people ask before they begin ---------- */}
        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 bg-bone/60 px-safe py-[clamp(5rem,10vw,8rem)]">
          <div className="grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <p className="eyebrow-site">{L.faqEyebrow}</p>
                <h2 id="faq-title" className={`${h2} mt-5`}>
                  {L.faqTitle}
                </h2>
              </div>
            </Reveal>
            <div className="space-y-3 lg:col-span-7 lg:col-start-6">
              {L.faq.map((f) => (
                <details key={f.q} className="tile group px-6">
                  <summary className="tap-control flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.125rem] text-ink-deep [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pine-soft text-[1.25rem] leading-none text-pine transition-transform group-open:rotate-45">
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
        <section aria-labelledby="begin-title" className="px-safe py-[clamp(4rem,8vw,6rem)]">
          <div className="relative overflow-hidden rounded-[2rem] bg-pine-deep px-[clamp(1.5rem,5vw,4rem)] py-[clamp(3.5rem,8vw,6rem)] text-ivory">
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 start-[-10%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgb(201_182_139/0.18),transparent_65%)]" />
            <p className="eyebrow-site relative text-ivory/70">{L.closingEyebrow}</p>
            <form action="/events/new" method="get" className="relative mt-6 font-editorial text-[clamp(2.25rem,5.4vw,5rem)] font-medium leading-[1.15] tracking-[-0.02em] rtl:tracking-normal">
              <h2 id="begin-title" className="flex flex-wrap items-baseline gap-x-[0.3em] gap-y-[0.2em]">
                <label htmlFor="occasion-name">{L.closingLead}</label>
                <input
                  id="occasion-name"
                  name="name"
                  maxLength={120}
                  autoComplete="off"
                  enterKeyHint="go"
                  placeholder={L.closingPlaceholder}
                  className="h-[1.2em] w-full min-w-0 rounded-full bg-white/10 px-[0.45em] text-[1em] tracking-[inherit] text-ivory outline-none ring-1 ring-white/20 placeholder:italic placeholder:text-ivory/45 focus-visible:ring-2 focus-visible:ring-champagne sm:w-[7.5em]"
                />
                <span>{L.closingAnd}</span>
                <button type="submit" className="press tap-control rounded-full bg-champagne px-[0.45em] leading-[1.2] text-pine-deep hover:bg-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne">
                  {L.closingButton}
                </button>
              </h2>
            </form>
            <p className="relative mt-8 max-w-[40rem] text-[1.0625rem] leading-[1.6] text-ivory/75">{L.closingNote}</p>
          </div>
        </section>
      </main>

      {/* ---------- Footer: the way to get in touch is the headline ---------- */}
      <footer id="contact" className="flex scroll-mt-[4.5rem] flex-col gap-16 bg-pine-deep px-safe pb-[max(2rem,env(safe-area-inset-bottom,0px))] pt-14 text-ivory">
        <div className="flex flex-wrap items-start justify-between gap-8 text-[0.9375rem] leading-6">
          <div className="space-y-2">
            <Wordmark className="[&_span:last-child]:text-champagne" />
            <p className="max-w-[28rem] text-ivory/75">{L.footerLine}</p>
            <p className="text-ivory/75">{L.locationValue}</p>
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
            className="block font-editorial text-[clamp(2.75rem,10vw,9rem)] font-medium italic leading-[0.95] tracking-[-0.03em] text-ivory hover:text-champagne rtl:text-right"
          >
            hikayati<wbr />@gmail.com
          </a>
          <a href={`tel:${CONTACT.tel}`} dir="ltr" className="mt-6 inline-block text-[1.25rem] underline decoration-champagne underline-offset-4 hover:no-underline">
            {CONTACT.phone}
          </a>
        </div>

        <div className="grid gap-10 border-t border-white/12 pt-10 md:grid-cols-[1fr_auto]">
          <FooterGroups L={L} />
          <nav aria-label={L.nav.contact} className="flex flex-wrap content-start gap-x-6 gap-y-2 text-[0.9375rem]">
            {siteLinks(L).map((n) => (
              <Link key={n.href} href={n.href} className="tap-control underline-offset-4 hover:underline">
                {n.label}
              </Link>
            ))}
            <Link href={user ? "/events" : "/login"} className="tap-control underline-offset-4 hover:underline">
              {user ? L.myEvents : L.signIn}
            </Link>
          </nav>
        </div>
        <p className="text-[0.875rem] text-ivory/60">{L.rights(new Date().getFullYear())}</p>
      </footer>
    </>
  );
}
