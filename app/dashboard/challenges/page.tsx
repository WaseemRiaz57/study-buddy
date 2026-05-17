"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import EliteUnlockModal from "@/components/modals/EliteUnlockModal";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  Gift,
  Loader2,
  Lock,
  Medal,
  Radio,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

type ChallengeType = "daily" | "weekly" | "global" | "elite";

type Challenge = {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  targetMetric: number;
  xpReward: number;
  isLocked: boolean;
  progress: {
    currentValue: number;
    targetMetric: number;
    percentage: number;
    isCompleted: boolean;
    isClaimed: boolean;
  };
};

type ChallengeStats = {
  xp: number;
  coins: number;
  streak: number;
  level: number;
  nextLevelXp: number;
  hasEliteChallenges: boolean;
};

type LeaderboardEntry = {
  userId: string;
  name: string;
  initials: string;
  xp: number;
  rank: number;
};

const PURPLE = "#7C3AED";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SB"
  );
}

const CHALLENGE_TYPE_ICONS: Record<ChallengeType, LucideIcon> = {
  daily: Target,
  weekly: Trophy,
  global: Users,
  elite: Crown,
};

function formatMetric(value: number) {
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function buildWeek(streak: number) {
  const today = new Date();
  const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const start = new Date(today);
  start.setDate(today.getDate() - dayIndex);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const distanceFromToday = Math.floor((today.getTime() - date.getTime()) / 86_400_000);

    return {
      short: date.toLocaleDateString(undefined, { weekday: "short" }),
      isToday: date.toDateString() === today.toDateString(),
      done: distanceFromToday >= 0 && distanceFromToday < Math.max(0, streak),
    };
  });
}

