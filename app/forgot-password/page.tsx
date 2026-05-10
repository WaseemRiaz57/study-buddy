"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col justify-center">
        <Link
          href="/login"
          className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-purple-600"
        >
          <ArrowLeft className="h-4 w-4" aria-label="Back to login icon" />
          Back to login
        </Link>

        <article className="rounded-3xl border border-purple-600/20 bg-card p-8 shadow-xl">
          <header className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-600/30 bg-purple-600/10 text-purple-600">
              <ShieldCheck className="h-8 w-8" aria-label="Password reset security icon" />
            </div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
              Password Recovery
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {step === 1 ? "Reset your password" : "Enter your reset code"}
            </h1>
            <p className="mt-3 min-h-[48px] text-sm leading-6 text-muted-foreground">
              {step === 1
                ? "Enter the email linked to your StudyBuddy account and we will send a secure reset code."
                : `We sent a 6-digit code to ${email}.`}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="min-h-[270px] space-y-5">
            {step === 1 ? (
              <label className="block space-y-2">
                <span className="text-sm font-bold text-foreground">Email Address</span>
                <span className="relative block">
                  <Mail
                    className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                    aria-label="Email input icon"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-label="Email address"
                    placeholder="scholar@studybuddy.com"
                    className="w-full rounded-2xl border border-border bg-background px-12 py-4 text-sm outline-none transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                  />
                </span>
              </label>
            ) : (
              <section className="space-y-5" aria-label="Reset password form">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-foreground">Reset Code</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    aria-label="Enter OTP"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    required
                    className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-center text-2xl font-black tracking-[0.45em] outline-none transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 tabular-nums"
                  />
                </label>

                <div className="flex h-10 items-center justify-center">
                  <button
                    type="button"
                    aria-label={
                      resendTimer > 0
                        ? `Resend code available in ${resendTimer} seconds`
                        : "Resend password reset code"
                    }
                    disabled={resendTimer > 0 || isResending || isLoading}
                    onClick={handleResend}
                    className="inline-flex min-w-[190px] items-center justify-center rounded-lg px-4 py-2 text-sm font-bold text-purple-600 transition-colors hover:bg-purple-600/10 focus:outline-none focus:ring-2 focus:ring-purple-600/20 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Resending...
                      </>
                    ) : resendTimer > 0 ? (
                      <span className="inline-block min-w-[150px] text-center tabular-nums">
                        Resend code in {resendTimer}s
                      </span>
                    ) : (
                      "Resend Code"
                    )}
                  </button>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-foreground">New Password</span>
                  <span className="relative block">
                    <Lock
                      className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                      aria-label="New password input icon"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      aria-label="New password"
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-2xl border border-border bg-background px-12 py-4 text-sm outline-none transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-purple-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </span>
                </label>
              </section>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-purple-600/20 transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
              {isLoading
                ? step === 1
                  ? "Sending Code..."
                  : "Resetting..."
                : step === 1
                  ? "Send Reset Code"
                  : "Reset Password"}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
