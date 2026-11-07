import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, LayoutGrid } from "lucide-react";
import DesignFrame from "@/components/DesignFrame";
import DesignShowcase from "@/components/designs/DesignShowcase";
import { SiteFooter, SiteHeader } from "@/components/landing/SiteChrome";
import { currentUser } from "@/lib/auth";
import { CATEGORY_LABELS, DESIGN_STYLES, LAYOUT_NAMES, isDesignCategory, type DesignCategory, type DesignStyle } from "@/lib/designs/catalog";
import { isOffered, isValidLayout } from "@/lib/designs/render";
import { designSrc, galleryPath } from "@/lib/designs/urls";
import { getLocale, getMessages } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

type Params = Promise<{ style: string; category: string; layout: string }>;

function parse({ style, category, layout }: Awaited<Params>) {
  const n = Number(layout);
  if (!DESIGN_STYLES.includes(style as DesignStyle) || !isDesignCategory(category)) return null;
  if (!isOffered(style as DesignStyle, category) || !isValidLayout(style as DesignStyle, n)) return null;
  return { style: style as DesignStyle, category: category as DesignCategory, layout: n };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const [t, locale, p] = await Promise.all([getMessages(), getLocale(), params]);
  const d = parse(p);
  if (!d) return {};
  const name = LAYOUT_NAMES[d.style][d.layout - 1][locale];
  return { title: `${name} · ${CATEGORY_LABELS[d.category][locale]} · Hikayati`, description: t.gallery.styles[d.style] };
}

// One design: walk the set with previous and next, try its colours, then use it.
export default async function DesignPage({ params }: { params: Params }) {
  const [t, locale, user, p] = await Promise.all([getMessages(), getLocale(), currentUser(), params]);
  const d = parse(p);
  if (!d) notFound();
  const { style, category, layout } = d;
  const L = t.landing;
  const G = t.gallery;
  const names = LAYOUT_NAMES[style];
  const total = names.length;
  const name = names[layout - 1][locale];
  const at = (n: number) => ((n - 1 + total) % total) + 1;
  const prev = at(layout - 1);
  const next = at(layout + 1);
  // Three neighbours from the same set, never this one.
  const more = [1, 2, 3].map((k) => at(layout + k + 1)).filter((n) => n !== layout);

  return (
    <>
      <SiteHeader L={L} signedIn={!!user} current="/gallery" />
      <main className="px-safe pb-[clamp(5rem,10vw,8rem)] pt-8">
        {/* Previous · position in the set · next */}
        <nav className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[0.9375rem]">
          <Link href={galleryPath(style, category, prev)} className="tap-control inline-flex min-w-0 items-center gap-2 justify-self-start text-ink-soft hover:text-ink-deep" aria-label={`${t.designs.prev}: ${names[prev - 1][locale]}`}>
            <ArrowLeft size={18} className="shrink-0 rtl:rotate-180" />
            <span className="hidden truncate sm:inline">{names[prev - 1][locale]}</span>
          </Link>
          <Link
            href={`/gallery?${new URLSearchParams({ category, style })}`}
            className="tap-control inline-flex items-center gap-2 rounded-full border border-ink-deep/20 px-4 py-2 text-ink-deep hover:border-ink-deep/50"
          >
            <LayoutGrid size={16} />
            {G.all}
            <span className="tabular-nums text-ink-soft">{t.designs.position(layout, total)}</span>
          </Link>
          <Link href={galleryPath(style, category, next)} className="tap-control inline-flex min-w-0 items-center gap-2 justify-self-end text-ink-soft hover:text-ink-deep" aria-label={`${t.designs.next}: ${names[next - 1][locale]}`}>
            <span className="hidden truncate sm:inline">{names[next - 1][locale]}</span>
            <ArrowRight size={18} className="shrink-0 rtl:rotate-180" />
          </Link>
        </nav>

        <header className="mt-12 text-center">
          <p className="text-[0.9375rem] uppercase tracking-[0.18em] text-ink-soft rtl:tracking-normal">
            {CATEGORY_LABELS[category][locale]} · {t.designs[style]}
          </p>
          <h1 className="mt-3 font-editorial text-[clamp(2.75rem,6vw,5.5rem)] font-medium leading-[1] tracking-[-0.03em] rtl:leading-[1.2] rtl:tracking-normal">{name}</h1>
          <p className="mx-auto mt-4 max-w-[34rem] text-[1.0625rem] leading-7 text-ink-soft">{G.styles[style]}</p>
        </header>

        <div className="mt-12">
          <DesignShowcase style={style} category={category} layout={layout} title={name} signedIn={!!user} />
        </div>

        {/* How it works, in three steps. */}
        <section aria-labelledby="steps-title" className="mt-[clamp(5rem,10vw,8rem)] border-t border-ink-deep/15 pt-10">
          <h2 id="steps-title" className="font-editorial text-[clamp(2rem,3.5vw,3rem)] font-medium">
            {G.stepsTitle}
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {G.steps.map((s, i) => (
              <li key={s.title}>
                <span className="font-editorial text-[2.5rem] leading-none text-gold-ink">{i + 1}</span>
                <h3 className="mt-3 text-[1.1875rem] font-medium text-ink-deep">{s.title}</h3>
                <p className="mt-2 max-w-[22rem] text-[1rem] leading-7 text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="more-title" className="mt-[clamp(5rem,10vw,8rem)]">
          <h2 id="more-title" className="font-editorial text-[clamp(2rem,3.5vw,3rem)] font-medium">
            {G.more}
          </h2>
          <ul className="mt-8 grid grid-cols-3 gap-4 lg:gap-6">
            {more.map((n) => (
              <li key={n}>
                <Link href={galleryPath(style, category, n)} className="group block tap-control">
                  <DesignFrame src={designSrc({ style, category, layout: n })} title={names[n - 1][locale]} className="rounded-[1.25rem] ring-1 ring-ink-deep/10 transition duration-300 group-hover:-translate-y-1" />
                  <span className="mt-3 block text-[1rem] text-ink-deep">{names[n - 1][locale]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter L={L} signedIn={!!user} />
    </>
  );
}
