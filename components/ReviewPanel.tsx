"use client";

import { useEffect, useState } from "react";
import { MessageSquareHeart, Star } from "lucide-react";
import { postJson } from "@/lib/client";
import type { Review } from "@/lib/types";
import { useT } from "./I18nProvider";

// After the occasion, the organizer can tell us (and other families) how it went.
export default function ReviewPanel({ eventId }: { eventId: string }) {
  const t = useT();
  const T = t.review;
  const [review, setReview] = useState<Review | null | undefined>(undefined);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/events/${eventId}/review`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setReview)
      .catch(() => setReview(null));
  }, [eventId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await postJson<Review>(`/api/events/${eventId}/review`, { author, rating, body });
    setBusy(false);
    if (res.ok) setReview(res.data);
    else setError(res.error);
  }

  if (review === undefined) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <MessageSquareHeart size={17} className="text-brass" />
        <h3 className="font-medium">{T.title}</h3>
      </div>

      {review ? (
        <div className="mt-3">
          <p className="text-sm">{T.thanks}</p>
          <p className="mt-2 text-xs text-muted">{T.status[review.status]}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-1 space-y-3">
          <p className="text-xs text-muted">{T.intro}</p>
          <fieldset>
            <legend className="label">{T.rating}</legend>
            <div className="flex gap-1" role="radiogroup" aria-label={T.rating}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={T.stars(n)}
                  onClick={() => setRating(n)}
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper"
                >
                  <Star size={20} className={n <= rating ? "fill-brass text-brass" : "text-line"} />
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="review-body" className="label">
              {T.body}
            </label>
            <textarea id="review-body" dir="auto" rows={3} maxLength={600} value={body} onChange={(e) => setBody(e.target.value)} className="input resize-none" />
          </div>
          <div>
            <label htmlFor="review-author" className="label">
              {T.author}
            </label>
            <input id="review-author" dir="auto" maxLength={60} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={T.authorPlaceholder} className="input" />
          </div>
          {error && <p className="text-xs text-decline">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary btn-sm">
            {busy ? T.sending : T.submit}
          </button>
        </form>
      )}
    </div>
  );
}
