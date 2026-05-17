"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Clock,
  Crown,
  Gem,
  Loader2,
  Radio,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

type SquadMember = {
  id: string;
  name: string;
  profileImage: string;
  initials: string;
};

type Contributor = {
  userId: string;
  name: string;
  initials: string;
  rank: number;
  contributionHours: number;
};

type PersonalReward = {
  tier: string;
  hours: number;
  unlocked: boolean;
};

type GlobalMilestone = {
  label: string;
  value: number;
  percentage: number;
  isReached: boolean;
};

type GlobalEventData = {
  event: {
    id: string;
    title: string;
    description: string;
    current: number;
    goal: number;
    progress: number;
    xpReward: number;
  };
  squadOnline: SquadMember[];
  activeCount: number;
  topContributors: Contributor[];
  contributorCount: number;
  currentUserContribution: number;
  personalRewards: PersonalReward[];
  milestones: GlobalMilestone[];
  tickerItems: string[];
};

function formatHours(value: number) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

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

function ProgressRing({
  progress,
  current,
  goal,
}: {
  progress: number;
  current: number;
  goal: number;
}) {
  const radius = 140;
  const stroke = 14;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progressRatio = Math.min(1, Math.max(0, progress / 100));

  return (
    <div className="relative mx-auto h-[280px] w-[280px] sm:h-[320px] sm:w-[320px]">
      <svg
        className="h-full w-full -rotate-90"
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      >
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="currentColor"
          className="text-black/5 dark:text-white/5"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="#7C3AED"
          strokeWidth={stroke + 8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progressRatio) }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="opacity-30 blur-sm"
        />
        <motion.circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="#7C3AED"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progressRatio) }}
          transition={{ duration: 2.5, ease: "easeOut" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          <AnimatedCounter target={current} />
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          hrs contributed
        </span>
        <span className="mt-1 text-xs text-muted-foreground/70">
          Goal: {goal.toLocaleString()} hrs
        </span>
      </div>
    </div>
  );
}

