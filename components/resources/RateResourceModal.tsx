"use client";

import { useState } from "react";
import { Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";

type RateResourceModalProps = {
  resourceId: string | null;
  resourceTitle?: string;
  onClose: () => void;
  onRated?: (averageRating: number, ratingCount: number, review?: unknown) => void;
};

export default function RateResourceModal({
  resourceId,
  resourceTitle,
  onClose,
  onRated,
}: RateResourceModalProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!resourceId) return null;

  const submitRating = async () => {
    if (!score || isSaving) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/resources/${resourceId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save rating.");
      }

      onRated?.(
        Number(data?.averageRating || 0),
        Number(data?.ratingCount || 0),
        data?.review
      );
      toast.success(data?.message || "Thanks for rating this resource.");
      setScore(0);
      setComment("");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save rating.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Rate this resource"
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#191121]"
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
              Rate this Resource
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
              How useful was it?
            </h2>
            {resourceTitle && (
              <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                {resourceTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close rating modal"
          >
            <X size={18} />
          </button>
        </header>

        <div className="mb-5 flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;
            const active = value <= score;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setScore(value)}
                className="rounded-lg p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
              >
                <Star
                  size={32}
                  className={
                    active
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300 dark:text-slate-600"
                  }
                />
              </button>
            );
          })}
        </div>

        <label className="mb-5 block">
          <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
            Review
          </span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Share what helped, what was missing, or who this is best for..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </label>

        <button
          type="button"
          onClick={() => void submitRating()}
          disabled={!score || isSaving}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          Submit Review
        </button>
      </section>
    </div>
  );
}
