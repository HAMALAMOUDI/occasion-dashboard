"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Star } from "lucide-react";
import { requestJson } from "@/lib/client";
import { formatDateTime } from "@/lib/i18n";
import { useLocale, useT } from "@/components/I18nProvider";
import type { Review } from "@/lib/types";

// Admins read organizers' reviews and choose which appear on the landing page.
export default function ReviewsAdminPage() {
  const t = useT();
  const T = t.review;
  const locale = useLocale();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/reviews")
      .then(async (r) => (r.ok ? r.json() : Promise.reject((await r.json().catch(() => ({}))).error)))
      .then(setReviews)
      .catch((e) => setError(typeof e === "string" ? e : t.errors.network));
  }, [t]);
  useEffect(load, [load]);

  async function setStatus(id: string, status: Review["status"]) {
    const res = await requestJson("PATCH", `/api/reviews/${id}`, { status });
    if (!res.ok) setError(res.error);
    load();
  }

  return (
    <div className="animate-fade-up">
      <h1 className="font-serif text-3xl sm:text-4xl">{T.adminTitle}</h1>
      <p className="mt-2 text-muted">{T.adminIntro}</p>
      {error && <p className="mt-4 rounded-xl bg-decline-bg px-4 py-3 text-sm text-decline">{error}</p>}
      {reviews && reviews.length === 0 && <p className="mt-8 text-muted">{T.none}</p>}
      <ul className="mt-8 space-y-4">
        {reviews?.map((r) => (
          <li key={r.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1" aria-label={T.stars(r.rating)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={16} className={n <= r.rating ? "fill-brass text-brass" : "text-line"} />
                ))}
              </div>
              <span className="text-xs text-muted">
                {T.status[r.status]} · {formatDateTime(r.createdAt, locale)}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line" dir="auto">
              {r.body}
            </p>
            <p className="mt-2 text-sm text-muted" dir="auto">
              — {r.author} · <span dir="ltr">{r.ownerPhone}</span>
            </p>
            <div className="mt-4 flex gap-2">
              {r.status !== "approved" && (
                <button onClick={() => setStatus(r.id, "approved")} className="btn-primary btn-sm">
                  <Eye size={14} /> {T.approve}
                </button>
              )}
              {r.status !== "hidden" && (
                <button onClick={() => setStatus(r.id, "hidden")} className="btn-secondary btn-sm">
                  <EyeOff size={14} /> {T.hide}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
