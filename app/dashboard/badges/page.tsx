"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Crown,
  Shield,
  BookOpen,
  Flame,
  Users,
  Star,
  Zap,
  Trophy,
  Target,
  MessageSquare,
  Clock,
  Lock,
  ChevronDown,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────
type BadgeRarity = "legendary" | "rare" | "common";

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  rarity: BadgeRarity;
  earned: boolean;
  earnedDate?: string;
  progress?: { current: number; total: number; label: string };
}

type BadgeApiItem = Omit<BadgeItem, "icon"> & {
  icon: string;
  title?: string;
  earnedAt?: string | null;
  progressPercentage?: number;
};

const ICON_MAP: Record<string, LucideIcon> = {
  Award,
  Crown,
  Shield,
  BookOpen,
  Flame,
  Users,
  Star,
  Zap,
  Trophy,
  Target,
  MessageSquare,
  Clock,
  Sparkles,
};

type FilterKey = "all" | "legendary" | "rare" | "common";
type SortKey = "rarity" | "newest" | "name";

// ── Badge Data ─────────────────────────────────────────────
// ── Rarity Config ──────────────────────────────────────────
const rarityConfig: Record<
  BadgeRarity,
  {
    label: string;
    gradient: string;
    border: string;
    glow: string;
    iconBg: string;
    tagBg: string;
    tagText: string;
    progressBar: string;
  }
> = {
  legendary: {
    label: "Legendary",
    gradient:
      "     ",
    border:
      "border-yellow-400/50 dark:border-yellow-500/30",
    glow: "shadow-[0_0_30px_rgba(251,191,36,0.15)] dark:shadow-[0_0_30px_rgba(251,191,36,0.2)]",
    iconBg:
      "bg-[#7C3AED]    ",
    tagBg: "bg-yellow-500/15 dark:bg-yellow-500/20",
    tagText: "text-yellow-700 dark:text-yellow-300",
    progressBar:
      "bg-[#7C3AED]   ",
  },
  rare: {
    label: "Rare",
    gradient:
      "     ",
    border:
      "border-purple-400/40 dark:border-purple-500/25",
    glow: "shadow-[0_0_25px_rgba(168,85,247,0.1)] dark:shadow-[0_0_25px_rgba(168,85,247,0.15)]",
    iconBg:
      "bg-[#7C3AED]    ",
    tagBg: "bg-purple-500/15 dark:bg-purple-500/20",
    tagText: "text-purple-700 dark:text-purple-300",
    progressBar:
      "bg-[#7C3AED]   ",
  },
  common: {
    label: "Common",
    gradient:
      "     ",
    border:
      "border-slate-300/50 dark:border-slate-600/30",
    glow: "shadow-sm dark:shadow-[0_0_15px_rgba(100,116,139,0.1)]",
    iconBg:
      "bg-[#7C3AED]    ",
    tagBg: "bg-slate-500/15 dark:bg-slate-500/20",
    tagText: "text-slate-600 dark:text-slate-300",
    progressBar: "bg-[#7C3AED]  ",
  },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Badges" },
  { key: "legendary", label: "Legendary" },
  { key: "rare", label: "Rare" },
  { key: "common", label: "Common" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "rarity", label: "Rarity" },
  { key: "newest", label: "Newest" },
  { key: "name", label: "Name" },
];

const rarityOrder: Record<BadgeRarity, number> = {
  legendary: 0,
  rare: 1,
  common: 2,
};

// ── Animation Variants ─────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

