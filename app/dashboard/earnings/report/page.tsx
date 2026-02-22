"use client";

import { motion } from "framer-motion";
import {
  Share2,
  Download,
  TrendingUp,
  Star,
  Sparkles,
  Diamond,
  Zap,
  Users,
  Lock,
  Award,
  BadgeCheck,
  DollarSign,
  Video,
  SmilePlus,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Mock Data                                                          */
/* ------------------------------------------------------------------ */

const HERO_METRICS = [
  {
    label: "Total Revenue",
    value: "$4,500",
    change: "+12.5% vs Mar",
    changeType: "up" as const,
    ring: 85,
    icon: DollarSign,
    ringColor: "text-primary",
    ringGlow: "drop-shadow-[0_0_8px_rgba(140,48,232,0.5)]",
    badgeBg: "bg-emerald-50 dark:bg-emerald-500/10",
    badgeText: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Sessions Conducted",
    value: "32",
    change: "+4 vs Mar",
    changeType: "up" as const,
    ring: 70,
    icon: Video,
    ringColor: "text-amber-500",
    ringGlow: "drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    badgeBg: "bg-emerald-50 dark:bg-emerald-500/10",
    badgeText: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Scholar Satisfaction",
    value: "98%",
    change: "Top 5%",
    changeType: "star" as const,
    ring: 98,
    icon: SmilePlus,
    ringColor: "text-emerald-500",
    ringGlow: "drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    badgeBg: "bg-purple-50 dark:bg-primary/10",
    badgeText: "text-primary",
  },
];

const TOP_SUBJECTS = [
  { name: "React Native", pct: 45, opacity: "" },
  { name: "Data Structures", pct: 30, opacity: "opacity-80" },
  { name: "Algorithms", pct: 15, opacity: "opacity-60" },
  { name: "System Design", pct: 10, opacity: "opacity-40" },
];

interface Achievement {
  icon: typeof Diamond;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  iconBg: string;
  iconColor: string;
  locked?: boolean;
  progress?: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    icon: Diamond,
    title: "Top 5% Mentor",
    description: "Consistent 5-star ratings across all sessions.",
    badge: "PERMANENT",
    badgeColor: "text-primary",
    badgeBg: "bg-primary/5 border-primary/10",
    iconBg: "bg-gradient-to-br from-purple-100 to-white dark:from-purple-900/30 dark:to-slate-800 border-primary/20",
    iconColor: "text-primary",
  },
  {
    icon: Zap,
    title: "Marathon Educator",
    description: "Conducted 10+ hours of sessions in one week.",
    badge: "NEW UNLOCK",
    badgeColor: "text-amber-500",
    badgeBg: "bg-amber-500/5 border-amber-500/10",
    iconBg: "bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-800 border-amber-500/20",
    iconColor: "text-amber-500",
  },
  {
    icon: Users,
    title: "Community Pillar",
    description: "Helped 50+ unique scholars this month.",
    badge: "LEVEL 2",
    badgeColor: "text-emerald-500",
    badgeBg: "bg-emerald-500/5 border-emerald-500/10",
    iconBg: "bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-800 border-emerald-500/20",
    iconColor: "text-emerald-500",
  },
  {
    icon: Lock,
    title: "Course Creator",
    description: "Launch your first pre-recorded course.",
    badge: "",
    badgeColor: "",
    badgeBg: "",
    iconBg: "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600",
    iconColor: "text-slate-400 dark:text-slate-500",
    locked: true,
    progress: 60,
  },
];

/* ------------------------------------------------------------------ */
/* Growth Chart: Weeks 1–4, current vs previous                      */
/* ------------------------------------------------------------------ */

const CHART_CURRENT = [
  { week: 1, value: 800 },
  { week: 2, value: 1300 },
  { week: 3, value: 2400 },
  { week: 4, value: 3600 },
];

