// Small fetch wrapper for client components: never throws, always returns a
// user-presentable error message on failure.
export async function postJson<T = Record<string, unknown>>(
  url: string,
  body?: unknown
): Promise<{ ok: true; status: number; data: T } | { ok: false; status: number; error: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
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
