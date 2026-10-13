import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowRight, Check, Mail, MapPin, Phone } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import LanguageToggle from "@/components/LanguageToggle";
import { currentUser } from "@/lib/auth";
import { getMessages } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

const CONTACT = { email: "hikayati@gmail.com", phone: "+966 55 123 4567", tel: "+966551234567" };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: `Hikayati · حكايتي — ${t.landing.tagline}`, description: t.landing.intro };
}

const btnSolid =
  "inline-flex items-center justify-center gap-3 bg-ink-deep px-8 py-3.5 text-[0.78rem] font-medium text-ivory transition-colors duration-500 hover:bg-olive tracked";
const btnLine =
  "inline-flex items-center justify-center gap-3 border border-ink-deep/35 px-8 py-3.5 text-[0.78rem] font-medium text-ink-deep transition-colors duration-500 hover:border-champagne hover:bg-paper-warm tracked";

function Wordmark({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span className="flex items-baseline gap-2.5">
      <span className={`font-editorial font-medium tracking-[0.22em] ${size === "lg" ? "text-2xl" : "text-xl"}`} lang="en">
        HIKAYATI
      </span>
      {size === "lg" && <span className="text-champagne">—</span>}
      <span className="font-[family-name:var(--font-ruqaa)] text-lg text-champagne" lang="ar">
        حكايتي
      </span>
    </span>
  );
}

// Small ornament used on the sample invitation card.
function Ornament() {
  return (
    <svg width="120" height="16" viewBox="0 0 120 16" aria-hidden="true" className="mx-auto my-4 text-champagne">
      <path d="M2 8 H48 M72 8 H118" stroke="currentColor" strokeWidth="1" />
      <path d="M60 1 L67 8 L60 15 L53 8 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="51" cy="8" r="1.6" fill="currentColor" />
      <circle cx="69" cy="8" r="1.6" fill="currentColor" />
    </svg>
  );
}

