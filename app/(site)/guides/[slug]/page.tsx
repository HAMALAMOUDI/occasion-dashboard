import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentPage from "@/components/landing/ContentPage";
import { currentUser } from "@/lib/auth";
import { GUIDES, guideBySlug } from "@/lib/content";
import { getLocale, getMessages } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const [guide, locale] = [guideBySlug((await params).slug), await getLocale()];
  if (!guide) return {};
  return { title: `${guide.title[locale]} · Hikayati · حكايتي`, description: guide.description[locale], alternates: { canonical: `/guides/${guide.slug}` } };
}

export default async function GuidePage({ params }: { params: Params }) {
  const guide = guideBySlug((await params).slug);
  if (!guide) notFound();
  const [t, locale, user] = await Promise.all([getMessages(), getLocale(), currentUser()]);
  return <ContentPage page={guide} lang={locale} L={t.landing} signedIn={!!user} related={GUIDES.filter((g) => g !== guide)} relatedBase="/guides" />;
}
