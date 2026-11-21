"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useState, Suspense } from "react";
import AuthFrame, { Divider, GoogleIcon } from "@/components/landing/AuthFrame";
import PasswordInput from "@/components/landing/PasswordInput";

// Only allow same-site relative paths as post-login destinations (no open redirect).
function safeCallback(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/dashboard";
  return raw;
}

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallback(searchParams.get("callbackUrl"));

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Backend se aane wala asli error show hota hai
        setError(result.error);
      } else if (result?.ok) {
        router.refresh();
        router.push(callbackUrl);
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFrame
      aside={{
        quote: "Pick up where you left off.",
        note: "Your notes, rooms, streak and mentor bookings are waiting in your dashboard.",
      }}
    >
      <h1 className="lamp-h2">Log in</h1>
      <p className="mt-3 text-[var(--lamp-graphite)]">
        New here?{" "}
        <Link href="/register" className="lamp-link text-[var(--lamp-paper)]">
          Create a free account
        </Link>
      </p>

      <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
        {error && (
          <p role="alert" className="lamp-error rounded-[10px] border border-[var(--lamp-alert)]/40 bg-[var(--lamp-alert)]/10 px-4 py-3">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="login-email" className="lamp-label">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="lamp-input"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="login-password" className="lamp-label">
              Password
            </label>
            <Link href="/forgot-password" className="lamp-link text-sm text-[var(--lamp-graphite)] hover:text-[var(--lamp-paper)]">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <button type="submit" disabled={isLoading} className="lamp-btn lamp-btn-primary w-full">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isLoading ? "Logging in…" : "Log in"}
        </button>

        <Divider label="or" />

        <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="lamp-btn lamp-btn-ghost w-full">
          <GoogleIcon />
          Continue with Google
        </button>
      </form>
    </AuthFrame>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh]" />}>
      <LoginContent />
    </Suspense>
  );
}
