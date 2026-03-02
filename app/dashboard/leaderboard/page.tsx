"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Star,
  Zap,
  Award,
  BookOpen,
  Target,
  TrendingUp,
  ArrowUp,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────
interface Badge {
  label: string;
  color: string;       // tailwind bg class
  textColor: string;   // tailwind text class
  icon: LucideIcon;
}

interface Scholar {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  badges: Badge[];
}

// ── Badge Presets ──────────────────────────────────────────
const BADGES = {
  topScholar:  { label: "Top Scholar",  color: "bg-yellow-500/15 dark:bg-yellow-500/20",  textColor: "text-yellow-700 dark:text-yellow-300",  icon: Crown       } satisfies Badge,
  mentor:      { label: "Mentor",       color: "bg-purple-500/15 dark:bg-purple-500/20",  textColor: "text-purple-700 dark:text-purple-300",  icon: Award       } satisfies Badge,
  nightOwl:    { label: "Night Owl",    color: "bg-indigo-500/15 dark:bg-indigo-500/20",  textColor: "text-indigo-700 dark:text-indigo-300",  icon: Star        } satisfies Badge,
  earlyBird:   { label: "Early Bird",   color: "bg-sky-500/15 dark:bg-sky-500/20",        textColor: "text-sky-700 dark:text-sky-300",        icon: Zap         } satisfies Badge,
  helper:      { label: "Helper",       color: "bg-emerald-500/15 dark:bg-emerald-500/20",textColor: "text-emerald-700 dark:text-emerald-300",icon: Target      } satisfies Badge,
  streakKing:  { label: "Streak King",  color: "bg-orange-500/15 dark:bg-orange-500/20",  textColor: "text-orange-700 dark:text-orange-300",  icon: Flame       } satisfies Badge,
  bookworm:    { label: "Bookworm",     color: "bg-rose-500/15 dark:bg-rose-500/20",      textColor: "text-rose-700 dark:text-rose-300",      icon: BookOpen    } satisfies Badge,
  verified:    { label: "Verified",     color: "bg-teal-500/15 dark:bg-teal-500/20",      textColor: "text-teal-700 dark:text-teal-300",      icon: ShieldCheck } satisfies Badge,
};

// ── Mock Data ──────────────────────────────────────────────
const allScholars: Scholar[] = [
  { rank: 1,  name: "Aria Nova",    avatar: "AN", xp: 9_820,  streak: 47, badges: [BADGES.topScholar, BADGES.mentor, BADGES.verified] },
  { rank: 2,  name: "Kael Riven",   avatar: "KR", xp: 8_450,  streak: 34, badges: [BADGES.nightOwl, BADGES.mentor] },
  { rank: 3,  name: "Mira Sol",     avatar: "MS", xp: 7_930,  streak: 29, badges: [BADGES.earlyBird, BADGES.helper] },
  { rank: 4,  name: "Leo Stark",    avatar: "LS", xp: 6_710,  streak: 22, badges: [BADGES.streakKing, BADGES.helper] },
  { rank: 5,  name: "Zara Kian",    avatar: "ZK", xp: 5_990,  streak: 18, badges: [BADGES.bookworm] },
  { rank: 6,  name: "Devon Ray",    avatar: "DR", xp: 5_430,  streak: 15, badges: [BADGES.nightOwl, BADGES.mentor] },
  { rank: 7,  name: "Isla Fern",    avatar: "IF", xp: 4_870,  streak: 12, badges: [BADGES.earlyBird] },
  { rank: 8,  name: "Nico Voss",    avatar: "NV", xp: 4_320,  streak: 10, badges: [BADGES.helper, BADGES.bookworm] },
  { rank: 9,  name: "Tess Bloom",   avatar: "TB", xp: 3_850,  streak: 8,  badges: [BADGES.streakKing] },
  { rank: 10, name: "Rune Atlas",   avatar: "RA", xp: 3_410,  streak: 5,  badges: [BADGES.mentor] },
];

const currentUserBase = { rank: 42, xp: 1_250, streak: 7, nextRankXp: 1_500 };

type TimeFilter = "weekly" | "monthly" | "all-time";
const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: "weekly",   label: "Weekly" },
  { key: "monthly",  label: "Monthly" },
  { key: "all-time", label: "All Time" },
];

// ── Helpers ────────────────────────────────────────────────
const fmtXP = (n: number) => n.toLocaleString();

const slideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

