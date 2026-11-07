// URL helpers for rendered cards, usable from both server and client components.

export function designSrc(params: Record<string, string | number | null | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== "") q.set(k, String(v));
  return `/api/designs/render?${q}`;
}

// Short stable hash, used as a ?v= cache-buster when a saved design changes.
export function versionOf(value: unknown) {
  let h = 5381;
  for (const ch of JSON.stringify(value)) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
}

// The public page for one design.
export function galleryPath(style: string, category: string, layout: number) {
  return `/gallery/${style}/${category}/${layout}`;
}

// Opens one design in the portal's gallery, ready to apply to an event; visitors sign in first.
export function pickDesignHref(signedIn: boolean, params: { style: string; category: string; layout: number; palette?: number | null }) {
  const portal = `/designs?${new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) => (v === null || v === undefined ? [] : [[k, String(v)]]))
  )}`;
  return signedIn ? portal : `/login?next=${encodeURIComponent(portal)}`;
}
