"use client";

import { motion } from "framer-motion";
import { Flame, Trophy, Medal, Crown, Star, TrendingUp, Zap, Award, BookOpen, Target } from "lucide-react";

// ── Mock Data ──────────────────────────────────────────────
const topScholars = [
  { rank: 1, name: "Aria Nova", avatar: "AN", xp: 9_820, streak: 47, badges: ["Scholar", "Mentor", "Top 1%"] },
  { rank: 2, name: "Kael Riven", avatar: "KR", xp: 8_450, streak: 34, badges: ["Night Owl", "Mentor"] },
  { rank: 3, name: "Mira Sol", avatar: "MS", xp: 7_930, streak: 29, badges: ["Early Bird", "Helper"] },
];

const currentUser = { rank: 42, name: "You", xp: 1_250, streak: 7 };

const leaderboardData = [
  { rank: 4, name: "Leo Stark",    avatar: "LS", xp: 6_710, badges: ["Streak King", "Helper"] },
  { rank: 5, name: "Zara Kian",    avatar: "ZK", xp: 5_990, badges: ["Scholar"] },
  { rank: 6, name: "Devon Ray",    avatar: "DR", xp: 5_430, badges: ["Night Owl", "Mentor"] },
  { rank: 7, name: "Isla Fern",    avatar: "IF", xp: 4_870, badges: ["Early Bird"] },
  { rank: 8, name: "Nico Voss",    avatar: "NV", xp: 4_320, badges: ["Helper", "Scholar"] },
  { rank: 9, name: "Tess Bloom",   avatar: "TB", xp: 3_850, badges: ["Streak King"] },
  { rank: 10, name: "Rune Atlas",  avatar: "RA", xp: 3_410, badges: ["Mentor"] },
];

const badgeIcons: Record<string, React.ReactNode> = {
  "Scholar":     <BookOpen className="w-3.5 h-3.5" />,
  "Mentor":      <Award className="w-3.5 h-3.5" />,
  "Top 1%":      <Crown className="w-3.5 h-3.5" />,
  "Night Owl":   <Star className="w-3.5 h-3.5" />,
  "Early Bird":  <Zap className="w-3.5 h-3.5" />,
  "Helper":      <Target className="w-3.5 h-3.5" />,
  "Streak King": <Flame className="w-3.5 h-3.5" />,
};

// ── Helpers ────────────────────────────────────────────────
function formatXP(xp: number) {
  return xp.toLocaleString();
}

