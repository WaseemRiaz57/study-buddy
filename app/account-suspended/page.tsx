"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Scale, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function AccountSuspendedPage() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitAppeal = async () => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to submit appeal.");
      }

      setSubmitted(true);
      toast.success(data?.message || "Your appeal is under review.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit appeal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          <ShieldAlert size={24} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-foreground">
          Account Suspended
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your account has been suspended due to policy violations. You can
          submit an appeal below for the moderation team to review.
        </p>

        {submitted ? (
          <div className="mt-6 rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-5">
            <Scale className="mx-auto text-[#7C3AED]" size={24} />
            <h2 className="mt-3 text-lg font-bold text-foreground">
              Your appeal is under review
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Admins will review your explanation and update your account status
              if the appeal is approved.
            </p>
          </div>
        ) : (
          <div className="mt-6 text-left">
            <label className="mb-2 block text-sm font-bold text-foreground">
              Appeal Message
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={7}
              placeholder="Explain what happened and why your account should be reviewed..."
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Minimum 20 characters.
            </p>
            <button
              type="button"
              onClick={() => void submitAppeal()}
              disabled={submitting || message.trim().length < 20}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Submit Appeal
            </button>
          </div>
        )}

        <Link
          href="/login"
          className="mt-6 inline-flex rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-slate-50 hover:text-foreground dark:hover:bg-white/10"
        >
          Return to Login
        </Link>
      </section>
    </main>
  );
}
