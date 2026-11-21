"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AuthFrame from "@/components/landing/AuthFrame";
import PasswordInput from "@/components/landing/PasswordInput";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if (step !== 2 || resendTimer <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setResendTimer((currentTimer) => Math.max(0, currentTimer - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [step, resendTimer]);

  const sendOtp = async (successMessage = "Password reset code sent!") => {
    const response = await fetch("/api/auth/forgot-password/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send reset code.");
    }

    setStep(2);
    setResendTimer(60);
    toast.success(successMessage);
  };

  const resetPassword = async () => {
    const response = await fetch("/api/auth/forgot-password/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to reset password.");
    }

    toast.success("Password reset successfully!");
    router.push("/login");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (step === 1) {
        await sendOtp();
      } else {
        await resetPassword();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);

    try {
      await sendOtp("Verification code resent!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthFrame
      backHref="/login"
      backLabel="Back to log in"
      aside={{
        quote: "Locked out the night before an exam?",
        note: "Reset your password with a code sent to your email. Your notes, rooms and streak stay exactly where you left them.",
      }}
    >
      <h1 className="lamp-h2">{step === 1 ? "Reset your password" : "Enter your reset code"}</h1>
      <p className="mt-3 text-[var(--lamp-graphite)]">
        {step === 1 ? (
          "Enter the email on your StudyBuddy account and we'll send you a 6-digit code."
        ) : (
          <>
            We sent a 6-digit code to <span className="break-all text-[var(--lamp-paper)]">{email}</span>. It may land
            in spam.
          </>
        )}
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        {step === 1 ? (
          <div>
            <label htmlFor="fp-email" className="lamp-label">
              Email
            </label>
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@university.edu"
              className="lamp-input"
            />
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="fp-otp" className="lamp-label">
                Reset code
              </label>
              <input
                id="fp-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                autoComplete="one-time-code"
                placeholder="000000"
                required
                className="lamp-input lamp-serif text-center !text-[1.75rem] tracking-[0.4em] tabular-nums"
              />
              <div className="mt-3 flex justify-end text-sm">
                <button
                  type="button"
                  aria-label={
                    resendTimer > 0 ? `Resend code available in ${resendTimer} seconds` : "Resend password reset code"
                  }
                  disabled={resendTimer > 0 || isResending || isLoading}
                  onClick={handleResend}
                  className="lamp-link inline-flex items-center gap-2 tabular-nums disabled:cursor-not-allowed disabled:bg-none disabled:text-[var(--lamp-graphite)]"
                >
                  {isResending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {isResending ? "Resending…" : resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="fp-new" className="lamp-label">
                New password
              </label>
              <PasswordInput
                id="fp-new"
                toggleLabel="new password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                aria-describedby="fp-new-hint"
              />
              <p id="fp-new-hint" className="mt-2 text-sm text-[var(--lamp-graphite)]">
                At least 8 characters.
              </p>
            </div>
          </>
        )}

        <button type="submit" disabled={isLoading} className="lamp-btn lamp-btn-primary w-full">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isLoading
            ? step === 1
              ? "Sending code…"
              : "Resetting password…"
            : step === 1
              ? "Send reset code"
              : "Reset password"}
        </button>
      </form>
    </AuthFrame>
  );
}
