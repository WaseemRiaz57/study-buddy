"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Fingerprint,
  Eye,
  EyeOff,
  Laptop,
  Smartphone,
  Tablet,
  LogOut,
  Lock,
  AlertCircle,
  Save,
  Monitor,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Shared input class                                                  */
/* ------------------------------------------------------------------ */
const inputCls = `
  w-full px-4 py-2.5 rounded-lg text-sm
  bg-slate-50 border border-slate-200
  text-slate-900 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
  dark:bg-white/5 dark:border-white/10 dark:text-white
  dark:placeholder:text-slate-500 dark:focus:border-purple-400 dark:focus:ring-purple-400/20
  transition-colors
`;

/* ------------------------------------------------------------------ */
/* Card wrapper class (replaces glass-panel)                           */
/* ------------------------------------------------------------------ */
const cardCls =
  "bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-white/10";

/* ------------------------------------------------------------------ */
/* Toggle Switch                                                       */
/* ------------------------------------------------------------------ */
function Toggle({
  id,
  enabled,
  onToggle,
}: {
  id: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      id={id}
      role="switch"
      type="button"
      aria-checked={enabled}
      onClick={onToggle}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer
        rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2
        dark:focus-visible:ring-offset-slate-900
        ${enabled ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"}
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
/* Session data                                                        */
/* ------------------------------------------------------------------ */
interface Session {
  id: string;
  device: string;
  icon: LucideIcon;
  os: string;
  location: string;
  lastActive: string;
  current?: boolean;
}

const sessions: Session[] = [
  {
    id: "1",
    device: 'MacBook Pro 16"',
    icon: Laptop,
    os: "Chrome · MacOS 13.4",
    location: "Lahore, PK · Current Session",
    lastActive: "Active now",
    current: true,
  },
  {
    id: "2",
    device: "iPhone 14 Pro",
    icon: Smartphone,
    os: "StudyBuddy App · iOS 16.5",
    location: "Lahore, PK · 2h ago",
    lastActive: "2 hours ago",
  },
  {
    id: "3",
    device: "iPad Air",
    icon: Tablet,
    os: "Safari · iPadOS 16",
    location: "Islamabad, PK · 3d ago",
    lastActive: "3 days ago",
  },
];

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */
export default function SecurityPage() {
  const [emailMfa, setEmailMfa] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("password123");
  const [newPw, setNewPw] = useState("");
  const [activeSessions, setActiveSessions] = useState(sessions);

  const securityScore = 92;

  const handleSignOut = (id: string) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="relative pb-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-8"
      >
        {/* ── Header ── */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white pb-1 w-fit">
            Account &amp; Security
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-lg">
            Manage your password, multi-factor authentication, and monitor
            active sessions.
          </p>
        </div>

        {/* ── Hero Card — Security Overview ── */}
        <section
          className={`${cardCls} w-full rounded-2xl p-6 md:p-8 relative overflow-hidden group mb-8`}
        >
          <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
            {/* Left text */}
            <div className="flex-1 space-y-4">
              {/* Status badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Security Status: Strong
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Your account is well protected
              </h2>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2.5 mt-2 overflow-hidden">
                <motion.div
                  className="h-2.5 rounded-full bg-gradient-to-r from-primary to-green-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${securityScore}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
                Security Score: {securityScore}/100
              </p>
            </div>

            {/* Right — shield icon */}
            <div className="shrink-0 hidden md:block">
              <ShieldCheck
                size={72}
                className="text-primary dark:text-purple-400"
                strokeWidth={1.2}
              />
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
                    onToggle={() => setEmailMfa(!emailMfa)}
                  />
                </div>

                {/* Biometric toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex gap-4">
                    <Fingerprint
                      size={20}
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
                    onToggle={() => setBiometric(!biometric)}
                  />
                </div>
              </div>
            </section>

            {/* Password Management */}
            <section className={`${cardCls} rounded-xl p-6`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Password Management
              </h3>

              <div className="grid gap-6 md:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="Enter current password"
                      className={`${inputCls} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-primary dark:text-slate-500 dark:hover:text-purple-400 transition-colors"
                    >
                      {showCurrentPw ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="Min. 8 characters"
                      className={`${inputCls} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-primary dark:text-slate-500 dark:hover:text-purple-400 transition-colors"
                    >
                      {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ── RIGHT (1/3) — Active Sessions ── */}
          <div className="lg:col-span-1">
            <section className={`${cardCls} rounded-xl p-6 h-full flex flex-col`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                Active Sessions
              </h3>

              {/* Sessions list */}
              <div className="flex-1 space-y-4">
                {/* Current Session — highlighted */}
                {activeSessions
                  .filter((s) => s.current)
                  .map((session) => (
                    <div
                      key={session.id}
                      className="relative p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20"
                    >
                      <div className="flex items-start gap-3">
                        <session.icon
                          size={24}
                          className="text-primary dark:text-purple-400 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">
                            {session.device}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {session.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Other sessions */}
                {activeSessions
                  .filter((s) => !s.current)
                  .map((session) => (
                    <div
                      key={session.id}
                      className="group p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <session.icon
                            size={24}
                            className="text-slate-400 dark:text-slate-500 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                              {session.device}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {session.location}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSignOut(session.id)}
                          title="Sign Out"
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full p-1 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <LogOut size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                {activeSessions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400 dark:text-slate-500">
                    <ShieldCheck
                      size={32}
                      className="mb-3 text-slate-300 dark:text-slate-600"
                    />
                    No active sessions
                  </div>
                )}
              </div>

              {/* Sign out all devices */}
              <button
                onClick={() =>
                  setActiveSessions((prev) => prev.filter((s) => s.current))
                }
                className="mt-6 w-full py-2.5 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              >
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
            {/* Warning text */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <AlertCircle size={16} className="text-amber-500" />
              <span>Unsaved changes will be lost if you leave.</span>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              {/* Discard */}
              <button className="px-6 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
                Discard
              </button>

              {/* Save */}
              <button className="relative flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all overflow-hidden">
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-[shimmer-slide_3s_ease-in-out_infinite]" />
                <Save size={16} className="relative z-10" />
                <span className="relative z-10">Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
