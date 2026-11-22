"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Wordmark } from "@/components/landing/LandingNav";
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

  const remaining = Math.max(0, 20 - message.trim().length);

  return (
    <main className="lamp-wrap flex min-h-[100dvh] items-center py-16">
      <div className="grid w-full gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Link href="/" aria-label="StudyBuddy home" className="inline-block">
            <Wordmark />
          </Link>
          <h1 className="lamp-h2 mt-14">Your account is suspended.</h1>
          <p className="lamp-lead mt-6 max-w-[30rem]">
            A moderator suspended this account for breaking the community rules. If you think that was
            a mistake, tell us what happened. A person on the moderation team reviews every appeal.
          </p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          {submitted ? (
            <div className="lamp-panel p-8" role="status">
              <p className="lamp-h3">
                <span className="lamp-hl is-on">Appeal sent</span>
              </p>
              <p className="mt-4 text-[var(--lamp-graphite)]">
                The moderation team will review your explanation. If the appeal is approved, your account is
                restored and you can log in as normal.
              </p>
            </div>
          ) : (
            <div className="lamp-panel p-6 sm:p-8">
              <label htmlFor="appeal" className="lamp-label">
                Your appeal
              </label>
              <textarea
                id="appeal"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={8}
                placeholder="Explain what happened and why the suspension should be reviewed."
                aria-describedby="appeal-hint"
                className="lamp-input resize-y leading-relaxed"
              />
              <p id="appeal-hint" className="mt-2 text-sm text-[var(--lamp-graphite)]" aria-live="polite">
                {remaining > 0 ? `${remaining} more characters needed` : "Ready to send"}
              </p>
              <button
                type="button"
                onClick={() => void submitAppeal()}
                disabled={submitting || message.trim().length < 20}
                className="lamp-btn lamp-btn-primary mt-6 w-full"
              >
                {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {submitting ? "Sending appeal…" : "Send appeal"}
              </button>
            </div>
          )}

          <Link href="/login" className="lamp-link mt-8 inline-block text-[var(--lamp-graphite)] hover:text-[var(--lamp-paper)]">
            Back to log in
          </Link>
        </div>
      </div>
    </main>
  );
}
