import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/landing/SiteChrome";
import { currentUser } from "@/lib/auth";
import { GUIDES } from "@/lib/content";
import { getLocale, getMessages } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: `${t.landing.page.guidesTitle} · Hikayati · حكايتي`, description: t.landing.page.guidesBody, alternates: { canonical: "/guides" } };
}

// Every guide, with a line on what it helps with.
export default async function GuidesPage() {
  const [t, locale, user] = await Promise.all([getMessages(), getLocale(), currentUser()]);
  const L = t.landing;
  return (
    <>
      <SiteHeader L={L} signedIn={!!user} />
      <main className="px-safe pb-[clamp(5rem,10vw,8rem)] pt-[clamp(3rem,8vw,6rem)]">
        <div className="mx-auto max-w-[44rem]">
          <h1 className="font-editorial text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.02em] rtl:tracking-normal">{L.page.guidesTitle}</h1>
          <p className="mt-6 text-[1.25rem] leading-[1.6] text-ink-deep">{L.page.guidesBody}</p>
          <ul className="mt-12 border-t border-ink-deep/15">
            {GUIDES.map((g) => (
              <li key={g.slug} className="border-b border-ink-deep/15">
                <Link href={`/guides/${g.slug}`} className="group tap-control block py-8">
                  <h2 className="font-editorial text-[clamp(1.75rem,3vw,2.25rem)] font-medium leading-tight group-hover:underline group-hover:decoration-champagne group-hover:decoration-2 group-hover:underline-offset-[6px]">
                    {g.title[locale]}
                  </h2>
                  <p className="mt-3 text-[1.0625rem] leading-[1.6] text-ink-soft">{g.description[locale]}</p>
                  {g.minutes && <p className="mt-2 text-[0.875rem] text-ink-soft">{L.page.minutes(g.minutes)}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter L={L} signedIn={!!user} />
    </>
  );
}
