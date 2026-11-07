import Link from "next/link";
import { InviteButton, SiteFooter, SiteHeader, createHref } from "@/components/landing/SiteChrome";
import type { ContentPage as Page } from "@/lib/content";
import { formatDate } from "@/lib/i18n";
import type { Messages } from "@/lib/messages";
import type { Lang } from "@/lib/occasions";

// A policy, product, city or guide page: title, sections, questions, then the way to begin.
export default function ContentPage({
  page,
  lang,
  L,
  signedIn,
  related = [],
  relatedBase = "",
}: {
  page: Page;
  lang: Lang;
  L: Messages["landing"];
  signedIn: boolean;
  related?: Page[];
  relatedBase?: string;
}) {
  const P = L.page;
  const meta = [page.updated && P.updated(formatDate(page.updated, lang)), page.minutes && P.minutes(page.minutes)].filter(Boolean).join(" · ");
  // Questions are marked up for search engines as well as shown.
  const faqLd = page.faq && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((f) => ({ "@type": "Question", name: f.q[lang], acceptedAnswer: { "@type": "Answer", text: f.a[lang] } })),
  };

  return (
    <>
      <SiteHeader L={L} signedIn={signedIn} />
      <main className="px-safe pb-[clamp(5rem,10vw,8rem)] pt-[clamp(3rem,8vw,6rem)]">
        <article className="mx-auto max-w-[44rem]">
          <header>
            <p className="text-[0.9375rem] uppercase tracking-[0.16em] text-ink-soft rtl:tracking-normal">{page.eyebrow[lang]}</p>
            <h1 className="mt-4 font-editorial text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.02em] rtl:tracking-normal">{page.title[lang]}</h1>
            <p className="mt-6 text-[1.25rem] leading-[1.6] text-ink-deep">{page.description[lang]}</p>
            {meta && <p className="mt-4 text-[0.9375rem] text-ink-soft">{meta}</p>}
          </header>

          {page.sections.map((s) => (
            <section key={s.heading.en} className="mt-12 border-t border-ink-deep/15 pt-8">
              <h2 className="font-editorial text-[clamp(1.75rem,3vw,2.25rem)] font-medium leading-tight">{s.heading[lang]}</h2>
              {s.paragraphs?.map((p) => (
                <p key={p.en} className="mt-4 text-[1.125rem] leading-[1.75] text-ink-deep">
                  {p[lang]}
                </p>
              ))}
              {s.bullets && (
                <ul className="mt-4 list-disc space-y-2 ps-6 text-[1.125rem] leading-[1.7] text-ink-deep marker:text-gold-ink">
                  {s.bullets.map((b) => (
                    <li key={b.en}>{b[lang]}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {page.faq && (
            <section className="mt-12 border-t border-ink-deep/15 pt-8">
              <h2 className="font-editorial text-[clamp(1.75rem,3vw,2.25rem)] font-medium">{P.faq}</h2>
              {page.faq.map((f) => (
                <details key={f.q.en} className="group border-b border-ink-deep/15">
                  <summary className="tap-control flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.125rem] text-ink-deep [&::-webkit-details-marker]:hidden">
                    {f.q[lang]}
                    <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bone text-[1.25rem] leading-none transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 text-[1.0625rem] leading-[1.7] text-ink-soft">{f.a[lang]}</p>
                </details>
              ))}
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} />
            </section>
          )}

          {related.length > 0 && (
            <nav aria-labelledby="related-title" className="mt-12 border-t border-ink-deep/15 pt-8">
              <h2 id="related-title" className="font-editorial text-[clamp(1.75rem,3vw,2.25rem)] font-medium">
                {P.moreGuides}
              </h2>
              <ul className="mt-4 space-y-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`${relatedBase}/${r.slug}`} className="tap-control text-[1.125rem] text-ink-deep underline decoration-champagne decoration-2 underline-offset-[6px] hover:no-underline">
                      {r.title[lang]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {page.kind !== "legal" && (
            <aside className="mt-16 bg-bone p-8 sm:p-10">
              <h2 className="font-editorial text-[clamp(2rem,4vw,2.75rem)] font-medium leading-tight">{P.ctaTitle}</h2>
              <p className="mt-3 text-[1.125rem] leading-[1.6] text-ink-deep">{P.ctaBody}</p>
              <InviteButton href={createHref(signedIn)} className="mt-8 flex w-full sm:inline-flex sm:w-auto">
                {L.create}
              </InviteButton>
            </aside>
          )}
        </article>
      </main>
      <SiteFooter L={L} signedIn={signedIn} />
    </>
  );
}
