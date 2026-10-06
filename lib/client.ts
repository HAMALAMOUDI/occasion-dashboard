import { messages } from "./messages";

// Small fetch wrapper for client components: never throws, always returns a
// user-presentable error message on failure (in the page's language).
const errorText = () => messages[document.documentElement.lang === "ar" ? "ar" : "en"].errors;

type JsonResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: string };

export function postJson<T = Record<string, unknown>>(url: string, body?: unknown): Promise<JsonResult<T>> {
  return requestJson<T>("POST", url, body);
}

export async function requestJson<T = Record<string, unknown>>(
  method: "POST" | "PATCH" | "DELETE",
  url: string,
  body?: unknown
): Promise<JsonResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, error: data.error || errorText().requestFailed(res.status) };
    return { ok: true, status: res.status, data: data as T };
  } catch {
    return { ok: false, status: 0, error: errorText().network };
  }
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  // Arabic letters change shape when joined, so Arabic names get a single initial.
  if (/[\u0600-\u06FF]/.test(name)) return parts[0]?.[0] ?? "?";
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

const AVATAR_TONES = [
  "bg-pine-soft text-pine",
  "bg-brass-soft text-[#8a6326]",
  "bg-[#e8eef8] text-[#3a5a8c]",
  "bg-[#f6e6ee] text-[#9a4a6c]",
  "bg-[#ece8f6] text-[#5d4b8c]",
];

// Stable soft color per guest, so avatars don't reshuffle between renders.
export function avatarTone(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}