// ── Podium Card ────────────────────────────────────────────
function PodiumCard({ scholar, index }: { scholar: (typeof topScholars)[0]; index: number }) {
  const isFirst = scholar.rank === 1;
  const heights = ["h-52", "h-44", "h-40"];          // 1st tallest
  const order   = [1, 0, 2];                          // display order: 2nd, 1st, 3rd
  const avatarSizes = ["w-20 h-20 text-2xl", "w-16 h-16 text-xl", "w-14 h-14 text-lg"];
  const medalColors = ["text-yellow-400", "text-slate-300", "text-amber-600"];
  const MedalIcon = index === 0 ? Crown : Medal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: order[index] * 0.2 + 0.3, duration: 0.6, ease: "easeOut" }}
      className={`flex flex-col items-center ${index === 0 ? "order-2" : index === 1 ? "order-1" : "order-3"}`}
    >
      {/* Avatar */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`relative rounded-full flex items-center justify-center font-bold
          ${avatarSizes[index]}
          ${isFirst
            ? "bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 text-[#0a0a0f] shadow-[0_0_40px_rgba(255,215,0,0.5)]"
            : "bg-gradient-to-br from-purple-500/60 to-purple-800/60 text-white/90"
          }
        `}
      >
        {scholar.avatar}
        {isFirst && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full border-2 border-yellow-400/60"
          />
        )}
      </motion.div>

      {/* Medal */}
      <MedalIcon className={`w-6 h-6 mt-2 ${medalColors[index]}`} />

      {/* Name */}
      <p className={`mt-1 font-semibold text-sm ${isFirst ? "text-yellow-300" : "text-white/80"}`}>
        {scholar.name}
      </p>

      {/* Podium pillar */}
      <div
        className={`mt-3 w-24 sm:w-28 ${heights[index]} rounded-t-xl flex flex-col items-center justify-start pt-4
          ${isFirst
            ? "bg-gradient-to-t from-yellow-500/20 via-yellow-400/10 to-transparent border border-yellow-400/30 shadow-[inset_0_0_30px_rgba(255,215,0,0.08)]"
            : "bg-white/[0.04] border border-white/10"
          }
          backdrop-blur-md
        `}
      >
        <span className={`text-3xl font-bold ${isFirst ? "text-yellow-400" : "text-white/50"}`}>
          #{scholar.rank}
        </span>
        <span className={`text-xs mt-1 font-mono ${isFirst ? "text-yellow-300/80" : "text-white/40"}`}>
          {formatXP(scholar.xp)} XP
        </span>
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function LeaderboardPage() {
  return (
    <main
      className="min-h-screen text-white relative overflow-hidden"
      style={{ backgroundColor: "#0a0a0f" }}
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-700/10 blur-[160px]" />
        <div className="absolute top-60 -right-40 w-[400px] h-[400px] rounded-full bg-yellow-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* ── Header ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs text-white/50 mb-4">
            <TrendingUp className="w-3.5 h-3.5" />
            Season 3 — Week 12
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            <Trophy className="inline w-8 h-8 text-yellow-400 mr-2 -mt-1" />
            Leaderboard
          </h1>
          <p className="text-white/40 text-sm mt-2">Top scholars ranked by total XP earned this season.</p>
        </motion.div>

        {/* ── Podium (Top 3) ─────────────────────────── */}
        <section className="flex items-end justify-center gap-3 sm:gap-6 mb-8">
          {topScholars.map((s, i) => (
            <PodiumCard key={s.rank} scholar={s} index={i} />
          ))}
        </section>

        {/* ── Sticky Current User Bar ────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="sticky top-4 z-30 mb-8"
        >
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl px-5 py-3 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                YO
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">Your Rank: <span className="text-purple-400">#{currentUser.rank}</span></p>
                <p className="text-xs text-white/40 font-mono">{formatXP(currentUser.xp)} XP</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-400/20">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold text-orange-300">{currentUser.streak}-day streak</span>
            </div>
          </div>
        </motion.div>

        {/* ── Ranks 4–10 Table ────────────────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          {/* Header row */}
          <div className="grid grid-cols-[48px_1fr_auto_100px] items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-widest text-white/30 font-semibold">
            <span>Rank</span>
            <span>Scholar</span>
            <span className="text-right pr-2">Badges</span>
            <span className="text-right">XP</span>
          </div>

          {/* Rows */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-none">
            {leaderboardData.map((user, i) => (
              <motion.div
                key={user.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + i * 0.07, duration: 0.4 }}
                whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                className="grid grid-cols-[48px_1fr_auto_100px] items-center gap-2 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md transition-colors"
              >
                {/* Rank */}
                <span className="text-sm font-bold text-white/50">#{user.rank}</span>

                {/* User info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600/50 to-indigo-600/50 flex items-center justify-center text-xs font-bold text-white/80 shrink-0">
                    {user.avatar}
                  </div>
                  <span className="text-sm font-medium text-white/80 truncate">{user.name}</span>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 justify-end pr-2">
                  {user.badges.map((badge) => (
                    <span
                      key={badge}
                      title={badge}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[10px] text-white/50"
                    >
                      {badgeIcons[badge] ?? <Star className="w-3 h-3" />}
                      <span className="hidden sm:inline">{badge}</span>
                    </span>
                  ))}
                </div>

                {/* XP */}
                <span className="text-sm font-mono font-semibold text-purple-400 text-right">
                  {formatXP(user.xp)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
