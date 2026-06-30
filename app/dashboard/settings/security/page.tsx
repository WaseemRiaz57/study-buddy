"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Fingerprint,
  Eye,
  EyeOff,
  Loader2,
  Laptop,
  Smartphone,
  Tablet,
  LogOut,
  AlertCircle,
  Save,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Shared input class                                                  */
/* ------------------------------------------------------------------ */
const inputCls = `
  w-full px-4 py-2.5 rounded-lg text-sm
  bg-slate-50 border border-slate-200
  text-slate-900 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600
  dark:bg-white/5 dark:border-white/10 dark:text-white
  dark:placeholder:text-slate-500 dark:focus:border-purple-600 dark:focus:ring-purple-600/20
  transition-colors
`;

/* ------------------------------------------------------------------ */
/* Card wrapper class                                                  */
/* ------------------------------------------------------------------ */
const cardCls =
  "bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-white/10";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type DeviceType = "laptop" | "phone" | "tablet";

interface DeviceSession {
  id: string;
  device: string;
  os: string;
  browser: string;
  deviceType: DeviceType;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrentSession: boolean;
}

interface SecurityData {
  securityScore: number;
  emailMfaEnabled: boolean;
  biometricEnabled: boolean;
  passwordStrong: boolean;
  hasPassword: boolean;
  sessions: DeviceSession[];
}

const DEVICE_ICONS: Record<DeviceType, LucideIcon> = {
  laptop: Laptop,
  phone: Smartphone,
  tablet: Tablet,
};

/* ------------------------------------------------------------------ */
/* Helpers (client-side, mirror lib/security score thresholds)         */
/* ------------------------------------------------------------------ */
function scoreStatus(score: number): {
  tone: "strong" | "moderate" | "weak";
  label: string;
  headline: string;
  badgeCls: string;
  dotCls: string;
} {
  if (score >= 90) {
    return {
      tone: "strong",
      label: "Strong",
      headline: "Your account is well protected",
      badgeCls:
        "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
      dotCls: "bg-green-500",
    };
  }
  if (score >= 70) {
    return {
      tone: "moderate",
      label: "Moderate",
      headline: "Your account could be safer",
      badgeCls:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
      dotCls: "bg-amber-500",
    };
  }
  return {
    tone: "weak",
    label: "At Risk",
    headline: "Your account needs attention",
    badgeCls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    dotCls: "bg-red-500",
  };
}

function formatRelative(value: string, isCurrent: boolean): string {
  if (isCurrent) return "Current Session";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "Unknown";
  const minutes = Math.floor((Date.now() - time) / 60000);
  if (minutes < 1) return "Active now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const isStrong = (pw: string) =>
  pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);

