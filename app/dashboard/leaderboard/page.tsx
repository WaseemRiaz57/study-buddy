"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowUp,
  Award,
  BookOpen,
  Crown,
  Flame,
  Loader2,
  Medal,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import PublicProfileModal from "@/components/PublicProfileModal";

interface BadgeMeta {
  label: string;
  color: string;
  textColor: string;
  icon: LucideIcon;
}

interface Scholar {
  userId: string;
  rank: number;
  name: string;
  avatar: string;
  initials: string;
  role: string;
  xp: number;
  totalXP: number;
  weeklyXP: number;
  monthlyXP: number;
  coins: number;
  streak: number;
  badges: string[];
  xpToNextRank?: number;
  nextRankXp?: number;
  progressToNextRank?: number;
}

type TimeFilter = "weekly" | "monthly" | "all-time";

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "all-time", label: "All Time" },
];

const BADGE_META: Record<string, BadgeMeta> = {
  "Top Scholar": {
    label: "Top Scholar",
    color: "bg-yellow-500/15 dark:bg-yellow-500/20",
    textColor: "text-yellow-700 dark:text-yellow-300",
    icon: Crown,
  },
  Mentor: {
    label: "Mentor",
    color: "bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20",
    textColor: "text-[#7C3AED]",
    icon: Award,
  },
  "Streak King": {
    label: "Streak King",
    color: "bg-orange-500/15 dark:bg-orange-500/20",
    textColor: "text-orange-700 dark:text-orange-300",
    icon: Flame,
  },
  Consistency: {
    label: "Consistency",
    color: "bg-emerald-500/15 dark:bg-emerald-500/20",
    textColor: "text-emerald-700 dark:text-emerald-300",
    icon: Target,
  },
  Verified: {
    label: "Verified",
    color: "bg-teal-500/15 dark:bg-teal-500/20",
    textColor: "text-teal-700 dark:text-teal-300",
    icon: ShieldCheck,
  },
};

const slideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

function fmtXP(value: number) {
  return Number(value || 0).toLocaleString();
}

function BadgePill({ badge }: { badge: string }) {
  const meta = BADGE_META[badge] || {
    label: badge,
    color: "bg-slate-500/10 dark:bg-white/10",
    textColor: "text-slate-600 dark:text-slate-300",
    icon: Star,
  };
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color} ${meta.textColor}`}
    >
      <Icon className="h-3 w-3" />
      <span className="hidden sm:inline">{meta.label}</span>
    </span>
  );
}

function Avatar({
  scholar,
  className,
  onClick,
}: {
  scholar: Scholar;
  className: string;
  onClick?: (userId: string) => void;
}) {
  const content = (
    <>
      {scholar.avatar ? (
        <Image
          src={scholar.avatar}
          alt={scholar.name}
          width={96}
          height={96}
          sizes="(max-width: 640px) 80px, 96px"
          className="h-full w-full object-cover"
        />
      ) : (
        scholar.initials
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(scholar.userId)}
        className={`${className} flex items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] font-bold tracking-wide text-white transition-opacity hover:opacity-90`}
        aria-label={`View ${scholar.name}'s public profile`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] font-bold tracking-wide text-white`}
    >
      {content}
    </div>
  );
}

