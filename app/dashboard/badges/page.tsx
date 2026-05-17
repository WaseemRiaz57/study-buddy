"use client";

import { useState } from "react";
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

type FilterKey = "all" | "legendary" | "rare" | "common";
type SortKey = "rarity" | "newest" | "name";

// ── Badge Data ─────────────────────────────────────────────
const badgesData: BadgeItem[] = [
  {
    id: "master-scholar",
    name: "Master Scholar",
    description: "Complete 100 study sessions with a perfect focus score.",
    icon: Crown,
    rarity: "legendary",
    earned: true,
    earnedDate: "Jan 2026",
  },
  {
    id: "community-legend",
    name: "Community Legend",
    description: "Receive 500 upvotes across all your community posts.",
    icon: Trophy,
    rarity: "legendary",
    earned: true,
    earnedDate: "Dec 2025",
  },
  {
    id: "flame-keeper",
    name: "Flame Keeper",
    description: "Maintain a 30-day study streak without missing a single day.",
    icon: Flame,
    rarity: "legendary",
    earned: false,
    progress: { current: 22, total: 30, label: "22/30 Days" },
  },
  {
    id: "knowledge-seeker",
    name: "Knowledge Seeker",
    description: "Read and annotate 50 shared resources in the Resource Hub.",
    icon: BookOpen,
    rarity: "rare",
    earned: true,
    earnedDate: "Feb 2026",
  },
  {
    id: "mentor-heart",
    name: "Mentor Heart",
    description: "Help 25 students as a peer mentor with 5-star ratings.",
    icon: Shield,
    rarity: "rare",
    earned: true,
    earnedDate: "Nov 2025",
  },
  {
    id: "team-player",
    name: "Team Player",
    description: "Join and actively participate in 20 study rooms.",
    icon: Users,
    rarity: "rare",
    earned: false,
    progress: { current: 14, total: 20, label: "14/20 Rooms" },
  },
  {
    id: "discussion-spark",
    name: "Discussion Spark",
    description: "Start 50 discussions that receive at least 10 replies each.",
    icon: MessageSquare,
    rarity: "rare",
    earned: false,
    progress: { current: 22, total: 50, label: "22/50 Discussions" },
  },
  {
    id: "rising-star",
    name: "Rising Star",
    description: "Reach the top 10 on the weekly leaderboard.",
    icon: Star,
    rarity: "common",
    earned: true,
    earnedDate: "Jan 2026",
  },
  {
    id: "quick-learner",
    name: "Quick Learner",
    description: "Complete your first 10 study sessions within a week.",
    icon: Zap,
    rarity: "common",
    earned: true,
    earnedDate: "Oct 2025",
  },
  {
    id: "focus-champion",
    name: "Focus Champion",
    description: "Spend 100 total hours in Focus Rooms without interruption.",
    icon: Target,
    rarity: "common",
    earned: true,
    earnedDate: "Dec 2025",
  },
  {
    id: "early-adopter",
    name: "Early Adopter",
    description: "Join StudyBuddy within the first month of launch.",
    icon: Sparkles,
    rarity: "common",
    earned: true,
    earnedDate: "Sep 2025",
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Log 50 study hours between 10 PM and 4 AM.",
    icon: Clock,
    rarity: "common",
    earned: false,
    progress: { current: 31, total: 50, label: "31/50 Hours" },
  },
];

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
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("rarity");
  const [sortOpen, setSortOpen] = useState(false);

  // Filter
  const filtered =
    activeFilter === "all"
      ? badgesData
      : badgesData.filter((b) => b.rarity === activeFilter);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "rarity")
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    if (sortBy === "newest")
      return (b.earnedDate ?? "").localeCompare(a.earnedDate ?? "");
    return a.name.localeCompare(b.name);
  });

  // Stats
  const totalEarned = badgesData.filter((b) => b.earned).length;
  const totalBadges = badgesData.length;

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
                <span className="font-bold text-foreground">850 / 1000 XP</span>
              </div>
              <div className="relative h-3 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#7C3AED]    animate-liquid"
                  initial={{ width: 0 }}
                  animate={{ width: "85%" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
                <div className="absolute inset-0 rounded-full bg-[#7C3AED]  " />
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
            {sorted.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
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
          bg-[#7C3AED] ${config.gradient} ${config.border}
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

