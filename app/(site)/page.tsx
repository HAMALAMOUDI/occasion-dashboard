import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowRight, Check } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import LanguageToggle from "@/components/LanguageToggle";
import DesignFrame from "@/components/DesignFrame";
import { designSrc } from "@/lib/designs/urls";
import { currentUser } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n-server";
import { OCCASIONS } from "@/lib/occasions";
import { DESIGN_CATEGORIES, DESIGN_STYLES } from "@/lib/designs/catalog";

export const dynamic = "force-dynamic";

const DESIGN_COUNT = DESIGN_STYLES.length * DESIGN_CATEGORIES.length * 20;

// A few designs from the library to show off — real renders, not screenshots.
const SHOWCASE = [
  { style: "classic", category: "wedding", layout: 2 },
  { style: "modern", category: "henna", layout: 11 },
  { style: "classic", category: "graduation", layout: 9 },
  { style: "modern", category: "baby", layout: 6 },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: `${t.brand.name} — ${t.landing.tagline}`, description: t.landing.intro };
}

const btnSolid =
  "inline-flex items-center justify-center gap-3 bg-ink-deep px-8 py-3.5 text-[0.78rem] font-medium text-ivory transition-colors duration-500 hover:bg-olive tracked";
const btnLine =
  "inline-flex items-center justify-center gap-3 border border-ink-deep/35 px-8 py-3.5 text-[0.78rem] font-medium text-ink-deep transition-colors duration-500 hover:border-champagne hover:bg-paper-warm tracked";

