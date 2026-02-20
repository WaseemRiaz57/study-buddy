"use client";
import Link from "next/link";

import { useState } from "react";
// Imports check kar lijiyega export name ke hisab se
import EliteUnlockModal from "@/components/modals/EliteUnlockModal"; 
import MythicBadgeModal from "@/components/modals/MythicBadgeModal";

import { motion } from "framer-motion";
import {
  Flame,  
  Clock,
  Brain,
  Sparkles,
  Target,
  Trophy,
  Star,
  Lock,
  Crown,
  Zap,
  BookOpen,
  Timer,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Gift,
  Users,
  Radio,
  Medal,
  ShieldCheck,
  Check,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════ */
/*  MOCK DATA                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

const userStats = {
  level: 14,
  xp: 4500,
  xpToNext: 5000,
  streak: 12,
  multiplier: "1.5×",
};

const weekDays = [
  { short: "Mon", done: true },
  { short: "Tue", done: true },
  { short: "Wed", done: true },
  { short: "Thu", done: true },
  { short: "Fri", done: false, isToday: true },
  { short: "Sat", done: false },
  { short: "Sun", done: false },
];

interface Quest {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  xp: number;
  coins: number;
  current: number;
  goal: number;
  status: "active" | "completed" | "locked";
  color: string;
  bgTint: string;
  borderTint: string;
}

const dailyQuests: Quest[] = [
  {
    id: 1,
    title: "Read 2 Chapters",
    description: "Finish reading from your active resource",
    icon: BookOpen,
    xp: 80,
    coins: 15,
    current: 2,
    goal: 2,
    status: "completed",
    color: "from-emerald-500 to-teal-500",
    bgTint: "bg-emerald-500/10",
    borderTint: "border-emerald-500/20",
  },
  {
    id: 2,
    title: "Complete 1 Pomodoro",
    description: "Finish a full 25-minute focus session",
    icon: Timer,
    xp: 50,
    coins: 10,
    current: 1,
    goal: 1,
    status: "completed",
    color: "from-orange-500 to-amber-500",
    bgTint: "bg-orange-500/10",
    borderTint: "border-orange-500/20",
  },
  {
    id: 3,
    title: "Generate 2 AI Summaries",
    description: "Use the AI content generator twice",
    icon: Brain,
    xp: 75,
    coins: 20,
    current: 1,
    goal: 2,
    status: "active",
    color: "from-purple-500 to-fuchsia-500",
    bgTint: "bg-purple-500/10",
    borderTint: "border-purple-500/20",
  },
  {
    id: 4,
    title: "Review AI Flashcards",
    description: "Review 20 flashcards in any deck",
    icon: Sparkles,
    xp: 60,
    coins: 12,
    current: 15,
    goal: 20,
    status: "active",
    color: "from-cyan-500 to-blue-500",
    bgTint: "bg-cyan-500/10",
    borderTint: "border-cyan-500/20",
  },
];

interface Milestone {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  xp: number;
  current: number;
  goal: number;
  unit: string;
  color: string;
  badgeColor: string;
  locked?: boolean;
}

const weeklyMilestones: Milestone[] = [
  {
    id: 1,
    title: "Study Marathon",
    description: "Accumulate 10 hours of focused study time this week",
    icon: Target,
    xp: 500,
    current: 6.5,
    goal: 10,
    unit: "hrs",
    color: "from-primary to-purple-500",
    badgeColor: "bg-primary/20 text-primary",
  },
  {
    id: 2,
    title: "Community Champion",
    description: "Post 5 helpful answers in the community",
    icon: Trophy,
    xp: 400,
    current: 3,
    goal: 5,
    unit: "posts",
    color: "from-amber-500 to-yellow-400",
    badgeColor: "bg-amber-500/20 text-amber-400",
  },
  {
    id: 3,
    title: "Knowledge Builder",
    description: "Complete quizzes across 3 different subjects",
    icon: Star,
    xp: 350,
    current: 1,
    goal: 3,
    unit: "subjects",
    color: "from-emerald-500 to-green-400",
    badgeColor: "bg-emerald-500/20 text-emerald-400",
  },
  {
    id: 4,
    title: "Master's Gauntlet",
    description: "Complete all daily quests for 5 consecutive days",
    icon: ShieldCheck,
    xp: 1500,
    current: 0,
    goal: 5,
    unit: "days",
    color: "from-rose-500 to-pink-500",
    badgeColor: "bg-rose-500/20 text-rose-400",
    locked: true,
  },
];

interface LeaderEntry {
  rank: number;
  name: string;
  initials: string;
  xp: number;
  color: string;
}

const leaderboard: LeaderEntry[] = [
  { rank: 1, name: "Amara S.", initials: "AS", xp: 12400, color: "from-yellow-400 to-amber-500" },
  { rank: 2, name: "Ravi K.", initials: "RK", xp: 11200, color: "from-slate-300 to-slate-400" },
  { rank: 3, name: "Mina P.", initials: "MP", xp: 10800, color: "from-orange-400 to-amber-600" },
  { rank: 4, name: "You", initials: "YO", xp: 9600, color: "from-primary to-purple-500" },
];

/* ═══════════════════════════════════════════════════════════════════ */
/*  ANIMATION VARIANTS                                               */
/* ═══════════════════════════════════════════════════════════════════ */

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  COMPONENT                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

export default function ChallengesDashboard() {
  const xpPct = Math.round((userStats.xp / userStats.xpToNext) * 100);
  const [isMythicOpen, setIsMythicOpen] = useState(true);
  const [isEliteOpen, setIsEliteOpen] = useState(true);
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* ─────────────── HEADER ─────────────── */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              The Quest Board
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Complete challenges, earn XP, climb the ranks.
            </p>
          </div>

          {/* Level / XP Pill */}
          <div className="glass-panel rounded-2xl px-5 py-2.5 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary/20">
                {userStats.level}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-foreground leading-none">Level {userStats.level}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{userStats.xp.toLocaleString()}/{userStats.xpToNext.toLocaleString()} XP</p>
              </div>
            </div>
            <div className="hidden sm:block w-28">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full shimmer-bg"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* ─────────────── HERO — STREAK VISUALIZER ─────────────── */}
        <motion.section
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative glass-panel rounded-[2rem] p-6 md:p-8 overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-orange-500/15 dark:bg-orange-500/10 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-primary/15 dark:bg-primary/10 blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left — Streak info */}
            <div className="flex items-center gap-5">
              {/* Fire icon with pulse */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-xl shadow-orange-500/25">
                  <Flame className="text-white" size={32} />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-orange-400/40"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                  {userStats.streak} Days of Consistency
                </h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-orange-500/15 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-lg">
                    <Zap size={12} /> {userStats.multiplier} Multiplier
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg">
                    <TrendingUp size={12} /> Top 5%
                  </span>
                </div>
              </div>
            </div>

            {/* Right — Keep it up badge */}
            <div className="hidden lg:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
              <CheckCircle2 className="text-emerald-500" size={18} />
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">On Track Today!</span>
            </div>
          </div>

          {/* Weekly Calendar Row */}
          <div className="relative z-10 mt-8">
            <div className="grid grid-cols-7 gap-2 md:gap-3">
              {weekDays.map((day) => {
                const isDone = day.done;
                const isToday = day.isToday;

                return (
                  <motion.div
                    key={day.short}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`
                      relative flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all
                      ${isToday
                        ? "bg-primary/10 dark:bg-primary/15 border-primary/40 shadow-lg shadow-primary/10"
                        : isDone
                          ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20"
                          : "bg-muted/40 dark:bg-white/[0.03] border-border/50"
                      }
                    `}
                  >
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      isToday ? "text-primary" : isDone ? "text-emerald-500 dark:text-emerald-400" : "text-muted-foreground"
                    }`}>
                      {day.short}
                    </span>

                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${isDone
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                        : isToday
                          ? "bg-primary text-white shadow-md shadow-primary/30 animate-pulse-slow"
                          : "bg-muted/60 dark:bg-white/[0.06] text-muted-foreground"
                      }
                    `}>
                      {isDone ? <Check size={16} strokeWidth={3} /> : isToday ? <Flame size={14} /> : <span className="text-xs font-bold">{day.short.charAt(0)}</span>}
                    </div>

                    {/* Today glow ring */}
                    {isToday && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* ─────────────── 3-COLUMN GRID ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ═══ COL 1 — DAILY QUESTS ═══ */}
          <motion.section
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Target className="text-primary" size={20} /> Daily Quests
              </h2>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={12} /> 6h 23m left
              </span>
            </div>

            <div className="space-y-3">
              {dailyQuests.map((q) => {
                const pct = Math.round((q.current / q.goal) * 100);
                const Icon = q.icon;
                const isComplete = q.status === "completed";

                return (
                  <motion.div
                    key={q.id}
                    variants={fadeUp}
                    className={`
                      group relative glass-panel rounded-2xl p-4 overflow-hidden transition-all
                      ${isComplete ? "border-emerald-500/20" : "hover:border-primary/40"}
                    `}
                  >
                    {/* accent glow */}
                    <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${q.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity pointer-events-none`} />

                    <div className="relative z-10 flex items-center gap-4">
                      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                        isComplete
                          ? "bg-emerald-500/10"
                          : q.bgTint
                      }`}>
                        <Icon className={`${isComplete ? "text-emerald-500" : ""}`} size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-semibold text-sm truncate ${isComplete ? "line-through opacity-60" : ""}`}>
                            {q.title}
                          </h3>
                          <span className="flex-shrink-0 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md ml-2">
                            +{q.xp} XP
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {q.description}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar or Claim button */}
                    <div className="relative z-10 mt-3">
                      {isComplete ? (
                        <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5">
                          <Gift size={14} /> Claim Rewards
                        </button>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                            <span>{q.current}/{q.goal} completed</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full bg-gradient-to-r ${q.color}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* ═══ COL 2 — WEEKLY MILESTONES ═══ */}
          <motion.section
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="text-primary" size={20} /> Weekly Milestones
              </h2>
            </div>

            <div className="space-y-3">
              {weeklyMilestones.map((m) => {
                const pct = Math.round((m.current / m.goal) * 100);
                const Icon = m.icon;

                if (m.locked) {
                  /* ── Locked PRO card ── */
                  return (
                    <motion.div
                      key={m.id}
                      variants={fadeUp}
                      className="relative rounded-2xl overflow-hidden select-none"
                    >
                      {/* Blurred content */}
                      <div className="glass-panel rounded-2xl p-5 blur-[2px] opacity-50 pointer-events-none">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                            <Icon className="text-white" size={18} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">{m.title}</h3>
                            <p className="text-[11px] text-muted-foreground">{m.description}</p>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/60 mt-3" />
                      </div>

                      {/* Lock overlay */}
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/30 dark:bg-background/50 backdrop-blur-[1px] rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                          <Lock className="text-yellow-500" size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-3 py-1 rounded-md">
                          PRO Challenge
                        </span>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={m.id}
                    variants={fadeUp}
                    className="group glass-panel rounded-2xl p-5 hover:border-primary/40 transition-all overflow-hidden relative"
                  >
                    <div className={`absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-gradient-to-tr ${m.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity pointer-events-none`} />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${m.badgeColor}`}>
                          <Icon size={12} /> Milestone
                        </span>
                        <span className="text-xs font-bold text-primary">+{m.xp} XP</span>
                      </div>

                      <h3 className="font-bold text-sm">{m.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {m.description}
                      </p>

                      {/* Progress */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                          <span>{m.current} / {m.goal} {m.unit}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full bg-gradient-to-r ${m.color}`}
                          />
                        </div>
                      </div>

                      <button className="w-full mt-4 text-xs font-semibold text-primary hover:text-primary-soft flex items-center justify-center gap-1 transition-colors">
                        View Details <ArrowRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* ═══ COL 3 — COMMUNITY & EVENTS ═══ */}
          <motion.section
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="text-primary" size={20} /> Community
              </h2>
            </div>

            {/* Live Event Card */}
            <motion.div
              variants={fadeUp}
              className="relative glass-panel rounded-2xl p-5 overflow-hidden group"
            >
              {/* Live pulse accent */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-red-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg">
                    <Radio size={12} className="animate-pulse" /> Live Event
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">Ends in 2h 15m</span>
                </div>

                <h3 className="text-lg font-bold">🌍 Global Study Jam</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Join students worldwide for a 4-hour collaborative study sprint. Earn bonus XP for every completed Pomodoro!
                </p>

                {/* Mini avatars */}
                <div className="flex items-center mt-4 gap-3">
                  <div className="flex -space-x-2">
                    {["AS", "RK", "MP", "JL", "TW"].map((initials, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-[9px] font-bold border-2 border-background ring-1 ring-primary/20"
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    +142 studying now
                  </span>
                </div>

                <Link 
  href="/dashboard/challenges/global-event" 
  className="w-full mt-5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5"
>
  <Zap size={14} /> Join Study Jam
</Link>
              </div>
            </motion.div>

            {/* Community Challenge */}
            <motion.div
              variants={fadeUp}
              className="glass-panel rounded-2xl p-5 group hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <Users className="text-white" size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Team Challenge</h3>
                  <p className="text-[11px] text-muted-foreground">Invite 3 friends to study with you</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex -space-x-1.5">
                  {["RK", "MP"].map((initials, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/80 to-purple-600 flex items-center justify-center text-white text-[8px] font-bold border-2 border-background"
                    >
                      {initials}
                    </div>
                  ))}
                  <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] text-muted-foreground font-bold">
                    +1
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">2/3 friends joined</span>
                <span className="ml-auto text-[10px] font-bold text-primary">+200 XP</span>
              </div>
            </motion.div>

            {/* Leaderboard Preview */}
            <motion.div
              variants={fadeUp}
              className="glass-panel rounded-2xl p-5 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <Medal className="text-yellow-500" size={16} /> Leaderboard
                </h3>
                <button className="text-[11px] font-bold text-primary hover:text-primary-soft flex items-center gap-1 transition-colors">
                  View All <ArrowRight size={10} />
                </button>
              </div>

              <div className="space-y-2">
                {leaderboard.map((entry) => {
                  const isYou = entry.name === "You";
                  return (
                    <div
                      key={entry.rank}
                      className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-colors ${
                        isYou
                          ? "bg-primary/10 dark:bg-primary/15 border border-primary/20"
                          : "hover:bg-muted/40 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className={`text-xs font-black w-5 text-center ${entry.rank <= 3 ? "text-yellow-500" : "text-muted-foreground"}`}>
                        #{entry.rank}
                      </span>

                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${entry.color} flex items-center justify-center text-white text-[9px] font-bold shadow-sm`}>
                        {entry.initials}
                      </div>

                      <span className={`text-xs font-semibold flex-1 ${isYou ? "text-primary" : ""}`}>
                        {entry.name}
                      </span>

                      <span className="text-[10px] font-bold text-muted-foreground">
                        {entry.xp.toLocaleString()} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.section>
        </div>

        {/* ─────────────── UPSELL BANNER ─────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-yellow-500/20 relative overflow-hidden"
        >
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-yellow-500/5 blur-[60px] pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-xl shadow-yellow-500/20">
              <Crown className="text-black" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base">Unlock Elite Challenges</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upgrade to PRO for exclusive challenges, higher XP multipliers, and premium badges.
              </p>
            </div>
          </div>

          <button className="relative z-10 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-yellow-500/20 transition-all hover:scale-105 whitespace-nowrap">
            <Crown size={16} /> Upgrade to PRO
          </button>
        </motion.section>
      </div>
      <MythicBadgeModal isOpen={isMythicOpen} onClose={() => setIsMythicOpen(false)} />
      <EliteUnlockModal isOpen={isEliteOpen} onClose={() => setIsEliteOpen(false)} />
    </div>
  );
}
