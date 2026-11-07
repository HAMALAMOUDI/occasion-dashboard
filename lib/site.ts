// The site's public address, for the sitemap, robots and canonical links.
export const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://occasion-dashboard.vercel.app")
).replace(/\/$/, "");