// ── Podium Card ────────────────────────────────────────────
function PodiumCard({ scholar, index }: { scholar: Scholar; index: number }) {
  const isWinner = scholar.rank === 1;
  // Visual order: 2nd | 1st | 3rd
  const orderClass = index === 0 ? "order-2" : index === 1 ? "order-1" : "order-3";
  const heights    = ["h-56 sm:h-64", "h-44 sm:h-52", "h-40 sm:h-48"];
  const avatarSize = ["w-20 h-20 text-2xl", "w-16 h-16 text-xl", "w-14 h-14 text-lg"];
  const delay      = [0.4, 0.2, 0.6][index];

  return (
    <motion.div
      {...slideUp}
      transition={{ delay, duration: 0.55, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className={`flex flex-col items-center ${orderClass} group`}
    >
      {/* Avatar */}
      <div className="relative mb-2">
        <div
          className={`relative rounded-full flex items-center justify-center font-bold tracking-wide
            ${avatarSize[index]}
            ${isWinner
              ? "bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 text-amber-900 shadow-[0_0_40px_-10px_rgba(255,215,0,0.6)]"
              : "bg-gradient-to-br from-primary/50 to-purple-700/50 dark:from-purple-500/60 dark:to-purple-800/60 text-primary-foreground"
            }`}
        >
          {scholar.avatar}

          {/* Glowing ring for winner */}
          {isWinner && (
            <motion.span
              animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border-2 border-yellow-400/60 pointer-events-none"
            />
          )}
        </div>

        {/* Crown for #1 */}
        {isWinner && (
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
            className="absolute -top-4 left-1/2 -translate-x-1/2"
          >
            <Crown className="w-7 h-7 text-yellow-400 drop-shadow-lg" />
          </motion.div>
        )}
      </div>

      {/* Medal icon */}
      {index === 0 && <Trophy  className="w-5 h-5 text-yellow-400 mb-0.5" />}
      {index === 1 && <Medal   className="w-5 h-5 text-slate-400 dark:text-slate-300 mb-0.5" />}
      {index === 2 && <Medal   className="w-5 h-5 text-amber-700 dark:text-amber-500 mb-0.5" />}

      {/* Name */}
      <p className={`text-sm font-semibold ${isWinner ? "text-yellow-600 dark:text-yellow-300" : "text-foreground"}`}>
        {scholar.name}
      </p>

      {/* Pedestal */}
      <div
        className={`mt-3 w-24 sm:w-32 ${heights[index]} rounded-t-2xl flex flex-col items-center justify-start pt-5
          backdrop-blur-xl transition-shadow duration-300
          ${isWinner
            ? "bg-yellow-500/10 dark:bg-yellow-500/[0.08] border border-yellow-400/30 dark:border-yellow-400/20 shadow-[0_0_40px_-10px_rgba(255,215,0,0.25)] group-hover:shadow-[0_0_55px_-10px_rgba(255,215,0,0.4)]"
            : "glass-panel group-hover:shadow-lg dark:group-hover:shadow-purple-500/10"
          }`}
      >
        <span className={`text-3xl sm:text-4xl font-extrabold ${isWinner ? "text-yellow-500 dark:text-yellow-400" : "text-muted-foreground/60"}`}>
          #{scholar.rank}
        </span>
        <span className={`text-xs mt-1 font-mono ${isWinner ? "text-yellow-600/80 dark:text-yellow-300/70" : "text-muted-foreground/50"}`}>
          {fmtXP(scholar.xp)} XP
        </span>
        <div className="flex items-center gap-1 mt-2 text-[10px] text-orange-500 dark:text-orange-400 font-medium">
          <Flame className="w-3 h-3" />
          {scholar.streak}d
        </div>
      </div>
    </motion.div>
  );
}

// ── Badge Pill ─────────────────────────────────────────────
function BadgePill({ badge }: { badge: Badge }) {
  const Icon = badge.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.color} ${badge.textColor}`}>
      <Icon className="w-3 h-3" />
      <span className="hidden sm:inline">{badge.label}</span>
    </span>
  );
}

// ── Page Component ─────────────────────────────────────────
export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<TimeFilter>("all-time");
  const topThree = allScholars.slice(0, 3);
  const rest     = allScholars.slice(3);

  const currentUserName = session?.user?.name || "User";
  const currentUserInitials = currentUserName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
  const currentUser = {
    ...currentUserBase,
    name: currentUserName,
    avatar: currentUserInitials,
  };

  const progressPct = Math.round((currentUser.xp / currentUser.nextRankXp) * 100);

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300 pb-28">
      {/* ── Ambient Blobs (dark mode only) ────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hidden dark:block absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-purple-700/10 blur-[160px]" />
        <div className="hidden dark:block absolute top-72 -right-32 w-[350px] h-[350px] rounded-full bg-yellow-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ═══════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════ */}
        <motion.header {...slideUp} transition={{ duration: 0.45 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted dark:bg-white/[0.05] border border-border dark:border-white/10 text-xs text-muted-foreground mb-4">
            <TrendingUp className="w-3.5 h-3.5" />
            Season 3 — Week 12
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <Trophy className="inline w-8 h-8 text-yellow-500 mr-2 -mt-1" />
            Global Scholars Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
            Top scholars ranked by total XP earned this season. Climb the ranks on your quest to greatness.
          </p>

          {/* Time Filters */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {TIME_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
                  ${filter === key
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : "bg-muted dark:bg-white/[0.05] text-muted-foreground hover:text-foreground border border-border dark:border-white/10 hover:border-primary/40"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.header>

        {/* ═══════════════════════════════════════════
            PODIUM  (Top 3)
        ═══════════════════════════════════════════ */}
        <section className="flex items-end justify-center gap-3 sm:gap-8 mb-12">
          {topThree.map((s, i) => (
            <PodiumCard key={s.rank} scholar={s} index={i} />
          ))}
        </section>

        {/* ═══════════════════════════════════════════
            LEADERBOARD LIST  (Ranks 4+)
        ═══════════════════════════════════════════ */}
        <motion.section
          {...slideUp}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {/* Column headers */}
          <div className="grid grid-cols-[50px_1fr_auto_90px] sm:grid-cols-[56px_1fr_auto_110px] items-center gap-2 px-4 sm:px-5 py-2 text-[11px] uppercase tracking-widest text-muted-foreground/60 font-semibold select-none">
            <span>Rank</span>
            <span>Scholar</span>
            <span className="text-right pr-2 hidden sm:block">Badges</span>
            <span className="text-right">Total XP</span>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            <AnimatePresence>
              {rest.map((user, i) => (
                <motion.div
                  key={user.rank}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.06, duration: 0.35 }}
                  whileHover={{ scale: 1.005 }}
                  className="grid grid-cols-[50px_1fr_auto_90px] sm:grid-cols-[56px_1fr_auto_110px] items-center gap-2 px-4 sm:px-5 py-3.5
                    rounded-xl glass-panel hover-tilt cursor-default"
                >
                  {/* Rank */}
                  <span className="text-sm font-bold text-muted-foreground/70">#{user.rank}</span>

                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-purple-600/30 dark:from-purple-600/50 dark:to-indigo-600/50 flex items-center justify-center text-xs font-bold text-foreground/80 shrink-0">
                      {user.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <div className="flex items-center gap-1 text-[10px] text-orange-500 dark:text-orange-400 font-medium sm:hidden">
                        <Flame className="w-3 h-3" />{user.streak}d
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="hidden sm:flex items-center gap-1.5 justify-end pr-2 flex-wrap">
                    {user.badges.map((b) => (
                      <BadgePill key={b.label} badge={b} />
                    ))}
                  </div>

                  {/* XP */}
                  <span className="text-sm font-mono font-semibold text-primary text-right tabular-nums">
                    {fmtXP(user.xp)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>

      {/* ═══════════════════════════════════════════
          STICKY PERSONAL RANK ANCHOR
      ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.5, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <div className="relative bg-background/80 dark:bg-[#0f0a16]/90 backdrop-blur-2xl border-t border-border dark:border-white/[0.08] shadow-[0_-6px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-6px_30px_rgba(0,0,0,0.5)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            {/* Left: Rank + Avatar */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-primary/25">
                  {currentUser.avatar}
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background dark:bg-[#0f0a16] border-2 border-primary text-[9px] font-bold text-primary flex items-center justify-center">
                  {currentUser.rank}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Your Rank: <span className="text-primary">#{currentUser.rank}</span>
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {fmtXP(currentUser.xp)} / {fmtXP(currentUser.nextRankXp)} XP
                </p>
              </div>
            </div>

            {/* Center: Progress bar (hidden on small screens) */}
            <div className="hidden sm:flex flex-col flex-1 max-w-xs gap-1">
              <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                <span>Progress to #{currentUser.rank - 1}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted dark:bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ delay: 1.8, duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full shimmer-bg"
                />
              </div>
            </div>

            {/* Right: Streak + Rank up indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 dark:bg-orange-500/15 border border-orange-400/20 dark:border-orange-400/25">
                <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                <span className="text-xs font-semibold text-orange-600 dark:text-orange-300">{currentUser.streak}d</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>+3</span>
              </div>
            </div>
          </div>

          {/* Glowing bottom edge bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] shimmer-bg opacity-80" />
        </div>
      </motion.div>
    </div>
  );
}
