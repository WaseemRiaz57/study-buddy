"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";

type ReviewSubmitResult = {
  message?: string;
  session?: {
    _id: string;
    status: "pending" | "accepted" | "declined" | "rejected" | "completed";
  };
  mentorProfile?: {
    rating?: number;
    totalReviews?: number;
    totalEarnings?: number;
  };
};

type ReviewModalProps = {
  isOpen: boolean;
  sessionId: string;
  mentorName: string;
  subject: string;
  onClose: () => void;
  onSubmitted: (result: ReviewSubmitResult) => void;
};

export default function ReviewModal({
  isOpen,
  sessionId,
  mentorName,
  subject,
  onClose,
  onSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setRating(0);
    setHoverRating(0);
    setComment("");
    setIsSubmitting(false);
  }, [isOpen, sessionId]);

  async function handleSubmit() {
    if (!rating || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/sessions/${sessionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      const data = (await response.json().catch(() => null)) as
        | ReviewSubmitResult
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Could not submit your review.");
      }

      onSubmitted(data ?? {});
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit your review."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white p-6 shadow-2xl dark:bg-[#100b17]"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Session Review
                </p>
                <h2
                  id="review-modal-title"
                  className="mt-2 text-2xl font-black tracking-tight text-foreground"
                >
                  Rate your mentor
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {subject} with {mentorName}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full border border-border/70 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close review modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-sm font-bold text-foreground">
                How was the session?
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = star <= (hoverRating || rating);

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      disabled={isSubmitting}
                      className="rounded-xl p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`${star} star${star === 1 ? "" : "s"}`}
                    >
                      <Star
                        size={34}
                        className={
                          isActive
                            ? "fill-purple-600 text-purple-600"
                            : "text-gray-300 dark:text-slate-700"
                        }
                        fill={isActive ? "currentColor" : "none"}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mb-2 block text-sm font-bold text-foreground">
              Comment
            </label>
            <textarea
              aria-label="Review comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={isSubmitting}
              rows={5}
              maxLength={1000}
              placeholder="Share what helped, what could improve, or what stood out."
              className="min-h-[132px] w-full resize-none rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-border/70 px-5 py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Not Now
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!rating || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/20 transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Submit Review
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

