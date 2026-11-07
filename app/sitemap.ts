import type { MetadataRoute } from "next";
import { GUIDES, PAGES } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

// Only the public site; personal invitation pages and the portal stay out.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/gallery", "/guides", ...PAGES.map((p) => `/${p.slug}`), ...GUIDES.map((g) => `/guides/${g.slug}`)];
  return paths.map((p) => ({ url: `${SITE_URL}${p === "/" ? "" : p}`, changeFrequency: "monthly", priority: p === "/" ? 1 : 0.6 }));
}
