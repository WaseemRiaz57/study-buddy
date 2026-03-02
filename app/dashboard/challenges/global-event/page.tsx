"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Radio,
  Users,
  Trophy,
  Crown,
  Gem,
  Clock,
  Sparkles,
  Star,
  Zap,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════ */
/*  MOCK DATA                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

const GOAL_HOURS = 1_000_000;
const CURRENT_HOURS = 745_200;
const PROGRESS = CURRENT_HOURS / GOAL_HOURS; // 0.7452

const squadMembers = [
  { name: "Sara M.", avatar: "S", color: "bg-pink-500" },
  { name: "Owais R.", avatar: "O", color: "bg-blue-500" },
  { name: "Zain A.", avatar: "Z", color: "bg-emerald-500" },
  { name: "Hina K.", avatar: "H", color: "bg-amber-500" },
  { name: "Rayan J.", avatar: "R", color: "bg-purple-500" },
];

const miniLeaderboard = [
  { rank: 1, name: "Sara M.", hours: 128, badge: "👑" },
  { rank: 2, name: "Owais R.", hours: 96, badge: "🥈" },
  { rank: 3, name: "User", hours: 72, badge: "🥉", isUser: true },
];

const rewardTiers = [
  { tier: "Bronze", hours: 25, unlocked: true },
  { tier: "Silver", hours: 50, unlocked: true },
  { tier: "Gold", hours: 100, unlocked: false },
];

const tickerItems = [
  "Ali K. just contributed 5 hours!",
  "Sara M. hit a 7-day streak 🔥",
  "Team Quantum reached 10,000 hrs!",
  "Hina K. unlocked the Gold Badge!",
  "Global milestone: 700K hours passed!",
  "Rayan J. contributed 3 hours!",
  "Owais R. logged 8 hours today!",
  "Community challenge 74% complete!",
  "Zain A. joined the event!",
  "New reward tier unlocked globally!",
];

/* ═══════════════════════════════════════════════════════════════════ */
/*  ANIMATED COUNTER                                                  */
/* ═══════════════════════════════════════════════════════════════════ */

