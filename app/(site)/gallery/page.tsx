import type { Metadata } from "next";
import Link from "next/link";
import DesignFrame from "@/components/DesignFrame";
import Reveal from "@/components/landing/Reveal";
import { SiteFooter, SiteHeader } from "@/components/landing/SiteChrome";
import { currentUser } from "@/lib/auth";
import {
  CATEGORY_LABELS,
  DESIGN_CATEGORIES,
  DESIGN_COUNT,
  LAYOUT_NAMES,
  designCountFor,
  isDesignCategory,
  stylesFor,
  type DesignCategory,
  type DesignStyle,
} from "@/lib/designs/catalog";
import { designSrc, galleryPath } from "@/lib/designs/urls";
import { getLocale, getMessages } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: `${t.gallery.metaTitle} · Hikayati · حكايتي`, description: t.gallery.body(DESIGN_COUNT) };
}

const chip =
  "tap-control shrink-0 rounded-full px-4 py-2 text-[0.9375rem] transition-colors aria-[current=page]:bg-ink-deep aria-[current=page]:text-ivory bg-bone text-ink-deep hover:bg-champagne/40";

// The public design library: every card, by occasion and style, before anyone signs in.
export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ category?: string; style?: string }> }) {
  const [t, locale, user, q] = await Promise.all([getMessages(), getLocale(), currentUser(), searchParams]);
  const L = t.landing;
  const G = t.gallery;
  const category: DesignCategory = isDesignCategory(q.category ?? null) ? (q.category as DesignCategory) : "wedding";
  const styles = stylesFor(category);
  const style: DesignStyle = styles.includes(q.style as DesignStyle) ? (q.style as DesignStyle) : styles[0];
  const href = (c: DesignCategory, s?: DesignStyle) => `/gallery?${new URLSearchParams(s ? { category: c, style: s } : { category: c })}`;

  return (
    <>
      <SiteHeader L={L} signedIn={!!user} current="/gallery" />
      <main className="px-safe pb-[clamp(5rem,10vw,8rem)] pt-[clamp(3rem,7vw,6rem)]">
        <p className="text-[0.9375rem] uppercase tracking-[0.18em] text-ink-soft rtl:tracking-normal">{G.eyebrow}</p>
        <h1 className="mt-3 max-w-[16ch] font-editorial text-[clamp(2.75rem,6.5vw,6rem)] font-medium leading-[1] tracking-[-0.03em] rtl:leading-[1.2] rtl:tracking-normal">
          {G.title}
        </h1>
        <p className="mt-6 max-w-[40rem] text-[1.1875rem] leading-[1.6] text-ink-deep">{G.body(DESIGN_COUNT)}</p>

        {/* Occasion, with how many designs each has. */}
        <nav aria-label={L.nav.occasions} className="mt-12 flex flex-wrap gap-2">
          {DESIGN_CATEGORIES.map((c) => (
            <Link key={c} href={href(c)} aria-current={c === category ? "page" : undefined} className={chip} scroll={false}>
              {CATEGORY_LABELS[c][locale]}
              <span className="ms-2 tabular-nums opacity-60">{designCountFor(c)}</span>
            </Link>
          ))}
        </nav>

        {/* Style, with a line on what sets it apart. */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {styles.map((s) => (
            <Link
              key={s}
              href={href(category, s)}
              scroll={false}
              aria-current={s === style ? "page" : undefined}
              className="tap-control block border border-ink-deep/15 p-4 transition-colors hover:border-ink-deep/40 aria-[current=page]:border-ink-deep aria-[current=page]:bg-bone"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-editorial text-[1.5rem] font-medium">{t.designs[s]}</span>
                <span className="text-[0.875rem] tabular-nums text-ink-soft">{G.count(LAYOUT_NAMES[s].length)}</span>
              </span>
              <span className="mt-1 block text-[0.9375rem] leading-6 text-ink-soft">{G.styles[s]}</span>
            </Link>
          ))}
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {LAYOUT_NAMES[style].map((name, i) => {
            const n = i + 1;
            return (
              <li key={`${style}-${category}-${n}`}>
                <Reveal delay={(i % 4) * 0.04}>
                  <Link href={galleryPath(style, category, n)} className="group block tap-control">
                    <DesignFrame
                      src={designSrc({ style, category, layout: n })}
                      title={name[locale]}
                      className="rounded-[1.25rem] ring-1 ring-ink-deep/10 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-18px_rgb(31_30_27/0.4)]"
                    />
                    <span className="mt-3 flex items-baseline gap-2">
                      <span className="text-[0.8125rem] tabular-nums text-ink-soft">{String(n).padStart(2, "0")}</span>
                      <span className="text-[1.0625rem] text-ink-deep group-hover:underline group-hover:decoration-champagne group-hover:decoration-2 group-hover:underline-offset-[6px]">
                        {name[locale]}
                      </span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </main>
      <SiteFooter L={L} signedIn={!!user} />
    </>
  );
}
