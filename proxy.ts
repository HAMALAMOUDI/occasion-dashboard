import { NextRequest, NextResponse } from "next/server";
import { PAGES } from "@/lib/content";

// Optimistic check only: sends visitors without a session cookie to /login
// before rendering anything. The real session check happens in the portal
// layout and in every API route (lib/auth.ts).
const SESSION_COOKIE = "occasion_session";

// The public site: the landing, the design gallery, guests' invitation pages,
// policies, guides and the content pages in lib/content.ts.
const PUBLIC_PREFIXES = ["/gallery", "/i/", "/guides"];
const PUBLIC_PAGES = new Set(["/", ...PAGES.map((p) => `/${p.slug}`)]);

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (PUBLIC_PAGES.has(path) || PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`)) || request.cookies.has(SESSION_COOKIE))
    return NextResponse.next();

  const login = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  // Pages only — API routes answer 401 themselves; the webhook and cron have their own auth.
  matcher: ["/((?!api|login|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|ico|xlsx)$).*)"],
};