function AnimatedCounter({ target }: { target: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    Math.floor(v).toLocaleString()
  );
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, target, {
      duration: 2.5,
      ease: "easeOut",
    });
    return controls.stop;
  }, [count, target]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsubscribe;
  }, [rounded]);

  return <span ref={ref}>0</span>;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  SVG PROGRESS RING                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function ProgressRing({ progress }: { progress: number }) {
  const radius = 140;
  const stroke = 14;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  return (
    <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] mx-auto">
      <svg
        className="w-full h-full -rotate-90"
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      >
        {/* Track */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="currentColor"
          className="text-black/5 dark:text-white/5"
          strokeWidth={stroke}
        />
        {/* Glow behind progress */}
        <motion.circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="url(#ringGlow)"
          strokeWidth={stroke + 8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="opacity-30 blur-sm"
        />
        {/* Progress */}
        <motion.circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 2.5, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8c30e8" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#00FFA3" />
          </linearGradient>
          <linearGradient id="ringGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8c30e8" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
          <AnimatedCounter target={CURRENT_HOURS} />
        </span>
        <span className="text-sm text-muted-foreground font-medium">hrs contributed</span>
        <span className="text-xs text-muted-foreground/70 mt-1">
          Goal: {GOAL_HOURS.toLocaleString()} hrs
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  TICKER                                                            */
/* ═══════════════════════════════════════════════════════════════════ */

function InfiniteTickerBar() {
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <div className="w-full overflow-hidden border-t border-border/50 bg-black/[0.02] dark:bg-white/[0.02]">
      <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap py-3">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 mx-6 text-sm text-muted-foreground"
          >
            <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                         */
/* ═══════════════════════════════════════════════════════════════════ */

export default function GlobalEventPage() {
  const { data: session } = useSession();
  const currentUserName = session?.user?.name || "User";
  const personalizedMiniLeaderboard = miniLeaderboard.map((entry) =>
    entry.isUser ? { ...entry, name: currentUserName } : entry,
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* ── Ambient background orbs ─────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-purple-500/15 dark:bg-purple-500/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-pink-500/10 dark:bg-pink-500/20 blur-[120px] animate-pulse-slow [animation-delay:2s]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-400/15 blur-[120px] animate-pulse-slow [animation-delay:4s]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ── Header ────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center pt-8 sm:pt-12 pb-6 px-4"
        >
          {/* Live pill */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5
                        bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-sm font-semibold text-red-600 dark:text-red-400 tracking-wide uppercase">
              Live Event
            </span>
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-400 bg-clip-text text-transparent">
              The Great Convergence
            </span>
          </h1>

          <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            A global community challenge — every study hour counts toward unlocking legendary rewards for everyone.
          </p>
        </motion.header>

        {/* ── 3-Column Layout ───────────────────────────────────── */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">
            {/* ─── Left: Squad Online ───────────────────────────── */}
            <motion.aside
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-5"
            >
              {/* Squad card */}
              <div className="glass-island rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Squad Online
                  </h3>
                  <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {squadMembers.length} active
                  </span>
                </div>

                {/* Overlapping avatars */}
                <div className="flex -space-x-2 mb-5">
                  {squadMembers.map((m, i) => (
                    <motion.div
                      key={m.name}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      className={`w-9 h-9 rounded-full ${m.color} ring-2 ring-background flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {m.avatar}
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="w-9 h-9 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-muted-foreground text-xs font-bold"
                  >
                    +12
                  </motion.div>
                </div>

                {/* Mini leaderboard */}
                <div className="border-t border-border/50 pt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Top Contributors
                  </h4>
                  <div className="space-y-2.5">
                    {personalizedMiniLeaderboard.map((entry) => (
                      <div
                        key={entry.rank}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors
                          ${
                            entry.isUser
                              ? "bg-primary/10 dark:bg-primary/15 border border-primary/20"
                              : "bg-black/[0.02] dark:bg-white/[0.03]"
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{entry.badge}</span>
                          <span
                            className={`font-semibold ${
                              entry.isUser
                                ? "text-primary"
                                : "text-foreground"
                            }`}
                          >
                            {entry.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">
                          {entry.hours}h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Your stats mini card */}
              <div className="glass-island rounded-2xl p-5">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Your Contribution
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/[0.02] dark:bg-white/[0.03] rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-foreground">72</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Hours</p>
                  </div>
                  <div className="bg-black/[0.02] dark:bg-white/[0.03] rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-foreground">12</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Day Streak</p>
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* ─── Center: Progress Hero ────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="glass-island rounded-3xl p-6 sm:p-8 w-full max-w-lg mx-auto text-center">
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
                    <Radio className="w-3.5 h-3.5" />
                    Community Progress
                  </span>
                </div>

                {/* Progress Ring */}
                <ProgressRing progress={PROGRESS} />

                {/* Percentage */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="text-lg font-bold text-foreground mt-4"
                >
                  {(PROGRESS * 100).toFixed(1)}% Complete
                </motion.p>

                {/* Stats row */}
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Contributors</p>
                    <p className="text-lg font-black text-foreground">12,847</p>
                  </div>
                  <div className="h-8 w-px bg-border/50" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Time Left</p>
                    <p className="text-lg font-black text-foreground">18d 6h</p>
                  </div>
                </div>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl
                             bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-400
                             text-white font-bold text-sm tracking-wide
                             shadow-[0_0_30px_rgba(140,48,232,0.3)] dark:shadow-[0_0_40px_rgba(140,48,232,0.5)]
                             hover:shadow-[0_0_50px_rgba(140,48,232,0.4)] dark:hover:shadow-[0_0_60px_rgba(140,48,232,0.6)]
                             transition-shadow duration-300"
                >
                  <Clock className="w-4 h-4" />
                  Log Your Hours
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Milestone bar below hero */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="glass-island rounded-2xl p-5 mt-6 w-full max-w-lg mx-auto"
              >
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  Community Milestones
                </h4>
                <div className="relative">
                  {/* Track */}
                  <div className="h-2.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${PROGRESS * 100}%` }}
                      transition={{ duration: 2.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-400"
                    />
                  </div>
                  {/* Markers */}
                  <div className="flex justify-between mt-2 px-1">
                    {[
                      { label: "250K", pct: 25 },
                      { label: "500K", pct: 50 },
                      { label: "750K", pct: 75 },
                      { label: "1M", pct: 100 },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <div
                          className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                            PROGRESS * 100 >= m.pct
                              ? "bg-primary"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.section>

            {/* ─── Right: Rewards ───────────────────────────────── */}
            <motion.aside
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-5"
            >
              {/* Grand Prize */}
              <div className="glass-island rounded-2xl p-5 overflow-hidden relative">
                {/* Decorative shimmer */}
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-2xl" />
                
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Grand Prize
                </h3>

                {/* Reward visual */}
                <div className="relative z-10 flex flex-col items-center mb-4">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600/30 via-pink-500/20 to-amber-400/30
                               dark:from-purple-600/40 dark:via-pink-500/30 dark:to-amber-400/40
                               border border-white/10 dark:border-white/20
                               flex items-center justify-center
                               shadow-[0_0_40px_rgba(140,48,232,0.15)] dark:shadow-[0_0_60px_rgba(140,48,232,0.3)]"
                  >
                    <Gem className="w-10 h-10 text-purple-500 dark:text-purple-400" />
                  </motion.div>
                  <h4 className="mt-4 font-black text-lg text-foreground">Celestial Aura</h4>
                  <p className="text-xs text-muted-foreground text-center mt-1 leading-relaxed">
                    An exclusive profile aura awarded to all participants when the community reaches 1M hours.
                  </p>
                </div>

                {/* Unlock condition */}
                <div className="relative z-10 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">
                    Unlocks at
                  </p>
                  <p className="text-sm font-bold text-foreground">1,000,000 Hours</p>
                </div>
              </div>

              {/* Tier rewards */}
              <div className="glass-island rounded-2xl p-5">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Personal Rewards
                </h3>
                <div className="space-y-2.5">
                  {rewardTiers.map((tier) => (
                    <div
                      key={tier.tier}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        tier.unlocked
                          ? "bg-primary/10 dark:bg-primary/15 border border-primary/20"
                          : "bg-black/[0.02] dark:bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            tier.unlocked
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {tier.unlocked ? "✓" : "🔒"}
                        </span>
                        <div>
                          <p
                            className={`font-semibold ${
                              tier.unlocked
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {tier.tier} Badge
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {tier.hours}h contributed
                          </p>
                        </div>
                      </div>
                      {tier.unlocked && (
                        <span className="text-xs font-bold text-primary">
                          Claimed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </div>
        </div>

        {/* ── Footer Ticker ─────────────────────────────────────── */}
        <InfiniteTickerBar />
      </div>
    </div>
  );
}
