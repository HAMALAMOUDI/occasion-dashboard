// Card pages are shown in sandboxed iframes; the CSP is a second layer that
// allows only inline styles, Google Fonts and our own artwork — no scripts, no other requests.
export function cardResponse(html: string, cacheControl: string) {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": cacheControl,
      "Content-Security-Policy":
        `default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'self'`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
