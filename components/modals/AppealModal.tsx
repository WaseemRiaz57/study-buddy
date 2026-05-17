"use client";

import { useEffect, useState } from "react";
import { Loader2, Scale, X } from "lucide-react";
import { toast } from "sonner";

export default function AppealModal({
  isOpen,
  logId,
  title = "Submit Appeal",
  onClose,
  onSubmitted,
}: {
  isOpen: boolean;
  logId?: string | null;
  title?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMessage("");
  }, [isOpen, logId]);

  if (!isOpen) return null;

  const submitAppeal = async () => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId: logId || undefined, message }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to submit appeal.");
      }

      toast.success(data?.message || "Your appeal is under review.");
      onSubmitted?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit appeal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-2xl dark:bg-[#1a0f26]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED]">
              <Scale size={18} />
            </div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explain what happened and why the moderation team should review this action.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-white/10"
            aria-label="Close appeal modal"
          >
            <X size={18} />
          </button>
        </div>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          placeholder="Write your appeal..."
          className="mt-5 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Minimum 20 characters.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-slate-50 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submitAppeal()}
            disabled={submitting || message.trim().length < 20}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Submit Appeal
          </button>
        </div>
      </div>
    </div>
  );
}
