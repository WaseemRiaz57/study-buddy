"use client";

import { motion } from "framer-motion";
import { Hourglass, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Custom keyframes (injected via style tag for mesh gradients)        */
/* ------------------------------------------------------------------ */
const customStyles = `
@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; transform: scale(1.5); }
  50% { opacity: 0.8; transform: scale(1.7); }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}
@keyframes mesh-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function ApplicationStatusPage() {
  const profileCompletion = 65;

  return (
    <>
      {/* Inject custom keyframes */}
      <style>{customStyles}</style>

      <main className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        {/* ── Mesh gradient background ── */}
        <div className="pointer-events-none absolute inset-0">
          {/* Top-left blob */}
          <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/[0.08] dark:bg-primary/[0.12] blur-[120px] animate-[mesh-shift_10s_ease-in-out_infinite]" />
          {/* Bottom-right blob */}
          <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-purple-400/[0.06] dark:bg-purple-500/[0.1] blur-[100px] animate-[mesh-shift_12s_ease-in-out_infinite_reverse]" />
          {/* Center accent */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[350px] w-[350px] rounded-full bg-primary/[0.05] dark:bg-primary/[0.08] blur-[100px]" />
        </div>

        {/* ── Content ── */}
        <div className="relative w-full max-w-2xl flex flex-col items-center text-center mx-auto px-6 py-16">
          {/* ── Hourglass Hero ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative mb-8 group"
          >
            {/* Pulsing glow behind */}
            <div className="absolute inset-0 bg-primary/20 dark:bg-primary/30 rounded-full blur-xl animate-[pulse-glow_2s_ease-in-out_infinite]" />

            {/* Glass circle */}
            <div className="relative w-32 h-32 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-full flex items-center justify-center shadow-lg animate-[float_6s_ease-in-out_infinite]">
              <Hourglass className="w-14 h-14 text-primary transition-transform duration-700 group-hover:rotate-180" />
            </div>
          </motion.div>

          {/* ── Heading ── */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight tracking-tight"
          >
            Your Wisdom is{" "}
            <br className="hidden sm:block" />
            <span className="text-primary">Under Review</span>
          </motion.h1>

          {/* ── Subtitle ── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-lg mb-8"
          >
            Our Elder Mentors are evaluating your scrolls. Expect a response
            within 48 hours.
          </motion.p>

          {/* ── XP Badge ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 300 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm mb-12 shadow-[0_0_15px_rgba(140,48,232,0.15)]"
          >
            <Sparkles className="w-4 h-4" />
            <span>+100 XP Applicant Bonus</span>
          </motion.div>

          {/* ── While You Wait Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full max-w-md bg-white/50 dark:bg-slate-900/50 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-8"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                While you wait
              </h3>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
              <div className="flex-grow text-left">
                <div className="flex justify-between items-end mb-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Profile Completion
                  </h4>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {profileCompletion}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-primary h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompletion}%` }}
                    transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Back Button ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-lg font-semibold shadow-lg hover:shadow-primary/40 transition-all hover:brightness-110"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
          </motion.div>
        </div>
      </main>
    </>
  );
}

