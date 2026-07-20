"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Crown,
  ArrowRight,
  CheckCircle2,
  Receipt,
  Download,
  Coins,
  Flame,
  ChevronRight,
  Wallet,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */
const benefits = [
  "Unlimited Practice Tests",
  "Ad-free Experience",
  "Priority Support",
];

interface Transaction {
  id: string;
  label: string;
  date: string;
  amount: string;
}

const transactions: Transaction[] = [
  { id: "1", label: "Monthly Subscription", date: "Oct 12, 2023", amount: "$14.99" },
  { id: "2", label: "Monthly Subscription", date: "Sep 12, 2023", amount: "$14.99" },
  { id: "3", label: "Monthly Subscription", date: "Aug 12, 2023", amount: "$14.99" },
];

/* ------------------------------------------------------------------ */
/* Coin Ring (SVG circular indicator)                                  */
/* ------------------------------------------------------------------ */
function CoinRing({ value }: { value: number }) {
  const r = 90;
  const circ = 2 * Math.PI * r;
  // fill ~62% of the ring (arbitrary visual representation)
  const fill = 0.62;
  const offset = circ - fill * circ;

  return (
    <div className="relative w-full aspect-square max-h-[220px] mx-auto flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Track */}
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-white/[0.06]"
          strokeWidth="12"
        />
        {/* Progress arc */}
        <motion.circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="url(#coinGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          transform="rotate(-45 100 100)"
        />
        <defs>
          <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8c30e8" />
            <stop offset="100%" stopColor="#a760eb" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <span className="text-4xl font-black text-slate-900 dark:text-white">
          {value}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          Total Coins Earned
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */
export default function BillingPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* ── Header ── */}
      <div className="relative">
        {/* Decorative blurred orb */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl dark:bg-purple-500/15" />

        <div className="relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-3">
            <span className="hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer transition-colors">
              Settings
            </span>
            <ChevronRight size={14} />
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              Billing &amp; Payments
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-[#7C3AED] w-fit pb-1">
            Financial Hub
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl text-base">
            Manage your subscription, billing history, and scholarship rewards.
          </p>
        </div>
      </div>

      {/* ── Grid: 2/3 left + 1/3 right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ────────────────────────────────────────── */}
        {/* LEFT COLUMN (2/3)                          */}
        {/* ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          {/* ── Active Subscription Card ── */}
          <div
            className="
              relative overflow-hidden rounded-2xl p-8
              bg-[#7C3AED]   border-2 border-amber-300/40
                dark:border-amber-500/30
              shadow-[0_0_30px_rgba(255,215,0,0.05)]
              animate-[border-pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]
              group
            "
          >
            {/* Background decoration */}
            <div className="pointer-events-none absolute top-0 right-0 p-4 opacity-[0.07] group-hover:opacity-[0.15] transition-opacity duration-500">
              <Crown size={140} className="text-amber-400 rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-bold tracking-wider border border-amber-500/20">
                    ACTIVE
                  </span>
                  <span className="text-slate-400 dark:text-slate-400 text-sm">
                    Renews Nov 12, 2023
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  Elite Scholar Status
                </h3>
                <p className="text-purple-600 dark:text-purple-400/80 text-lg font-medium">
                  $14.99{" "}
                  <span className="text-slate-500 text-base font-normal">
                    / month
                  </span>
                </p>
              </div>

              <Link
                href="/dashboard/settings/subscription"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7C3AED]   text-black font-bold shadow-lg shadow-amber-900/20 hover:shadow-amber-600/30 hover:scale-[1.02] transition-all"
              >
                Manage Plan
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Benefits */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex gap-6 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              {benefits.map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap"
                >
                  <CheckCircle2
                    size={18}
                    className="text-green-500 dark:text-green-400 shrink-0"
                  />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Payment Method ── */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet size={20} className="text-purple-600 dark:text-purple-400" />
              Payment Method
            </h3>

            <div className="rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/60 dark:bg-white/[0.05] backdrop-blur-2xl border border-slate-200 dark:border-white/10 transition-colors">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {/* Visa card chip */}
                <div className="w-16 h-10 rounded bg-white dark:bg-white flex items-center justify-center shrink-0 border border-slate-200 dark:border-transparent shadow-sm">
                  <span className="text-[#1a1f71] font-black text-lg italic tracking-tighter">
                    VISA
                  </span>
                </div>
                <div className="flex flex-col">
                  <p className="font-mono text-lg tracking-wider text-slate-900 dark:text-white">
                    •••• •••• •••• 4242
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Expires 12/25
                  </p>
                </div>
              </div>

              <button className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 transition-all hover:-translate-y-0.5 text-sm font-medium">
                Change Card
              </button>
            </div>
          </div>

          {/* ── Transaction History ── */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt size={20} className="text-purple-600 dark:text-purple-400" />
              Transaction History
            </h3>

            <div className="flex flex-col gap-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 group bg-white/60 dark:bg-white/[0.05] backdrop-blur-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  {/* Left — icon + info */}
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                      <Receipt size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {tx.label}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {tx.date}
                      </p>
                    </div>
                  </div>

                  {/* Right — amount + download */}
                  <div className="flex items-center gap-6 ml-auto">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {tx.amount}
                    </span>
                    <button className="text-slate-400 hover:text-purple-600 dark:hover:text-white transition-colors flex items-center gap-1 text-sm">
                      <Download size={16} />
                      <span className="hidden sm:inline">Receipt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────── */}
        {/* RIGHT COLUMN (1/3) — Study Savings         */}
        {/* ────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl p-6 lg:sticky lg:top-8 flex flex-col gap-6 bg-white/60 dark:bg-white/[0.05] backdrop-blur-2xl border border-slate-200 dark:border-white/10 transition-colors">
            {/* Header with badge */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Study Savings
              </h3>
              <span className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 text-xs font-bold px-2 py-1 rounded">
                +12%
              </span>
            </div>

            {/* Coin Ring */}
            <CoinRing value={450} />

            {/* Streak progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Flame size={14} className="text-orange-500" />
                  Current Streak
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  14 Days
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#7C3AED]   rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "66%" }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
                You&apos;ve saved the equivalent of{" "}
                <span className="text-slate-900 dark:text-white font-bold">
                  $4.50
                </span>{" "}
                this month by studying!
              </p>
            </div>

            {/* View Coin History button */}
            <button className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-medium transition-colors text-sm flex items-center justify-center gap-2">
              <Coins size={16} />
              View Coin History
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