function ChallengeCard({
  challenge,
  onClaim,
  onUnlock,
  isClaiming,
}: {
  challenge: Challenge;
  onClaim: (id: string) => void;
  onUnlock: () => void;
  isClaiming: boolean;
}) {
  const Icon = CHALLENGE_TYPE_ICONS[challenge.type] || Target;
  const progress = Math.min(100, Math.max(0, challenge.progress.percentage || 0));
  const canClaim =
    challenge.progress.isCompleted &&
    !challenge.progress.isClaimed &&
    !challenge.isLocked;

  return (
    <motion.div
      variants={fadeUp}
      className={`group relative overflow-hidden rounded-2xl border bg-white/70 p-4 shadow-sm transition-all hover:border-[#7C3AED]/40 dark:bg-white/[0.04] ${
        challenge.progress.isClaimed ? "border-emerald-500/25" : "border-border"
      }`}
    >
      <div className="relative z-10 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] transition-transform group-hover:scale-105">
          {challenge.isLocked ? <Lock size={20} /> : <Icon size={20} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              {challenge.title}
            </h3>
            <span className="shrink-0 rounded-md bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-bold text-[#7C3AED]">
              +{challenge.xpReward.toLocaleString()} XP
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {challenge.description}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-4">
        {challenge.isLocked ? (
          <button
            onClick={onUnlock}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#7C3AED]/20 transition-all hover:bg-[#6D28D9] active:scale-[0.99]"
          >
            <Crown size={14} /> Unlock Now
          </button>
        ) : canClaim ? (
          <button
            onClick={() => onClaim(challenge.id)}
            disabled={isClaiming}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#7C3AED]/20 transition-all hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isClaiming ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />}
            Claim Rewards
          </button>
        ) : challenge.progress.isClaimed ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={14} /> Claimed
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>
                {formatMetric(challenge.progress.currentValue)} / {formatMetric(challenge.targetMetric)}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-[#7C3AED]"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChallengesDashboard() {
  const { data: session } = useSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState<ChallengeStats>({
    xp: 0,
    coins: 0,
    streak: 0,
    level: 1,
    nextLevelXp: 1000,
    hasEliteChallenges: false,
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [globalHours, setGlobalHours] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState("");
  const [isEliteOpen, setIsEliteOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const currentUserName = session?.user?.name || "User";
  const xpPct = stats.nextLevelXp > 0 ? Math.min(100, Math.round((stats.xp / stats.nextLevelXp) * 100)) : 0;
  const weekDays = useMemo(() => buildWeek(stats.streak), [stats.streak]);

  const fetchChallenges = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/challenges", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load challenges.");
      }

      setChallenges(Array.isArray(data.challenges) ? data.challenges : []);
      setStats((prev) => ({ ...prev, ...(data.stats || {}) }));
      setGlobalHours(Number(data.globalStats?.totalStudyHours || 0));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load challenges.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchChallenges();
  }, [fetchChallenges]);

  useEffect(() => {
    let ignore = false;

    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard?timeframe=weekly", { cache: "no-store" });
        const data = await res.json();

        if (!ignore && res.ok) {
          setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard.slice(0, 4) : []);
        }
      } catch {
        if (!ignore) setLeaderboard([]);
      }
    }

    void fetchLeaderboard();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleClaim(challengeId: string) {
    setClaimingId(challengeId);

    try {
      const res = await fetch(`/api/challenges/${challengeId}/claim`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to claim reward.");
      }

      toast.success("Reward claimed.");
      await fetchChallenges();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to claim reward.");
    } finally {
      setClaimingId("");
    }
  }

  async function handleUnlockElite() {
    setIsUnlocking(true);

    try {
      const res = await fetch("/api/store/elite-challenges", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to unlock Elite Challenges.");
      }

      toast.success(data?.message || "Elite Challenges unlocked.");
      setIsEliteOpen(false);
      await fetchChallenges();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unlock Elite Challenges.");
    } finally {
      setIsUnlocking(false);
    }
  }

  const dailyChallenges = challenges.filter((challenge) => challenge.type === "daily");
  const weeklyChallenges = challenges.filter((challenge) => challenge.type === "weekly");
  const eliteChallenges = challenges.filter((challenge) => challenge.type === "elite");
  const globalChallenge = challenges.find((challenge) => challenge.type === "global");
  const completedToday = dailyChallenges.filter((challenge) => challenge.progress.isCompleted).length;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              The Quest Board
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Complete challenges, earn XP, climb the ranks.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-white/70 px-5 py-2.5 shadow-sm dark:bg-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED] text-sm font-black text-white shadow-lg shadow-[#7C3AED]/20">
                {stats.level}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold leading-none text-foreground">
                  Level {stats.level}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {stats.xp.toLocaleString()}/{stats.nextLevelXp.toLocaleString()} XP
                </p>
              </div>
            </div>
            <div className="hidden w-28 sm:block">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full rounded-full bg-[#7C3AED]"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-8">
        <motion.section
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-[2rem] border border-border bg-white/70 p-6 shadow-sm dark:bg-white/[0.04] md:p-8"
        >
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-500/25">
                  <Flame size={32} />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-orange-400/40"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                  {stats.streak} Days of Consistency
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                    <Zap size={12} /> {stats.streak >= 7 ? "1.2x" : "1x"} Multiplier
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">
                    <BookOpen size={12} /> {completedToday}/{Math.max(dailyChallenges.length, 1)} Daily
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5">
              <CheckCircle2 className="text-emerald-500" size={18} />
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Live Progress
              </span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-7 gap-2 md:gap-3">
            {weekDays.map((day) => (
              <motion.div
                key={day.short}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl border py-3 transition-all ${
                  day.isToday
                    ? "border-[#7C3AED]/40 bg-[#7C3AED]/10 shadow-lg shadow-[#7C3AED]/10"
                    : day.done
                      ? "border-emerald-500/20 bg-emerald-500/10"
                      : "border-border/50 bg-muted/40 dark:bg-white/[0.03]"
                }`}
              >
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    day.isToday
                      ? "text-[#7C3AED]"
                      : day.done
                        ? "text-emerald-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {day.short}
                </span>

                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    day.done
                      ? "bg-emerald-500 text-white"
                      : day.isToday
                        ? "bg-[#7C3AED] text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {day.done ? <Check size={16} strokeWidth={3} /> : day.isToday ? <Flame size={14} /> : <span className="text-xs font-bold">{day.short.charAt(0)}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border bg-white/60 dark:bg-white/[0.03]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#7C3AED]" />
            <span className="text-sm font-semibold text-muted-foreground">
              Loading quests...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <motion.section
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-5"
            >
              <div className="flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Target className="text-[#7C3AED]" size={20} /> Daily Quests
                </h2>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={12} /> resets daily
                </span>
              </div>

              <div className="space-y-3">
                {dailyChallenges.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                    No daily quests are active right now.
                  </div>
                ) : (
                  dailyChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onClaim={handleClaim}
                      onUnlock={() => setIsEliteOpen(true)}
                      isClaiming={claimingId === challenge.id}
                    />
                  ))
                )}
              </div>
            </motion.section>

            <motion.section
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-5"
            >
              <div className="flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Trophy className="text-[#7C3AED]" size={20} /> Weekly Milestones
                </h2>
              </div>

              <div className="space-y-3">
                {weeklyChallenges.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                    Weekly milestones will appear here when they are published.
                  </div>
                ) : (
                  weeklyChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onClaim={handleClaim}
                      onUnlock={() => setIsEliteOpen(true)}
                      isClaiming={claimingId === challenge.id}
                    />
                  ))
                )}

                {eliteChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClaim={handleClaim}
                    onUnlock={() => setIsEliteOpen(true)}
                    isClaiming={claimingId === challenge.id}
                  />
                ))}
              </div>
            </motion.section>

            <motion.section
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-5"
            >
              <div className="flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Users className="text-[#7C3AED]" size={20} /> Community
                </h2>
              </div>

              <motion.div
                variants={fadeUp}
                className="rounded-2xl border border-border bg-white/70 p-5 shadow-sm transition-all hover:border-[#7C3AED]/40 dark:bg-white/[0.04]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-500">
                    <Radio size={12} className="animate-pulse" /> Live Event
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {formatMetric(globalHours)} hrs logged
                  </span>
                </div>

                <h3 className="text-lg font-bold">
                  {globalChallenge?.title || "Great Convergence"}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {globalChallenge?.description || "A platform-wide study event powered by real focus and session activity."}
                </p>

                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                    <span>
                      {formatMetric(globalChallenge?.progress.currentValue || globalHours)} / {formatMetric(globalChallenge?.targetMetric || Math.max(globalHours, 1))}
                    </span>
                    <span>{globalChallenge?.progress.percentage || 0}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${globalChallenge?.progress.percentage || 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full bg-[#7C3AED]"
                    />
                  </div>
                </div>

                <Link
                  href="/dashboard/challenges/global-event"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#7C3AED]/20 transition-all hover:bg-[#6D28D9]"
                >
                  <Zap size={14} /> View Global Event
                </Link>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="rounded-2xl border border-border bg-white/70 p-5 shadow-sm dark:bg-white/[0.04]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold">
                    <Medal className="text-yellow-500" size={16} /> Weekly Leaders
                  </h3>
                  <Link
                    href="/dashboard/leaderboard"
                    className="flex items-center gap-1 text-[11px] font-bold text-[#7C3AED] transition-colors hover:text-[#6D28D9]"
                  >
                    View All <ArrowRight size={10} />
                  </Link>
                </div>

                <div className="space-y-2">
                  {leaderboard.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Leaderboard activity will appear after XP is earned.
                    </p>
                  ) : (
                    leaderboard.map((entry) => {
                      const isUser = entry.name === currentUserName || entry.userId === session?.user?.id;

                      return (
                        <div
                          key={entry.userId}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                            isUser
                              ? "border border-[#7C3AED]/20 bg-[#7C3AED]/10"
                              : "hover:bg-muted/40 dark:hover:bg-white/[0.03]"
                          }`}
                        >
                          <span className={`w-5 text-center text-xs font-black ${entry.rank <= 3 ? "text-yellow-500" : "text-muted-foreground"}`}>
                            #{entry.rank}
                          </span>
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7C3AED] text-[9px] font-bold text-white">
                            {entry.initials || getInitials(entry.name)}
                          </div>
                          <span className={`flex-1 text-xs font-semibold ${isUser ? "text-[#7C3AED]" : ""}`}>
                            {isUser ? currentUserName : entry.name}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {entry.xp.toLocaleString()} XP
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </motion.section>
          </div>
        )}

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-[#7C3AED]/20 bg-white/70 p-6 shadow-sm dark:bg-white/[0.04] md:flex-row md:p-8"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold">Unlock Elite Challenges</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Spend 500 coins to reveal exclusive challenge tracks and higher XP rewards.
              </p>
            </div>
          </div>

          {stats.hasEliteChallenges ? (
            <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles size={16} /> Elite Unlocked
            </span>
          ) : (
            <button
              onClick={() => setIsEliteOpen(true)}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#7C3AED]/20 transition-all hover:bg-[#6D28D9] active:scale-[0.99]"
            >
              <Crown size={16} /> Unlock Now
            </button>
          )}
        </motion.section>
      </div>

      <EliteUnlockModal
        isOpen={isEliteOpen}
        onClose={() => {
          if (!isUnlocking) setIsEliteOpen(false);
        }}
        onUnlockAction={handleUnlockElite}
        isUnlocking={isUnlocking}
      />
    </div>
  );
}

