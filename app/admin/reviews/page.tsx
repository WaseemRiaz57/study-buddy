"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

type ReviewStatus = "pending" | "approved" | "rejected";

interface AdminReview {
  id: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string | null;
  user: {
    name: string;
    email: string;
    image?: string;
    role: string;
  };
}

function formatDate(value: string | null) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function statusClass(status: ReviewStatus) {
  if (status === "approved") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }

  if (status === "rejected") {
    return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400";
  }

  return "border-yellow-500/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export default function AdminReviewsPage() {
  const requestConfirmation = useConfirmDialog();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/reviews", { cache: "no-store" });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch reviews.");
      }

      setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch reviews."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const updateStatus = async (review: AdminReview, status: ReviewStatus) => {
    try {
      setBusyId(review.id);
      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update review.");
      }

      toast.success(data?.message || "Review updated.");
      await fetchReviews();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update review."
      );
    } finally {
      setBusyId(null);
    }
  };

  const deleteReview = async (review: AdminReview) => {
    const confirmed = await requestConfirmation({
      title: "Delete review?",
      description: `The review from ${review.user.name} will be permanently removed.`,
      confirmLabel: "Delete review",
    });
    if (!confirmed) return;

    try {
      setBusyId(review.id);
      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete review.");
      }

      toast.success(data?.message || "Review deleted.");
      await fetchReviews();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete review."
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7C3AED]">
          Community Trust
        </p>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Platform Reviews
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Approve user feedback to publish it on the landing page testimonials
          carousel.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-4 font-bold">User</th>
                <th className="px-5 py-4 font-bold">Rating</th>
                <th className="px-5 py-4 font-bold">Comment</th>
                <th className="px-5 py-4 font-bold">Date</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#7C3AED]" />
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    No reviews submitted yet.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] text-xs font-bold text-white">
                          {review.user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={review.user.image}
                              alt={`${review.user.name} profile picture`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials(review.user.name)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">
                            {review.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {review.user.email || review.user.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-0.5 text-yellow-400">
                        {Array.from({ length: review.rating }).map((_, index) => (
                          <Star
                            key={index}
                            size={15}
                            fill="currentColor"
                          />
                        ))}
                      </div>
                    </td>
                    <td className="max-w-sm px-5 py-4">
                      <p className="line-clamp-3 text-muted-foreground">
                        {review.comment}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusClass(
                          review.status
                        )}`}
                      >
                        {review.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busyId === review.id}
                          onClick={() => updateStatus(review, "approved")}
                          className="rounded-lg p-2 text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                          title="Approve"
                        >
                          <Check size={17} />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === review.id}
                          onClick={() => updateStatus(review, "rejected")}
                          className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                          title="Reject"
                        >
                          <X size={17} />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === review.id}
                          onClick={() => deleteReview(review)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
