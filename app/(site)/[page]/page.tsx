import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentPage from "@/components/landing/ContentPage";
import { currentUser } from "@/lib/auth";
import { pageBySlug } from "@/lib/content";
import { getLocale, getMessages } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

type Params = Promise<{ page: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const [page, locale] = [pageBySlug((await params).page), await getLocale()];
  if (!page) return {};
  return { title: `${page.title[locale]} · Hikayati · حكايتي`, description: page.description[locale], alternates: { canonical: `/${page.slug}` } };
}

// Policies, product pages, city pages and About, all from lib/content.ts.
export default async function Page({ params }: { params: Params }) {
  const page = pageBySlug((await params).page);
  if (!page) notFound();
  const [t, locale, user] = await Promise.all([getMessages(), getLocale(), currentUser()]);
  return <ContentPage page={page} lang={locale} L={t.landing} signedIn={!!user} />;
}
