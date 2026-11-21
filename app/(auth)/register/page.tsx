"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import AuthFrame, { Divider, GoogleIcon } from "@/components/landing/AuthFrame";
import PasswordInput from "@/components/landing/PasswordInput";

export default function RegisterPage() {
  const [role, setRole] = useState<"student" | "mentor">("student");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const roles = [
    { id: "student" as const, title: "Student", description: "Learn, join rooms and track progress." },
    { id: "mentor" as const, title: "Mentor", description: "Guide others, host sessions and earn." },
  ];

  useEffect(() => {
    if (step !== 2 || resendTimer <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setResendTimer((currentTimer) => Math.max(0, currentTimer - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [step, resendTimer]);

  const handleSendOtp = async () => {
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    setPasswordError("");

    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send verification code.");
    }

    setStep(2);
    setResendTimer(60);
    toast.success("Verification code sent! Please also check your spam/junk folder.");
  };

  const handleResend = async () => {
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend verification code.");
      }

      setResendTimer(60);
      toast.success("Verification code resent!");
    } catch (error) {
      console.error("Resend OTP Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not resend the verification code."
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleCreateAccount = async () => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role,
        otp,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed. Please try again.");
    }

    toast.success("Account verified and created!");
    window.location.href = "/login";
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (step === 1 && formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      if (step === 1) {
        await handleSendOtp();
      } else {
        await handleCreateAccount();
      }
    } catch (error) {
      console.error("Registration Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Network error. Please check your internet or MongoDB IP whitelist."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    setIsLoading(true);
    document.cookie = `intended_role=${role}; path=/; max-age=300`;
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <AuthFrame
      aside={{
        quote: "Your first study session is a few minutes away.",
        note: "Free plan, no card needed. Upload a lecture and get notes and a quiz before your coffee cools.",
      }}
    >
      <h1 className="lamp-h2">{step === 1 ? "Create your account" : "Check your email"}</h1>
      <p className="mt-3 text-[var(--lamp-graphite)]">
        {step === 1 ? (
          <>
            Already have one?{" "}
            <Link href="/login" className="lamp-link text-[var(--lamp-paper)]">
              Log in
            </Link>
          </>
        ) : (
          <>
            We sent a 6-digit code to <span className="break-all text-[var(--lamp-paper)]">{formData.email}</span>. It
            may land in spam.
          </>
        )}
      </p>

      <form onSubmit={handleRegister} className="mt-10 space-y-5">
        {step === 1 ? (
          <>
            <fieldset>
              <legend className="lamp-label">I&rsquo;m joining as</legend>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((r) => {
                  const selected = role === r.id;
                  return (
                    <label
                      key={r.id}
                      className={`relative cursor-pointer rounded-[10px] border p-4 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--lamp-marker)] ${
                        selected
                          ? "border-[var(--lamp-marker)] bg-[var(--lamp-desk)]"
                          : "border-[var(--lamp-rule-strong)] hover:border-[var(--lamp-paper)]/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.id}
                        checked={selected}
                        onChange={() => setRole(r.id)}
                        className="sr-only"
                      />
                      <span className="flex items-center justify-between">
                        <span className="lamp-serif text-xl">{r.title}</span>
                        <span
                          aria-hidden="true"
                          className={`h-3.5 w-3.5 rounded-full border ${
                            selected ? "border-[var(--lamp-marker)] bg-[var(--lamp-marker)]" : "border-[var(--lamp-rule-strong)]"
                          }`}
                        />
                      </span>
                      <span className="mt-1 block text-sm leading-snug text-[var(--lamp-graphite)]">{r.description}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-first" className="lamp-label">
                  First name
                </label>
                <input
                  id="reg-first"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={formData.firstName}
                  className="lamp-input"
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="reg-last" className="lamp-label">
                  Last name
                </label>
                <input
                  id="reg-last"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={formData.lastName}
                  className="lamp-input"
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="lamp-label">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                required
                value={formData.email}
                className="lamp-input"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="lamp-label">
                Password
              </label>
              <PasswordInput
                id="reg-password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => {
                  const password = e.target.value;
                  setFormData({ ...formData, password });
                  setPasswordError(
                    formData.confirmPassword && password !== formData.confirmPassword
                      ? "Passwords do not match."
                      : ""
                  );
                }}
              />
            </div>

            <div>
              <label htmlFor="reg-confirm" className="lamp-label">
                Confirm password
              </label>
              <PasswordInput
                id="reg-confirm"
                toggleLabel="confirm password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? "confirm-password-error" : undefined}
                onChange={(e) => {
                  const confirmPassword = e.target.value;
                  setFormData({ ...formData, confirmPassword });
                  setPasswordError(
                    formData.password && formData.password !== confirmPassword
                      ? "Passwords do not match."
                      : ""
                  );
                }}
              />
              {passwordError && (
                <p id="confirm-password-error" className="lamp-error mt-2">
                  {passwordError}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="reg-otp" className="lamp-label">
                Verification code
              </label>
              <input
                id="reg-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                required
                value={otp}
                className="lamp-input lamp-serif text-center !text-[1.75rem] tracking-[0.4em] tabular-nums"
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setStep(1)}
                className="lamp-link text-[var(--lamp-graphite)] hover:text-[var(--lamp-paper)] disabled:opacity-50"
              >
                Edit details
              </button>
              <button
                type="button"
                aria-label={
                  resendTimer > 0 ? `Resend code available in ${resendTimer} seconds` : "Resend verification code"
                }
                disabled={resendTimer > 0 || isResending || isLoading}
                onClick={handleResend}
                className="lamp-link inline-flex items-center gap-2 tabular-nums disabled:cursor-not-allowed disabled:bg-none disabled:text-[var(--lamp-graphite)]"
              >
                {isResending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isResending ? "Resending…" : resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
              </button>
            </div>
          </>
        )}

        <button type="submit" disabled={isLoading} className="lamp-btn lamp-btn-primary w-full">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isLoading
            ? step === 1
              ? "Sending code…"
              : "Creating account…"
            : step === 1
              ? "Send verification code"
              : "Verify and create account"}
        </button>

        {step === 1 && (
          <>
            <Divider label="or" />
            <button type="button" onClick={handleGoogleRegister} disabled={isLoading} className="lamp-btn lamp-btn-ghost w-full">
              <GoogleIcon />
              Continue with Google
            </button>
          </>
        )}
      </form>
    </AuthFrame>
  );
}