/* ------------------------------------------------------------------ */
/* Toggle Switch                                                       */
/* ------------------------------------------------------------------ */
function Toggle({
  id,
  enabled,
  onToggle,
  ariaLabel,
  disabled,
}: {
  id: string;
  enabled: boolean;
  onToggle: () => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      role="switch"
      type="button"
      aria-checked={enabled}
      aria-label={ariaLabel}
      onClick={onToggle}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer
        rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/50 focus-visible:ring-offset-2
        dark:focus-visible:ring-offset-slate-900
        disabled:cursor-not-allowed disabled:opacity-50
        ${enabled ? "bg-purple-600" : "bg-slate-200 dark:bg-slate-700"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full
          bg-white shadow-lg ring-0 transition-transform duration-200
          ${enabled ? "translate-x-5" : "translate-x-0"}
        `}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Password field                                                      */
/* ------------------------------------------------------------------ */
function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  show,
  onToggleShow,
  error,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete={autoComplete}
          className={`${inputCls} pr-11`}
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          onClick={onToggleShow}
          className="absolute right-3 top-2.5 text-slate-400 hover:text-purple-600 dark:text-slate-500 dark:hover:text-purple-600 transition-colors"
        >
          {show ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */
export default function SecurityPage() {
  // Server-backed state
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(50);
  const [hasPassword, setHasPassword] = useState(true);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);

  // MFA — current + saved baseline (for dirty tracking)
  const [emailMfa, setEmailMfa] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [savedEmailMfa, setSavedEmailMfa] = useState(false);
  const [savedBiometric, setSavedBiometric] = useState(false);

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Async flags
  const [isSaving, setIsSaving] = useState(false);
  const [signingOutId, setSigningOutId] = useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  /* ---- Initial load ---- */
  const loadSecurity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/security", { cache: "no-store" });
      const data: SecurityData & { message?: string } = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load settings.");

      setScore(data.securityScore);
      setEmailMfa(data.emailMfaEnabled);
      setSavedEmailMfa(data.emailMfaEnabled);
      setBiometric(data.biometricEnabled);
      setSavedBiometric(data.biometricEnabled);
      setHasPassword(data.hasPassword);
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load settings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSecurity();
  }, [loadSecurity]);

  /* ---- Derived / validation ---- */
  const status = useMemo(() => scoreStatus(score), [score]);

  const mfaDirty = emailMfa !== savedEmailMfa || biometric !== savedBiometric;
  const wantsPasswordChange = Boolean(currentPw || newPw || confirmPw);
  const isDirty = mfaDirty || wantsPasswordChange;

  const newPwError =
    newPw && !isStrong(newPw)
      ? "Use at least 8 characters with a letter and a number."
      : undefined;
  const confirmPwError =
    confirmPw && confirmPw !== newPw ? "Passwords do not match." : undefined;

  /* ---- Save (MFA + password) ---- */
  const handleSave = async () => {
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }

    if (wantsPasswordChange) {
      if (hasPassword && !currentPw) {
        toast.error("Please enter your current password.");
        return;
      }
      if (!isStrong(newPw)) {
        toast.error("New password must be 8+ characters with a letter and a number.");
        return;
      }
      if (newPw !== confirmPw) {
        toast.error("New passwords do not match.");
        return;
      }
    }

    setIsSaving(true);
    try {
      let latestScore = score;

      if (mfaDirty) {
        const res = await fetch("/api/user/security/mfa", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailMfaEnabled: emailMfa,
            biometricEnabled: biometric,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update MFA.");
        latestScore = data.securityScore;
        setSavedEmailMfa(emailMfa);
        setSavedBiometric(biometric);
      }

      if (wantsPasswordChange) {
        const res = await fetch("/api/user/security/password", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: currentPw,
            newPassword: newPw,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update password.");
        latestScore = data.securityScore;
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
        setHasPassword(true);
      }

      setScore(latestScore);
      toast.success("Security settings saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings."
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* ---- Discard ---- */
  const handleDiscard = () => {
    setEmailMfa(savedEmailMfa);
    setBiometric(savedBiometric);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  };

  /* ---- Sign out single device ---- */
  const handleSignOut = async (id: string) => {
    setSigningOutId(id);
    try {
      const res = await fetch("/api/user/security/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to sign out device.");
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Device signed out.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to sign out device."
      );
    } finally {
      setSigningOutId(null);
    }
  };

  /* ---- Sign out all other devices ---- */
  const handleSignOutAll = async () => {
    setSigningOutAll(true);
    try {
      const res = await fetch("/api/user/security/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to sign out devices.");
      setSessions((prev) => prev.filter((s) => s.isCurrentSession));
      toast.success(
        data.signedOut > 0
          ? `Signed out of ${data.signedOut} other device${
              data.signedOut === 1 ? "" : "s"
            }.`
          : "No other devices were signed in."
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to sign out devices."
      );
    } finally {
      setSigningOutAll(false);
    }
  };

  const currentSessions = sessions.filter((s) => s.isCurrentSession);
  const otherSessions = sessions.filter((s) => !s.isCurrentSession);
  const hasOtherSessions = otherSessions.length > 0;

  return (
    <main className="relative pb-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-8"
      >
        {/* ── Header ── */}
        <header className="flex flex-col gap-2 mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white pb-1 w-fit">
            Account &amp; Security
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-lg">
            Manage your password, multi-factor authentication, and monitor active
            sessions.
          </p>
        </header>

        {/* ── Hero Card — Security Overview ── */}
        <section
          aria-label="Security overview"
          className={`${cardCls} w-full rounded-2xl p-6 md:p-8 relative overflow-hidden group mb-8`}
        >
          <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
            <div className="flex-1 space-y-4 w-full">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.badgeCls}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${status.dotCls} ${
                    status.tone === "strong" ? "animate-pulse" : ""
                  }`}
                />
                Security Status: {status.label}
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {status.headline}
              </h2>

              {/* Progress bar */}
              <div
                className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2.5 mt-2 overflow-hidden"
                role="progressbar"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Security score"
              >
                <motion.div
                  className="h-2.5 rounded-full bg-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-right tabular-nums">
                Security Score: {score}/100
              </p>
            </div>

            <div className="shrink-0 hidden md:block">
              <ShieldCheck size={72} className="text-purple-600" strokeWidth={1.2} />
            </div>
          </div>
        </section>

        {/* ── 3-column grid (2:1 split) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── LEFT (2/3) — MFA & Passwords ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* MFA Section */}
            <section className={`${cardCls} rounded-xl p-6`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Multi-Factor Authentication
              </h3>

              <div className="space-y-4 mt-4">
                {/* Email MFA toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex gap-4">
                    <Mail
                      size={20}
                      aria-hidden="true"
                      className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Email MFA
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Receive a code via email for new logins.
                      </p>
                    </div>
                  </div>
                  <Toggle
                    id="email-mfa"
                    enabled={emailMfa}
                    onToggle={() => setEmailMfa((v) => !v)}
                    ariaLabel="Toggle email MFA"
                    disabled={loading || isSaving}
                  />
                </div>

                {/* Biometric toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex gap-4">
                    <Fingerprint
                      size={20}
                      aria-hidden="true"
                      className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Biometric Login
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Use FaceID or TouchID on supported devices.
                      </p>
                    </div>
                  </div>
                  <Toggle
                    id="bio-mfa"
                    enabled={biometric}
                    onToggle={() => setBiometric((v) => !v)}
                    ariaLabel="Toggle biometric login"
                    disabled={loading || isSaving}
                  />
                </div>
              </div>
            </section>

            {/* Password Management */}
            <section className={`${cardCls} rounded-xl p-6`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Password Management
              </h3>
              {!hasPassword && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Your account uses social login. Set a password below to enable
                  email &amp; password sign-in.
                </p>
              )}

              <form
                className="grid gap-6 md:grid-cols-2 mt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSave();
                }}
              >
                <PasswordField
                  id="current-password"
                  label="Current Password"
                  value={currentPw}
                  onChange={setCurrentPw}
                  placeholder={
                    hasPassword ? "Enter current password" : "No password set"
                  }
                  autoComplete="current-password"
                  show={showCurrentPw}
                  onToggleShow={() => setShowCurrentPw((v) => !v)}
                />

                <PasswordField
                  id="new-password"
                  label="New Password"
                  value={newPw}
                  onChange={setNewPw}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  show={showNewPw}
                  onToggleShow={() => setShowNewPw((v) => !v)}
                  error={newPwError}
                />

                <PasswordField
                  id="confirm-password"
                  label="Confirm New Password"
                  value={confirmPw}
                  onChange={setConfirmPw}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  show={showConfirmPw}
                  onToggleShow={() => setShowConfirmPw((v) => !v)}
                  error={confirmPwError}
                  className="md:col-span-2"
                />

                {/* Hidden submit keeps Enter-to-save working */}
                <button type="submit" className="hidden">
                  Save password
                </button>
              </form>
            </section>
          </div>

          {/* ── RIGHT (1/3) — Active Sessions ── */}
          <div className="lg:col-span-1">
            <section className={`${cardCls} rounded-xl p-6 h-full flex flex-col`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                Active Sessions
              </h3>

              <div className="flex-1 space-y-4">
                {loading ? (
                  <div className="space-y-4" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-[68px] rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Current session — highlighted */}
                    {currentSessions.map((session) => {
                      const Icon = DEVICE_ICONS[session.deviceType] ?? Laptop;
                      return (
                        <div
                          key={session.id}
                          className="relative p-4 bg-purple-600/5 dark:bg-purple-600/10 rounded-lg border border-purple-600/20"
                        >
                          <div className="flex items-start gap-3">
                            <Icon
                              size={24}
                              aria-hidden="true"
                              className="text-purple-600 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {session.device}
                              </p>
                              <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                {session.location} · Current Session
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {session.browser} · {session.os}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Other sessions */}
                    {otherSessions.map((session) => {
                      const Icon = DEVICE_ICONS[session.deviceType] ?? Laptop;
                      const busy = signingOutId === session.id;
                      return (
                        <div
                          key={session.id}
                          className="group p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3 min-w-0">
                              <Icon
                                size={24}
                                aria-hidden="true"
                                className="text-slate-400 dark:text-slate-500 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                  {session.device}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {session.location} ·{" "}
                                  {formatRelative(session.lastActive, false)}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                  {session.browser} · {session.os}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleSignOut(session.id)}
                              disabled={busy}
                              title="Sign out"
                              aria-label={`Sign out ${session.device}`}
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full p-1 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
                            >
                              {busy ? (
                                <Loader2
                                  size={18}
                                  className="animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <LogOut size={18} aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {sessions.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400 dark:text-slate-500">
                        <ShieldCheck
                          size={32}
                          className="mb-3 text-slate-300 dark:text-slate-600"
                          aria-hidden="true"
                        />
                        No active sessions
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Sign out all devices */}
              <button
                onClick={handleSignOutAll}
                disabled={loading || signingOutAll || !hasOtherSessions}
                aria-label="Sign out all other devices"
                className="mt-6 w-full py-2.5 flex items-center justify-center gap-2 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signingOutAll && (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                )}
                Sign out all devices
              </button>
            </section>
          </div>
        </div>
      </motion.div>

      {/* ── Bottom Floating Action Bar ── */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 24 }}
        className="fixed bottom-0 left-0 right-0 lg:sticky lg:bottom-0 z-30 mt-8"
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t lg:border lg:rounded-2xl border-slate-200 dark:border-white/10 py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <AlertCircle
                size={16}
                className={isDirty ? "text-amber-500" : "text-slate-400"}
              />
              <span>
                {isDirty
                  ? "Unsaved changes will be lost if you leave."
                  : "All changes saved."}
              </span>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <button
                type="button"
                aria-label="Discard changes"
                disabled={!isDirty || isSaving}
                onClick={handleDiscard}
                className="px-6 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Discard
              </button>

              <button
                type="button"
                aria-label="Save changes"
                disabled={isSaving || !isDirty}
                onClick={handleSave}
                className="flex min-w-[152px] items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 shadow-lg shadow-purple-600/25 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Save size={16} aria-hidden="true" />
                )}
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
