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
