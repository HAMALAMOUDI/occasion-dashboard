// Small fetch wrapper for client components: never throws, always returns a
// user-presentable error message on failure.
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
    if (!res.ok) return { ok: false, status: res.status, error: data.error || `Request failed (${res.status})` };
    return { ok: true, status: res.status, data: data as T };
  } catch {
    return { ok: false, status: 0, error: "Network error — check your connection and try again." };
  }
}

// Event dates are stored as calendar dates (YYYY-MM-DD). Format them in UTC so
// they don't shift by a day in timezones west of Greenwich.
export function formatEventDate(eventDate: string) {
  return new Date(eventDate).toLocaleDateString(undefined, { dateStyle: "medium", timeZone: "UTC" });
}

export function formatEventDateLong(eventDate: string) {
  return new Date(eventDate).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
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

export function formatSar(amount: number) {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
}
