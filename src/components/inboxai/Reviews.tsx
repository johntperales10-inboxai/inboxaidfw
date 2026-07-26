import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  first_name: string;
  rating: number;
  body: string;
  created_at: string;
}

function Stars({ value, onChange, size = 18 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const interactive = !!onChange;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(n)}
            className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}
            />
          </button>
        );
      })}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const MAX = 300;

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: selErr } = await supabase
          .from("reviews")
          .select("id, first_name, rating, body, created_at")
          .order("created_at", { ascending: false })
          .limit(60);
        if (cancelled) return;
        if (selErr) {
          console.error("Failed to load reviews", selErr);
          setReviews([]);
        } else {
          setReviews((data as Review[]) ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load reviews", err);
          setReviews([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = firstName.trim();
    const text = body.trim();
    if (!name || !text || rating < 1) {
      setError("Please fill in all fields and pick a star rating.");
      return;
    }
    if (text.length > MAX) {
      setError(`Review must be under ${MAX} characters.`);
      return;
    }
    setSubmitting(true);
    const { data, error: insErr } = await supabase
      .from("reviews")
      .insert({ first_name: name, rating, body: text })
      .select()
      .single();
    setSubmitting(false);
    if (insErr || !data) {
      setError("Couldn't save your review. Please try again.");
      return;
    }
    setReviews((r) => [data as Review, ...r]);
    setFirstName("");
    setRating(0);
    setBody("");
    setThanks(true);
  };

  const remaining = MAX - body.length;

  return (
    <div className="mt-24">
      <h2 className="text-center text-3xl sm:text-4xl font-bold tracking-tight">
        What customers are saying
      </h2>
      <p className="mt-3 text-center text-muted-foreground">Real reviews from real people</p>

      <div className="mt-10">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground">Be the first to leave a review!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="p-5 rounded-2xl bg-card/60 border border-border">
                <Stars value={r.rating} />
                <p className="mt-3 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                  {r.body}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  {r.first_name} · {formatDate(r.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 max-w-xl mx-auto p-6 rounded-2xl bg-card border border-border">
        <h3 className="text-xl font-semibold">Leave a review</h3>
        {thanks && (
          <div className="mt-4 px-4 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            Thank you for your review! It is now visible to everyone.
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm mb-1.5">First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              maxLength={50}
              required
              className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5">Your rating</label>
            <Stars value={rating} onChange={setRating} size={26} />
          </div>
          <div>
            <label className="block text-sm mb-1.5">Your review</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX))}
              placeholder="Tell others about your experience..."
              required
              rows={4}
              className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:border-primary/50 resize-none"
            />
            <p className={`mt-1 text-xs text-right ${remaining < 30 ? "text-yellow-400" : "text-muted-foreground"}`}>
              {remaining} characters left
            </p>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post my review"}
          </button>
        </form>
      </div>
    </div>
  );
}
