"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment: string;
  user: { name: string; role: string; image?: string; initials?: string };
};

/**
 * Approved reviews from /api/reviews/public. Renders nothing until there is at
 * least one, so the page never shows an empty "testimonials" shell.
 */
export default function Voices() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    let live = true;
    fetch("/api/reviews/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!live || !Array.isArray(data?.reviews)) return;
        setReviews(data.reviews.filter((r: Review) => r.comment && r.comment.length > 20));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (reviews.length === 0) return null;

  const r = reviews[i % reviews.length];
  const go = (d: number) => setI((v) => (v + d + reviews.length) % reviews.length);

  return (
    <section className="lamp-section border-t border-[var(--lamp-rule)]" aria-labelledby="voices-title">
      <div className="lamp-wrap grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="voices-title" className="lamp-h2">
            From people who use it.
          </h2>
          {reviews.length > 1 && (
            <div className="mt-10 flex items-center gap-3">
              <button type="button" onClick={() => go(-1)} className="lamp-btn lamp-btn-ghost !min-h-11 !px-5" aria-label="Previous review">
                Previous
              </button>
              <button type="button" onClick={() => go(1)} className="lamp-btn lamp-btn-ghost !min-h-11 !px-5" aria-label="Next review">
                Next
              </button>
              <span className="ml-2 text-sm tabular-nums text-[var(--lamp-graphite)]" aria-live="polite">
                {(i % reviews.length) + 1} of {reviews.length}
              </span>
            </div>
          )}
        </div>

        <div className="min-h-[18rem] lg:col-span-7 lg:col-start-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.figure
              key={r.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.2, 0.7, 0.1, 1] }}
            >
              <div className="mb-6 flex gap-1 text-[var(--lamp-marker)]" role="img" aria-label={`Rated ${Math.max(1, Math.min(5, r.rating))} out of 5`}>
                {Array.from({ length: Math.max(1, Math.min(5, r.rating)) }).map((_, j) => (
                  <Star key={j} className="h-4 w-4" fill="currentColor" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="lamp-serif text-[clamp(1.6rem,2.8vw,2.4rem)] leading-[1.22] tracking-[-0.012em] text-pretty">
                &ldquo;{r.comment.replace(/^["']|["']$/g, "")}&rdquo;
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4 text-[var(--lamp-graphite)]">
                <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--lamp-rule-strong)] bg-[var(--lamp-desk)] text-sm text-[var(--lamp-paper)]">
                  {r.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.user.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    r.user.initials || r.user.name.slice(0, 1).toUpperCase()
                  )}
                </span>
                <span>
                  <span className="block text-[var(--lamp-paper)]">{r.user.name}</span>
                  {r.user.role === "mentor" ? "Mentor" : "Student"}
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