function InfiniteTickerBar({ items }: { items: string[] }) {
  if (!items.length) return null;

  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden border-t border-border/50 bg-black/[0.02] dark:bg-white/[0.02]">
      <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap py-3">
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="mx-6 inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Zap className="h-3.5 w-3.5 shrink-0 text-[#7C3AED]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function GlobalEventPage() {
  const [data, setData] = useState<GlobalEventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadGlobalEvent() {
      setIsLoading(true);

      try {
        const res = await fetch("/api/challenges/global", { cache: "no-store" });
        const payload = await res.json();

        if (!res.ok) {
          throw new Error(payload?.message || "Failed to load global event.");
        }

        if (!ignore) {
          setData({
            ...payload,
            squadOnline: Array.isArray(payload.squadOnline)
              ? payload.squadOnline
              : [],
            topContributors: Array.isArray(payload.topContributors)
              ? payload.topContributors
              : [],
            personalRewards: Array.isArray(payload.personalRewards)
              ? payload.personalRewards
              : [],
            milestones: Array.isArray(payload.milestones)
              ? payload.milestones
              : [],
            tickerItems: Array.isArray(payload.tickerItems)
              ? payload.tickerItems
              : [],
          });
        }
      } catch (error) {
        if (!ignore) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load global event."
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadGlobalEvent();

    return () => {
      ignore = true;
    };
  }, []);

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#7C3AED]" />
        <span className="text-sm font-semibold text-muted-foreground">
          Loading global event...
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">
          Global event data is unavailable right now.
        </p>
      </div>
    );
  }

  const visibleSquad = data.squadOnline;
  const hiddenActiveCount = Math.max(0, data.activeCount - visibleSquad.length);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="relative z-10 flex min-h-screen flex-col">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-4 pb-6 pt-8 text-center sm:pt-12"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 dark:border-red-500/30 dark:bg-red-500/20"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
              Live Event
            </span>
          </motion.div>

          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-[#7C3AED]">{data.event.title}</span>
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {data.event.description}
          </p>
        </motion.header>

        <div className="flex-1 px-4 pb-6 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_280px]">
            <motion.aside
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-5"
            >
              <div className="glass-island rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
                    <Users className="h-4 w-4 text-[#7C3AED]" />
                    Squad Online
                  </h3>
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    {data.activeCount.toLocaleString()} active
                  </span>
                </div>

                <div className="mb-5 flex -space-x-2">
                  {visibleSquad.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No active scholars in the last day.
                    </p>
                  ) : (
                    visibleSquad.map((member, index) => (
                      <motion.div
                        key={member.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 + index * 0.04 }}
                        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] text-xs font-bold text-white ring-2 ring-background"
                        title={member.name}
                      >
                        {member.profileImage ? (
                          <img
                            src={member.profileImage}
                            alt={member.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          member.initials
                        )}
                      </motion.div>
                    ))
                  )}

                  {hiddenActiveCount > 0 ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground ring-2 ring-background"
                    >
                      +{hiddenActiveCount.toLocaleString()}
                    </motion.div>
                  ) : null}
                </div>

                <div className="border-t border-border/50 pt-4">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Top Contributors
                  </h4>
                  <div className="space-y-2.5">
                    {data.topContributors.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Contributions will appear after study time is logged.
                      </p>
                    ) : (
                      data.topContributors.map((entry) => (
                        <div
                          key={entry.userId}
                          className="flex items-center justify-between rounded-xl bg-black/[0.02] px-3 py-2 text-sm transition-colors dark:bg-white/[0.03]"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-xs font-black text-[#7C3AED]">
                              #{entry.rank}
                            </span>
                            <span className="font-semibold text-foreground">
                              {entry.name}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-muted-foreground">
                            {formatHours(entry.contributionHours)}h
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="glass-island rounded-2xl p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
                  <Star className="h-4 w-4 text-amber-500" />
                  Your Contribution
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-black/[0.02] p-3 text-center dark:bg-white/[0.03]">
                    <p className="text-2xl font-black text-foreground">
                      {formatHours(data.currentUserContribution)}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Hours
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/[0.02] p-3 text-center dark:bg-white/[0.03]">
                    <p className="text-2xl font-black text-foreground">
                      {data.contributorCount.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Contributors
                    </p>
                  </div>
                </div>
              </div>
            </motion.aside>

            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="glass-island mx-auto w-full max-w-lg rounded-3xl p-6 text-center sm:p-8">
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#7C3AED]">
                    <Radio className="h-3.5 w-3.5" />
                    Community Progress
                  </span>
                </div>

                <ProgressRing
                  progress={data.event.progress}
                  current={data.event.current}
                  goal={data.event.goal}
                />

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="mt-4 text-lg font-bold text-foreground"
                >
                  {data.event.progress.toFixed(1)}% Complete
                </motion.p>

                <div className="mt-4 flex items-center justify-center gap-6">
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Contributors
                    </p>
                    <p className="text-lg font-black text-foreground">
                      {data.contributorCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-border/50" />
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Active Today
                    </p>
                    <p className="text-lg font-black text-foreground">
                      {data.activeCount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <motion.a
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  href="/dashboard/focus-rooms"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] px-8 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_0_30px_rgba(124,58,237,0.25)] transition-all hover:bg-[#6D28D9] sm:w-auto"
                >
                  <Clock className="h-4 w-4" />
                  Log Your Hours
                  <ArrowRight className="h-4 w-4" />
                </motion.a>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="glass-island mx-auto mt-6 w-full max-w-lg rounded-2xl p-5"
              >
                <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  Community Milestones
                </h4>
                <div className="relative">
                  <div className="h-2.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.event.progress}%` }}
                      transition={{ duration: 2.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-[#7C3AED]"
                    />
                  </div>
                  <div className="mt-2 flex justify-between px-1">
                    {data.milestones.map((milestone) => (
                      <div key={milestone.value} className="text-center">
                        <div
                          className={`mx-auto mb-1 h-2 w-2 rounded-full ${
                            milestone.isReached
                              ? "bg-[#7C3AED]"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {milestone.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-5"
            >
              <div className="glass-island relative overflow-hidden rounded-2xl p-5">
                <h3 className="relative z-10 mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Grand Prize
                </h3>

                <div className="relative z-10 mb-4 flex flex-col items-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="flex h-24 w-24 items-center justify-center rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/10 shadow-[0_0_40px_rgba(124,58,237,0.16)]"
                  >
                    <Gem className="h-10 w-10 text-[#7C3AED]" />
                  </motion.div>
                  <h4 className="mt-4 text-lg font-black text-foreground">
                    {data.event.title}
                  </h4>
                  <p className="mt-1 text-center text-xs leading-relaxed text-muted-foreground">
                    Community rewards unlock when the event target is reached.
                  </p>
                </div>

                <div className="relative z-10 rounded-xl bg-black/[0.03] p-3 text-center dark:bg-white/[0.03]">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Unlocks at
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {data.event.goal.toLocaleString()} Hours
                  </p>
                </div>
              </div>

              <div className="glass-island rounded-2xl p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
                  <Sparkles className="h-4 w-4 text-[#7C3AED]" />
                  Personal Rewards
                </h3>
                <div className="space-y-2.5">
                  {data.personalRewards.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Personal milestones will appear when the event starts.
                    </p>
                  ) : (
                    data.personalRewards.map((tier) => (
                      <div
                        key={tier.tier}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                          tier.unlocked
                            ? "border border-[#7C3AED]/20 bg-[#7C3AED]/10"
                            : "border border-transparent bg-black/[0.02] dark:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                              tier.unlocked
                                ? "bg-[#7C3AED]/20 text-[#7C3AED]"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {tier.unlocked ? "✓" : "•"}
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
                              {tier.hours.toLocaleString()}h contributed
                            </p>
                          </div>
                        </div>
                        {tier.unlocked ? (
                          <span className="text-xs font-bold text-[#7C3AED]">
                            Unlocked
                          </span>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.aside>
          </div>
        </div>

        <InfiniteTickerBar items={data.tickerItems} />
      </div>
    </div>
  );
}