export default async function LandingPage() {
  const [t, locale, user] = await Promise.all([getMessages(), getLocale(), currentUser()]);
  const L = t.landing;
  const createHref = user ? "/events/new" : "/login?next=/events/new";
  // A real, scannable QR for the sample guest pass.
  const qr = await QRCode.toString("INV-SAMPLE-PASS", { type: "svg", margin: 0, color: { dark: "#24241f", light: "#0000" } });

  return (
    <>
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-40 border-b border-hair bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-6">
          <a href="#home" className="flex items-baseline gap-2.5">
            <span className="font-editorial text-xl font-medium tracking-[0.22em] rtl:tracking-normal" lang="en">
              OCCASION
            </span>
            <span className="font-[family-name:var(--font-ruqaa)] text-lg text-champagne" lang="ar">
              مناسبة
            </span>
          </a>
          <nav className="hidden items-center gap-9 text-[0.8rem] text-ink-soft lg:flex">
            {(["about", "how", "occasions", "designs"] as const).map((id) => (
              <a key={id} href={`#${id}`} className="tracked transition-colors hover:text-ink-deep">
                {L.nav[id]}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <LanguageToggle className="border-hair bg-transparent" />
            <Link
              href={user ? "/events" : "/login"}
              className="hidden border border-ink-deep/35 px-5 py-2 text-[0.72rem] font-medium transition-colors duration-500 hover:border-champagne sm:inline-flex tracked"
            >
              {user ? L.myEvents : L.signIn}
            </Link>
          </div>
        </div>
      </header>

      <main id="home">
        {/* ---------- Hero ---------- */}
        <section className="relative flex min-h-[calc(100svh-4.5rem)] flex-col items-center justify-center px-6 pb-24 pt-16 text-center">
          <div className="rise flex flex-col items-center">
            <h1 className="font-editorial text-[clamp(3.2rem,12vw,8.5rem)] font-light leading-none tracking-[0.1em] sm:tracking-[0.16em]" lang="en">
              OCCASION
            </h1>
            <span className="hairline draw-line mt-6 w-full max-w-md" />
            <p className="mt-4 font-[family-name:var(--font-ruqaa)] text-[clamp(2.6rem,8vw,5rem)] leading-tight text-champagne" lang="ar">
              مناسبة
            </p>
          </div>
          <div className="rise mt-8 max-w-2xl" style={{ "--rise-delay": "0.3s" } as React.CSSProperties}>
            <p className="font-editorial text-3xl font-light italic sm:text-4xl rtl:not-italic">{L.tagline}</p>
            <p className="mx-auto mt-6 max-w-xl text-[1.02rem] leading-8 text-ink-soft">{L.intro}</p>
          </div>
          <div className="rise mt-10 flex flex-col items-center gap-4 sm:flex-row" style={{ "--rise-delay": "0.55s" } as React.CSSProperties}>
            <Link href={createHref} className={btnSolid}>
              {L.create} <ArrowRight size={15} className="rtl:rotate-180" />
            </Link>
            <a href="#about" className={btnLine}>
              {L.explore}
            </a>
          </div>
          <span
            aria-hidden="true"
            className="rise absolute bottom-8 left-1/2 h-12 w-px -translate-x-1/2 bg-gradient-to-b from-champagne to-transparent"
            style={{ "--rise-delay": "1s" } as React.CSSProperties}
          />
        </section>

        {/* ---------- About ---------- */}
        <section id="about" className="scroll-mt-20 px-6 py-28 sm:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="tracked text-[0.72rem] text-olive">{L.aboutLabel}</p>
              <span className="mx-auto mt-6 block h-10 w-px bg-champagne" />
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="mt-10 font-editorial text-5xl font-light leading-[1.1] sm:text-7xl">{L.aboutTitle}</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mx-auto mt-10 max-w-2xl text-lg leading-9 text-ink-soft">{L.aboutBody}</p>
            </Reveal>
          </div>
        </section>

        {/* ---------- Example: the guest's experience ---------- */}
        <section className="relative bg-bone/60 px-6 py-28 sm:py-36">
          <div className="hairline absolute inset-x-0 top-0" />
          <div className="mx-auto max-w-6xl">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="tracked text-[0.72rem] text-olive">{L.exampleLabel}</p>
              <h2 className="mt-6 font-editorial text-4xl font-light leading-[1.15] sm:text-6xl">{L.exampleTitle}</h2>
              <p className="mx-auto mt-6 max-w-xl leading-8 text-ink-soft">{L.exampleBody}</p>
            </Reveal>

            <div className="mt-20 grid items-center gap-20 lg:grid-cols-2 lg:gap-12">
              {/* Guest pass, as it arrives on WhatsApp */}
              <Reveal className="order-2 lg:order-1">
                <div className="mx-auto w-full max-w-[24rem]" dir="rtl" lang="ar">
                  <div className="mb-3 flex items-center gap-3 px-1">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-olive font-[family-name:var(--font-ruqaa)] text-lg text-paper-warm">
                      م
                    </span>
                    <div className="leading-tight">
                      <p className="text-[0.95rem]">مناسبة</p>
                      <p className="text-[0.7rem] text-ink-soft">دعوة جديدة · الآن</p>
                    </div>
                  </div>
                  <article className="relative overflow-hidden rounded-[1.4rem] rounded-ss-md bg-paper-warm px-7 pb-7 pt-8 text-center shadow-[0_36px_60px_-28px_rgba(70,58,28,0.45)]">
                    <p className="text-[0.8rem] text-olive">الدعوة باسم</p>
                    <h3 className="mt-1 font-[family-name:var(--font-display-ar)] text-[2.1rem] leading-tight">عزيزتنا نورة</h3>
                    <p className="mt-4 text-[0.88rem] leading-7 text-ink-soft">
                      حفل زفاف فهد ونوف
                      <br />
                      15 ديسمبر 2026 · الزفة 8:00 مساءً
                    </p>
                    <p className="text-[0.8rem] leading-6 text-ink-soft/80">نايراه هول، الرياض</p>
                    <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-sage/20 px-4 py-1.5 text-[0.85rem] text-olive">
                      <Check size={15} strokeWidth={2.4} /> تم تأكيد الحضور
                    </p>
                    <div
                      className="mx-auto mt-6 w-[62%] bg-[#fffdf8] p-3 shadow-[inset_0_0_0_1px_rgba(201,182,139,0.55)] [&>svg]:h-auto [&>svg]:w-full"
                      role="img"
                      aria-label="QR"
                      dangerouslySetInnerHTML={{ __html: qr }}
                    />
                    <p className="mt-4 text-[0.8rem] leading-6 text-ink-soft">رمز الدخول الخاص بك إلى المناسبة</p>
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-ink-soft/70" lang="en" dir="ltr">
                      Please present this QR on arrival
                    </p>
                  </article>
                </div>
                <p className="mt-8 text-center text-[0.72rem] text-ink-soft/80 tracked">{L.guestCaption}</p>
              </Reveal>

              {/* The invitation card itself, rendered from the design library */}
              <Reveal delay={0.15} className="order-1 lg:order-2">
                <div className="mx-auto w-full max-w-[22rem] shadow-[0_40px_70px_-30px_rgba(70,58,28,0.45)]">
                  <DesignFrame src={designSrc({ style: "classic", category: "wedding", layout: 1 })} title={L.cardCaption} />
                </div>
                <p className="mt-8 text-center text-[0.72rem] text-ink-soft/80 tracked">{L.cardCaption}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how" className="scroll-mt-20 px-6 py-28 sm:py-36">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="text-center font-editorial text-4xl font-light sm:text-6xl">{L.howTitle}</h2>
            </Reveal>
            <ol className="mt-20 grid gap-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {L.steps.map((step, i) => (
                <Reveal as="li" key={step.title} delay={i * 0.12}>
                  <span className="block font-editorial text-5xl font-light text-champagne">{String(i + 1).padStart(2, "0")}</span>
                  <span className="my-6 block h-px w-full bg-hair" />
                  <h3 className="font-editorial text-3xl">{step.title}</h3>
                  <p className="mt-3 max-w-[16rem] leading-8 text-ink-soft">{step.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Occasions ---------- */}
        <section id="occasions" className="relative scroll-mt-20 bg-bone/60 px-6 py-28 sm:py-36">
          <div className="hairline absolute inset-x-0 top-0" />
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <h2 className="text-center font-editorial text-4xl font-light sm:text-6xl">{L.occasionsTitle}</h2>
            </Reveal>
            <ul className="mt-20 grid gap-x-16 md:grid-cols-2">
              {OCCASIONS.map((o, i) => (
                <Reveal as="li" key={o.id} delay={(i % 2) * 0.08}>
                  <div className="group flex items-baseline gap-5 border-b border-hair py-6 transition-colors duration-500 hover:border-champagne">
                    <span className="font-editorial text-lg text-champagne">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-editorial text-2xl transition-transform duration-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 sm:text-3xl">
                      {o.label[locale]}
                    </span>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Design library ---------- */}
        <section id="designs" className="scroll-mt-20 px-6 py-28 sm:py-36">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="tracked text-[0.72rem] text-olive">{L.designsLabel}</p>
              <h2 className="mt-6 font-editorial text-4xl font-light leading-[1.15] sm:text-6xl">{L.designsTitle(DESIGN_COUNT)}</h2>
              <p className="mx-auto mt-6 max-w-xl leading-8 text-ink-soft">{L.designsBody}</p>
            </Reveal>
            <div className="mt-16 grid grid-cols-2 gap-5 sm:gap-8 lg:grid-cols-4">
              {SHOWCASE.map((d, i) => (
                <Reveal key={`${d.style}-${d.category}-${d.layout}`} delay={i * 0.1}>
                  <div className="shadow-[0_30px_50px_-28px_rgba(70,58,28,0.5)] transition-transform duration-700 hover:-translate-y-1">
                    <DesignFrame src={designSrc(d)} title={L.designsLabel} />
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-14 text-center">
              <Link href={user ? "/designs" : "/login?next=/designs"} className={btnLine}>
                {L.designsCta} <ArrowRight size={15} className="rtl:rotate-180" />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ---------- Closing ---------- */}
        <section className="relative px-6 py-36 text-center sm:py-48">
          <div className="hairline absolute inset-x-0 top-0" />
          <Reveal>
            <p className="font-editorial text-4xl font-light sm:text-6xl">{L.closingTitle}</p>
            <p className="mt-4 font-editorial text-2xl italic text-ink-soft sm:text-3xl rtl:not-italic">{L.closingSub}</p>
            <Link href={createHref} className={`${btnSolid} mt-12`}>
              {L.create} <ArrowRight size={15} className="rtl:rotate-180" />
            </Link>
          </Reveal>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="relative border-t border-hair px-6 pb-10 pt-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="flex items-baseline gap-2.5">
              <span className="font-editorial text-xl font-medium tracking-[0.22em]" lang="en">
                OCCASION
              </span>
              <span className="text-champagne">—</span>
              <span className="font-[family-name:var(--font-ruqaa)] text-lg text-champagne" lang="ar">
                مناسبة
              </span>
            </p>
            <p className="mt-4 leading-7 text-ink-soft">{L.footerLine}</p>
          </div>
          <nav className="grid grid-cols-2 gap-x-12 gap-y-3 text-[0.85rem] text-ink-soft">
            {(["about", "how", "occasions", "designs"] as const).map((id) => (
              <a key={id} href={`#${id}`} className="hover:text-ink-deep">
                {L.nav[id]}
              </a>
            ))}
            <Link href={user ? "/events" : "/login"} className="hover:text-ink-deep">
              {user ? L.myEvents : L.signIn}
            </Link>
          </nav>
        </div>
        <p className="mx-auto mt-14 max-w-6xl border-t border-hair pt-6 text-[0.75rem] text-ink-soft/80">{L.rights(new Date().getFullYear())}</p>
      </footer>
    </>
  );
}