const CHART_PREVIOUS = [
  { week: 1, value: 500 },
  { week: 2, value: 1000 },
  { week: 3, value: 1600 },
  { week: 4, value: 2200 },
];

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** SVG ring progress */
function ProgressRing({
  pct,
  colorClass,
  glowClass,
  children,
}: {
  pct: number;
  colorClass: string;
  glowClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-24 h-24 mb-4">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        {/* Background track */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-primary/10 dark:text-primary/20"
        />
        {/* Filled arc */}
        <motion.path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={`${colorClass} ${glowClass}`}
          initial={{ strokeDasharray: "0, 100" }}
          animate={{ strokeDasharray: `${pct}, 100` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/** Area chart comparing current vs previous month */
function GrowthChart() {
  const W = 800;
  const H = 300;
  const padL = 0;
  const padR = 0;
  const padT = 10;
  const padB = 10;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = 4000;

  const toPoint = (d: { value: number }, i: number, total: number) => ({
    x: padL + (i / (total - 1)) * chartW,
    y: padT + chartH - (d.value / maxVal) * chartH,
  });

  const buildCurvePath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cp1x = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.4;
      const cp1y = pts[i].y;
      const cp2x = pts[i + 1].x - (pts[i + 1].x - pts[i].x) * 0.4;
      const cp2y = pts[i + 1].y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
    }
    return d;
  };

  const currentPts = CHART_CURRENT.map((d, i) => toPoint(d, i, CHART_CURRENT.length));
  const prevPts = CHART_PREVIOUS.map((d, i) => toPoint(d, i, CHART_PREVIOUS.length));

  const currentLine = buildCurvePath(currentPts);
  const prevLine = buildCurvePath(prevPts);
  const areaPath = `${currentLine} L ${currentPts[currentPts.length - 1].x} ${H - padB} L ${currentPts[0].x} ${H - padB} Z`;

  // Grid Y positions
  const gridYs = [0, 1000, 2000, 3000].map((v) => padT + chartH - (v / maxVal) * chartH);

  return (
    <div className="flex-1 min-h-[280px] w-full relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="reportAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8c30e8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8c30e8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridYs.map((y, i) => (
          <line
            key={i}
            x1="0"
            y1={y}
            x2={W}
            y2={y}
            className="stroke-slate-100 dark:stroke-slate-700/40"
            strokeWidth="1"
          />
        ))}
        {/* Bottom line */}
        <line
          x1="0"
          y1={H - padB}
          x2={W}
          y2={H - padB}
          className="stroke-slate-100 dark:stroke-slate-700/40"
          strokeWidth="1"
        />

        {/* Previous month line (dashed grey) */}
        <path
          d={prevLine}
          fill="none"
          className="stroke-slate-300 dark:stroke-slate-600"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Current month area + line */}
        <path d={areaPath} fill="url(#reportAreaGrad)" />
        <path
          d={currentLine}
          fill="none"
          stroke="#8c30e8"
          strokeWidth="3"
          strokeLinecap="round"
          filter="drop-shadow(0px 4px 6px rgba(140, 48, 232, 0.3))"
        />

        {/* Data points on current line */}
        {currentPts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="white"
            stroke="#8c30e8"
            strokeWidth="2"
            className="dark:fill-slate-900"
          />
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium px-2">
        <span>Week 1</span>
        <span>Week 2</span>
        <span>Week 3</span>
        <span>Week 4</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function EarningsReportPage() {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-slate-100 transition-colors">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(#8c30e8 0.5px, transparent 0.5px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Ambient blobs */}
        <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[400px] h-[400px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Header Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-500 mb-1">
              <BadgeCheck size={16} />
              <span>Monthly Financial Harvest</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-slate-900 via-primary to-amber-600 dark:from-white dark:via-primary dark:to-amber-400 bg-clip-text text-transparent">
              April 2024: Your Impact &amp; Growth
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-2xl text-sm">
              Detailed analysis of your mentorship sessions, revenue streams,
              and student satisfaction ratings for the past month.
            </p>
          </div>

          <div className="flex gap-3 shrink-0">
            <button className="group flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-primary/20 dark:border-primary/30 rounded-xl shadow-sm hover:shadow-[0_0_15px_rgba(140,48,232,0.3)] hover:border-primary transition-all duration-300">
              <Share2 size={16} className="text-primary group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                Share Achievement
              </span>
            </button>
            <button className="group flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300">
              <Download size={16} className="text-white/90" />
              <span className="font-bold text-sm">Download PDF</span>
            </button>
          </div>
        </motion.div>

        {/* ── Hero Metrics (Glass Panel) ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel rounded-2xl p-6 md:p-8 border-t border-white/80 dark:border-white/5"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-200/60 dark:divide-slate-700/40">
            {HERO_METRICS.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="flex flex-col items-center justify-center p-4"
                >
                  <ProgressRing
                    pct={m.ring}
                    colorClass={m.ringColor}
                    glowClass={m.ringGlow}
                  >
                    <Icon size={24} className={m.ringColor} />
                  </ProgressRing>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {m.label}
                  </p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {m.value}
                  </h3>
                  <div
                    className={`flex items-center gap-1 mt-2 px-2 py-1 ${m.badgeBg} ${m.badgeText} rounded-full text-xs font-bold`}
                  >
                    {m.changeType === "up" ? (
                      <TrendingUp size={12} />
                    ) : (
                      <Star size={12} />
                    )}
                    <span>{m.change}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Growth Insights Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Growth Insights
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Revenue Comparison (Current vs Last Month)
                </p>
              </div>
              <div className="flex gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-slate-600 dark:text-slate-400">
                    April (Current)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-slate-400 dark:text-slate-500">
                    March (Prev)
                  </span>
                </div>
              </div>
            </div>
            <GrowthChart />
          </motion.div>

          {/* Right Sidebar Widgets */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col gap-5"
          >
            {/* Top Subjects */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Top Subjects
              </h3>
              <div className="space-y-5">
                {TOP_SUBJECTS.map((subject) => (
                  <div key={subject.name}>
                    <div className="flex justify-between items-center text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>{subject.name}</span>
                      <span className={`text-primary ${subject.opacity}`}>
                        {subject.pct}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-primary ${subject.opacity} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={
                          subject.pct >= 30
                            ? {
                                boxShadow:
                                  "0 0 10px rgba(140,48,232,0.4)",
                              }
                            : undefined
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Oracle AI Projection */}
            <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-xl">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 z-0" />
              {/* Stardust texture */}
              <div
                className="absolute inset-0 opacity-20 z-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
                  backgroundSize: "6px 6px",
                }}
              />
              {/* Gold glow blob */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500 rounded-full blur-[60px] opacity-40 z-0" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles
                    size={18}
                    className="text-amber-400 animate-pulse"
                  />
                  <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">
                    Oracle AI Projection
                  </p>
                </div>
                <p className="text-indigo-100 text-sm mb-1">
                  Based on your current booking momentum:
                </p>
                <h4 className="text-3xl font-bold text-white mb-2">
                  $5,200
                </h4>
                <p className="text-xs font-medium text-emerald-300 flex items-center gap-1">
                  <TrendingUp size={12} />
                  Projected for May 2024
                </p>

                {/* Confidence score */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-indigo-200">
                    Confidence Score
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-3 rounded-sm ${
                          i <= 4
                            ? "bg-amber-400"
                            : "bg-indigo-500/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Impact Achievements ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pb-4"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Award size={20} className="text-amber-500" />
            Impact Achievements
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.title}
                  className={`relative overflow-hidden rounded-xl border p-5 flex items-start gap-4 transition-all duration-300 ${
                    a.locked
                      ? "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-70 hover:opacity-100"
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1"
                  } group`}
                >
                  {/* Ghost watermark icon */}
                  {!a.locked && (
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Icon size={64} />
                    </div>
                  )}

                  {/* Icon circle */}
                  <div
                    className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${a.iconBg}`}
                  >
                    <Icon size={22} className={a.iconColor} />
                  </div>

                  {/* Text */}
                  <div className="min-w-0">
                    <h4
                      className={`font-bold text-sm ${
                        a.locked
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {a.title}
                    </h4>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        a.locked
                          ? "text-slate-400 dark:text-slate-500"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {a.description}
                    </p>

                    {/* Badge or progress bar */}
                    {a.locked ? (
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-slate-400 dark:bg-slate-500 h-full rounded-full"
                          style={{ width: `${a.progress}%` }}
                        />
                      </div>
                    ) : (
                      <span
                        className={`inline-block mt-2 text-[10px] font-bold ${a.badgeColor} ${a.badgeBg} px-2 py-0.5 rounded border`}
                      >
                        {a.badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