export default async function LandingPage() {
  const [t, user] = await Promise.all([getMessages(), currentUser()]);
  const L = t.landing;
  const createHref = user ? "/events/new" : "/login?next=/events/new";
  // A real, scannable QR for the sample guest pass.
  const qr = await QRCode.toString("HIKAYATI-SAMPLE-PASS", { type: "svg", margin: 0, color: { dark: "#24241f", light: "#0000" } });

  return (
    <>
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-40 border-b border-hair bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-6">
          <a href="#home" aria-label="Hikayati · حكايتي">
            <Wordmark />
          </a>
          <nav className="hidden items-center gap-9 text-[0.8rem] text-ink-soft lg:flex">
            {(["home", "occasions", "how", "about", "contact"] as const).map((id) => (
              <a key={id} href={`#${id}`} className="tracked transition-colors hover:text-ink-deep">
                {L.nav[id]}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <LanguageToggle className="border-hair bg-transparent" />
            <Link href={user ? "/events" : "/login"} className="hidden text-[0.8rem] text-ink-soft hover:text-ink-deep md:inline">
              {user ? L.myEvents : L.signIn}
            </Link>
            <Link
              href={createHref}
              className="hidden bg-ink-deep px-5 py-2 text-[0.72rem] font-medium text-ivory transition-colors duration-500 hover:bg-olive sm:inline-flex tracked"
            >
              {L.headerCta}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section
          id="home"
          className="relative flex min-h-[calc(100svh-4.5rem)] scroll-mt-20 flex-col items-center justify-center px-6 pb-24 pt-16 text-center"
        >
          <div className="rise flex flex-col items-center">
            <h1 className="font-editorial text-[clamp(3.2rem,12vw,8.5rem)] font-light leading-none tracking-[0.1em] sm:tracking-[0.16em]" lang="en">
              HIKAYATI
            </h1>
            <span className="hairline draw-line mt-6 w-full max-w-md" />
            <p className="mt-4 font-[family-name:var(--font-ruqaa)] text-[clamp(2.6rem,8vw,5rem)] leading-tight text-champagne" lang="ar">
              حكايتي
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

        {/* ---------- Example: the guest's experience and the invitation ---------- */}
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
                      ح
                    </span>
                    <div className="leading-tight">
                      <p className="text-[0.95rem]">حكايتي</p>
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
                      Please present this QR upon arrival
                    </p>
                  </article>
                </div>
                <p className="mt-8 text-center text-[0.72rem] text-ink-soft/80 tracked">{L.guestCaption}</p>
              </Reveal>

              {/* The invitation */}
              <Reveal delay={0.15} className="order-1 lg:order-2">
                <article
                  dir="rtl"
                  lang="ar"
                  className="relative mx-auto aspect-[3/4.25] w-full max-w-[26.5rem] overflow-hidden bg-[#fdfbf6] font-[family-name:var(--font-display-ar)] shadow-[0_40px_70px_-30px_rgba(70,58,28,0.45)]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_30%_0%,rgba(255,255,255,0.9),transparent_60%)]" />
                  <div className="absolute inset-[0.9rem] border border-champagne/70" />
                  <div className="absolute inset-[1.15rem] border border-champagne/35" />
                  <div className="relative flex h-full flex-col items-center px-[13%] pb-[11%] pt-[12%] text-center">
                    <p className="text-[0.95rem] leading-8 text-olive sm:text-base">بارك الله لهما وبارك عليهما وجمع بينهما في خير</p>
                    <Ornament />
                    <p className="text-[0.82rem] leading-7 text-ink-soft">تتشرف الأسرتان الكريمتان بدعوتكم لحضور حفل زفاف</p>
                    <p className="mt-2 text-[0.85rem] leading-7 text-ink-soft">
                      سارة آل سعود <span className="mx-1 text-champagne">·</span> مها العتيبي
                    </p>
                    <div className="mt-auto">
                      <p className="text-[1.65rem] leading-[1.5] sm:text-[1.9rem]">فهد آل سعود</p>
                      <p className="my-1 text-xl text-champagne">و</p>
                      <p className="text-[1.65rem] leading-[1.5] sm:text-[1.9rem]">نوف بنت محمد آل الشيخ</p>
                    </div>
                    <Ornament />
                    <dl className="space-y-2 text-[0.82rem] leading-6 text-ink-soft">
                      <div>
                        <dt className="sr-only">الموقع</dt>
                        <dd>نايراه هول، الرياض، المملكة العربية السعودية</dd>
                      </div>
                      <div className="flex items-center justify-center gap-3 text-ink-deep">
                        <dt className="sr-only">التاريخ</dt>
                        <dd>15 ديسمبر 2026</dd>
                        <span className="h-3 w-px bg-champagne" aria-hidden="true" />
                        <dt className="sr-only">الوقت</dt>
                        <dd>الزفة 8:00 مساءً</dd>
                      </div>
                    </dl>
                    <p className="mt-5 text-sm text-olive">نتشرف بحضوركم</p>
                  </div>
                </article>
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
                  <span className="block font-editorial text-5xl font-light text-champagne">{step.num}</span>
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
              {L.occasions.map((label, i) => (
                <Reveal as="li" key={label} delay={(i % 2) * 0.08}>
                  <div className="group flex items-baseline gap-5 border-b border-hair py-6 transition-colors duration-500 hover:border-champagne">
                    <span className="font-editorial text-lg text-champagne">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-editorial text-2xl transition-transform duration-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 sm:text-3xl">
                      {label}
                    </span>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Closing ---------- */}
        <section className="relative px-6 py-36 text-center sm:py-48">
          <Reveal>
            <p className="font-editorial text-4xl font-light sm:text-6xl">{L.closingTitle}</p>
            <p className="mt-4 font-editorial text-2xl italic text-ink-soft sm:text-3xl rtl:not-italic">{L.closingSub}</p>
            <Link href={createHref} className={`${btnSolid} mt-12`}>
              {L.create} <ArrowRight size={15} className="rtl:rotate-180" />
            </Link>
          </Reveal>
        </section>
      </main>

      {/* ---------- Footer / contact ---------- */}
      <footer id="contact" className="relative scroll-mt-20 border-t border-hair px-6 pb-10 pt-20">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="max-w-sm">
            <Wordmark size="lg" />
            <p className="mt-5 leading-7 text-ink-soft">{L.footerLine}</p>
          </div>
          <dl className="grid gap-5 text-[0.9rem] sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
            <div>
              <dt className="flex items-center gap-2 text-[0.7rem] text-olive tracked">
                <Mail size={13} /> {L.email}
              </dt>
              <dd className="mt-2">
                <a href={`mailto:${CONTACT.email}`} dir="ltr" className="hover:text-olive">
                  {CONTACT.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-[0.7rem] text-olive tracked">
                <Phone size={13} /> {L.phone}
              </dt>
              <dd className="mt-2">
                <a href={`tel:${CONTACT.tel}`} dir="ltr" className="hover:text-olive">
                  {CONTACT.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-[0.7rem] text-olive tracked">
                <MapPin size={13} /> {L.location}
              </dt>
              <dd className="mt-2">{L.locationValue}</dd>
            </div>
          </dl>
        </div>
        <div className="mx-auto mt-16 flex max-w-6xl flex-col gap-4 border-t border-hair pt-6 text-[0.75rem] text-ink-soft/80 sm:flex-row sm:items-center sm:justify-between">
          <p>{L.rights(new Date().getFullYear())}</p>
          <nav className="flex gap-6">
            {(["home", "occasions", "how", "about"] as const).map((id) => (
              <a key={id} href={`#${id}`} className="hover:text-ink-deep">
                {L.nav[id]}
              </a>
            ))}
            <Link href={user ? "/events" : "/login"} className="hover:text-ink-deep">
              {user ? L.myEvents : L.signIn}
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