function PodiumCard({
  scholar,
  index,
  onProfileClick,
}: {
  scholar: Scholar;
  index: number;
  onProfileClick: (userId: string) => void;
}) {
  const isWinner = scholar.rank === 1;
  const orderClass = index === 0 ? "order-2" : index === 1 ? "order-1" : "order-3";
  const heights = ["h-56 sm:h-64", "h-44 sm:h-52", "h-40 sm:h-48"];
  const avatarSize = ["h-20 w-20 text-2xl", "h-16 w-16 text-xl", "h-14 w-14 text-lg"];
  const delay = [0.4, 0.2, 0.6][index];

  return (
    <motion.div
      {...slideUp}
      transition={{ delay, duration: 0.55, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className={`group min-w-0 flex flex-col items-center ${orderClass}`}
    >
      <div className="relative mb-2">
        <Avatar
          scholar={scholar}
          className={avatarSize[index]}
          onClick={onProfileClick}
        />
        {isWinner && (
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
            className="absolute -top-4 left-1/2 -translate-x-1/2"
          >
            <Crown className="h-7 w-7 text-yellow-400 drop-shadow-lg" />
          </motion.div>
        )}
      </div>

      {index === 0 && <Trophy className="mb-0.5 h-5 w-5 text-yellow-400" />}
      {index === 1 && <Medal className="mb-0.5 h-5 w-5 text-slate-400 dark:text-slate-300" />}
      {index === 2 && <Medal className="mb-0.5 h-5 w-5 text-amber-700 dark:text-amber-500" />}

      <button
        type="button"
        onClick={() => onProfileClick(scholar.userId)}
        className={`max-w-full truncate px-1 text-xs font-semibold transition-colors hover:text-[#7C3AED] sm:text-sm ${isWinner ? "text-yellow-600 dark:text-yellow-300" : "text-foreground"}`}
      >
        {scholar.name}
      </button>

      <div
        className={`mt-3 flex w-full max-w-24 flex-col items-center justify-start rounded-t-2xl border pt-4 transition-shadow duration-300 sm:max-w-32 sm:pt-5 ${heights[index]} ${
          isWinner
            ? "border-yellow-400/30 bg-yellow-500/10 shadow-[0_0_40px_-10px_rgba(255,215,0,0.25)]"
            : "border-border bg-white/60 dark:bg-white/[0.06]"
        }`}
      >
        <span className={`text-2xl font-extrabold sm:text-3xl ${isWinner ? "text-yellow-500" : "text-[#7C3AED]"}`}>
          #{scholar.rank}
        </span>
        <span className="mt-1 font-mono text-xs text-muted-foreground">
          {fmtXP(scholar.xp)} XP
        </span>
        <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-orange-500 dark:text-orange-400">
          <Flame className="h-3 w-3" />
          {scholar.streak}d
        </div>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [filter, setFilter] = useState<TimeFilter>("all-time");
  const [leaderboard, setLeaderboard] = useState<Scholar[]>([]);
  const [currentUser, setCurrentUser] = useState<Scholar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [publicProfileUserId, setPublicProfileUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/leaderboard?timeframe=${filter}`, {
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load leaderboard.");
        }

        if (mounted) {
          setLeaderboard(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
          setCurrentUser(data?.currentUser || null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void fetchLeaderboard();

    return () => {
      mounted = false;
    };
  }, [filter]);

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const progressPct = currentUser?.progressToNextRank ?? 0;
  const timeframeLabel =
    TIME_FILTERS.find((item) => item.key === filter)?.label || "All Time";

  return (
    <div className="relative min-h-screen bg-background pb-28 text-foreground transition-colors duration-300">
      <div className="app-page relative z-10 max-w-5xl">
        <motion.header {...slideUp} transition={{ duration: 0.45 }} className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/[0.05]">
            <BookOpen className="h-3.5 w-3.5 text-[#7C3AED]" />
            Live Scholar Rankings
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            <Trophy className="mr-2 inline h-8 w-8 -mt-1 text-yellow-500" />
            Global leaderboard
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Rankings are powered by XP, streaks, and rewards earned across the platform.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2">
            {TIME_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  filter === key
                    ? "bg-[#7C3AED] text-white shadow-md shadow-purple-500/25"
                    : "border border-border bg-muted text-muted-foreground hover:border-[#7C3AED]/40 hover:text-foreground dark:border-white/10 dark:bg-white/[0.05]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#7C3AED]" size={34} />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white/70 p-12 text-center dark:bg-white/[0.04]">
            <Trophy className="mx-auto mb-3 text-[#7C3AED]" size={36} />
            <p className="font-semibold">No ranked scholars yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              XP earned from sessions, posts, and daily streaks will appear here.
            </p>
          </div>
        ) : (
          <>
            <section className="mb-10 grid grid-cols-3 items-end gap-1 sm:gap-6">
              {topThree.map((scholar, index) => (
                <PodiumCard
                  key={scholar.userId}
                  scholar={scholar}
                  index={index}
                  onProfileClick={setPublicProfileUserId}
                />
              ))}
            </section>

            <motion.section {...slideUp} transition={{ delay: 0.35, duration: 0.5 }}>
              <div className="grid grid-cols-[50px_1fr_auto_90px] items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 sm:grid-cols-[56px_1fr_auto_110px] sm:px-5">
                <span>Rank</span>
                <span>Scholar</span>
                <span className="hidden pr-2 text-right sm:block">Badges</span>
                <span className="text-right">{timeframeLabel} XP</span>
              </div>

              <div className="space-y-2">
                {rest.map((user, index) => (
                  <motion.div
                    key={user.userId}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + index * 0.03, duration: 0.35 }}
                    whileHover={{ scale: 1.005 }}
                    className="grid cursor-default grid-cols-[50px_1fr_auto_90px] items-center gap-2 rounded-xl border border-border bg-white/70 px-4 py-3.5 shadow-sm sm:grid-cols-[56px_1fr_auto_110px] sm:px-5 dark:bg-white/[0.04]"
                  >
                    <span className="text-sm font-bold text-muted-foreground/70">#{user.rank}</span>

                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        scholar={user}
                        className="h-9 w-9 shrink-0 text-xs"
                        onClick={setPublicProfileUserId}
                      />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setPublicProfileUserId(user.userId)}
                          className="truncate text-left text-sm font-medium text-foreground transition-colors hover:text-[#7C3AED]"
                        >
                          {user.name}
                        </button>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-orange-500 dark:text-orange-400 sm:hidden">
                          <Flame className="h-3 w-3" />
                          {user.streak}d
                        </div>
                      </div>
                    </div>

                    <div className="hidden flex-wrap items-center justify-end gap-1.5 pr-2 sm:flex">
                      {user.badges.map((badge) => (
                        <BadgePill key={badge} badge={badge} />
                      ))}
                    </div>

                  <span className="text-right font-mono text-sm font-semibold tabular-nums text-[#7C3AED]">
                      {fmtXP(user.xp)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </>
        )}
      </div>

      {currentUser && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          <div className="border-t border-border bg-background/90 shadow-[0_-6px_30px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#0f0a16]/90">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="relative">
                  <Avatar
                    scholar={currentUser}
                    className="h-10 w-10 text-xs"
                    onClick={setPublicProfileUserId}
                  />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#7C3AED] bg-background text-[9px] font-bold text-[#7C3AED] dark:bg-[#0f0a16]">
                    {currentUser.rank}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground sm:text-sm">
                    Your Rank: <span className="text-[#7C3AED]">#{currentUser.rank}</span>
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {fmtXP(currentUser.totalXP ?? currentUser.xp)} total XP
                  </p>
                </div>
              </div>

              <div className="hidden max-w-xs flex-1 flex-col gap-1 sm:flex">
                <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                  <span>
                    {currentUser.rank <= 1
                      ? "Top ranked"
                      : `${fmtXP(currentUser.xpToNextRank || 0)} XP to #${Math.max(1, currentUser.rank - 1)}`}
                  </span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted dark:bg-white/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 dark:bg-orange-500/15">
                  <Flame className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                  <span className="text-xs font-semibold text-orange-600 dark:text-orange-300">
                    {currentUser.streak}d
                  </span>
                </div>
                <div className="hidden items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:flex">
                  <ArrowUp className="h-3.5 w-3.5" />
                  <span>{currentUser.coins.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#7C3AED] opacity-80" />
          </div>
        </motion.div>
      )}
      <PublicProfileModal
        userId={publicProfileUserId}
        onClose={() => setPublicProfileUserId(null)}
      />
    </div>
  );
}