// ── Component ──────────────────────────────────────────────
export default function BadgesPage() {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [stats, setStats] = useState({
    earnedCount: 0,
    totalBadges: 0,
    completionPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("rarity");
  const [sortOpen, setSortOpen] = useState(false);

  const fetchBadges = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch("/api/badges/my", { cache: "no-store" });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load badges.");
      }

      const mappedBadges = Array.isArray(data?.badges)
        ? data.badges.map((badge: BadgeApiItem) => ({
            id: badge.id,
            name: badge.name || badge.title || "Untitled Badge",
            description: badge.description || "",
            icon: ICON_MAP[badge.icon] || Award,
            rarity: badge.rarity || "common",
            earned: Boolean(badge.earned),
            earnedDate: badge.earnedDate || "",
            progress: badge.progress,
          }))
        : [];

      setBadges(mappedBadges);
      setStats({
        earnedCount: Number(data?.stats?.earnedCount || 0),
        totalBadges: Number(data?.stats?.totalBadges || mappedBadges.length),
        completionPercentage: Number(data?.stats?.completionPercentage || 0),
      });
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load badges."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBadges();
  }, [fetchBadges]);

  // Filter
  const filtered =
    activeFilter === "all"
      ? badges
      : badges.filter((b) => b.rarity === activeFilter);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "rarity")
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    if (sortBy === "newest")
      return (b.earnedDate ?? "").localeCompare(a.earnedDate ?? "");
    return a.name.localeCompare(b.name);
  });

  // Stats
  const totalEarned = stats.earnedCount;
  const totalBadges = stats.totalBadges;
  const completionPercentage = stats.completionPercentage;

  return (
    <div className="min-h-screen bg-[#f7f6f8] dark:bg-[#191121] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Hero Section ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Badge of Honor
            </h1>
            <p className="mt-1 text-muted-foreground text-sm sm:text-base">
              Collect badges by reaching milestones, helping peers, and mastering
              your studies.
            </p>
          </div>

          {/* Progress Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-[#7C3AED]   flex items-center justify-center shadow-lg">
                    <Award size={28} className="text-white" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-400 border-2 border-white dark:border-[#191121] flex items-center justify-center">
                    <Crown size={10} className="text-yellow-800" />
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Current Title
                  </p>
                  <h2 className="text-xl font-bold text-foreground">
                    Elite Collector
                  </h2>
                </div>
              </div>

              {/* Earned Count */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Award size={16} className="text-purple-500" />
                <span>
                  <span className="font-bold text-foreground">
                    {totalEarned}
                  </span>{" "}
                  / {totalBadges} earned
                </span>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  Progress to{" "}
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    Grandmaster
                  </span>
                </span>
                <span className="font-bold text-foreground">
                  {totalEarned} / {totalBadges} badges
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#7C3AED]    animate-liquid"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
                <div className="absolute inset-0 rounded-full bg-white/20 dark:bg-white/10" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Filter Controls ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                  ${
                    activeFilter === f.key
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25 dark:shadow-purple-500/30"
                      : "bg-white/60 dark:bg-white/[0.06] text-muted-foreground hover:bg-white dark:hover:bg-white/[0.1] border border-border dark:border-white/10"
                  }
                `}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/60 dark:bg-white/[0.06] border border-border dark:border-white/10 text-muted-foreground hover:bg-white dark:hover:bg-white/[0.1] transition-colors"
            >
              Sort: {SORTS.find((s) => s.key === sortBy)?.label}
              <ChevronDown
                size={14}
                className={`transition-transform ${sortOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-[#1a0f26] border border-border dark:border-white/10 shadow-xl z-30 overflow-hidden"
                >
                  {SORTS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        setSortBy(s.key);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sortBy === s.key
                          ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium"
                          : "text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Masonry Badge Grid ────────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5"
        >
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="break-inside-avoid rounded-2xl border border-border bg-card/80 p-8 text-center text-sm text-muted-foreground">
                Loading badges...
              </div>
            ) : error ? (
              <div className="break-inside-avoid rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            ) : sorted.length === 0 ? (
              <div className="break-inside-avoid rounded-2xl border border-border bg-card/80 p-8 text-center text-sm text-muted-foreground">
                No badges are available yet.
              </div>
            ) : (
              sorted.map((badge) => <BadgeCard key={badge.id} badge={badge} />)
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ── Badge Card ─────────────────────────────────────────────
function BadgeCard({ badge }: { badge: BadgeItem }) {
  const config = rarityConfig[badge.rarity];
  const Icon = badge.icon;
  const isLocked = !badge.earned;

  return (
    <motion.div
      variants={fadeUp}
      layout
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="break-inside-avoid"
    >
      <div
        className={`
          group relative rounded-2xl border p-5 transition-all duration-300
          bg-card/80 dark:bg-white/[0.04] ${config.border}
          backdrop-blur-md
          ${isLocked ? "opacity-60 grayscale" : `${config.glow} hover:-translate-y-2 hover:scale-[1.01]`}
        `}
      >
        {/* Locked Overlay */}
        {isLocked && (
          <div className="absolute inset-0 rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-white/80 dark:bg-white/10 border border-white/50 dark:border-white/20 flex items-center justify-center shadow-lg">
              <Lock size={20} className="text-slate-500 dark:text-slate-400" />
            </div>
          </div>
        )}

        {/* Top Row: Icon + Rarity Tag */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`h-12 w-12 rounded-xl ${config.iconBg} flex items-center justify-center shadow-lg transition-transform duration-300 ${
              !isLocked ? "group-hover:scale-110 group-hover:rotate-3" : ""
            }`}
          >
            <Icon size={22} className="text-white" />
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.tagBg} ${config.tagText}`}
          >
            {config.label}
          </span>
        </div>

        {/* Badge Info */}
        <h3 className="text-base font-bold text-foreground mb-1">
          {badge.name}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          {badge.description}
        </p>

        {/* Earned Date or Progress */}
        {badge.earned && badge.earnedDate ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles size={12} className="text-purple-500 dark:text-purple-400" />
            <span>
              Earned <span className="font-semibold text-foreground">{badge.earnedDate}</span>
            </span>
          </div>
        ) : badge.progress ? (
          <div className="space-y-1.5 relative z-20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                {badge.progress.label}
              </span>
              <span className="font-bold text-foreground">
                {Math.round(
                  (badge.progress.current / badge.progress.total) * 100
                )}
                %
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${config.progressBar} transition-all duration-500`}
                style={{
                  width: `${(badge.progress.current / badge.progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        {/* Legendary 3D glow accent */}
        {badge.rarity === "legendary" && !isLocked && (
          <div className="absolute -inset-px rounded-2xl pointer-events-none border border-yellow-400/20 dark:border-yellow-400/10 group-hover:border-yellow-400/40 dark:group-hover:border-yellow-400/25 transition-colors" />
        )}
      </div>
    </motion.div>
  );
}

