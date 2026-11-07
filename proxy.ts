import { NextRequest, NextResponse } from "next/server";

// Optimistic check only: sends visitors without a session cookie to /login
// before rendering anything. The real session check happens in the portal
// layout and in every API route (lib/auth.ts).
const SESSION_COOKIE = "occasion_session";

export function proxy(request: NextRequest) {
  // The landing page at / and the design gallery are public.
  const path = request.nextUrl.pathname;
  if (path === "/" || path === "/gallery" || path.startsWith("/gallery/") || request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const login = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  // Pages only — API routes answer 401 themselves; the webhook and cron have their own auth.
  matcher: ["/((?!api|login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|xlsx)$).*)"],
};
