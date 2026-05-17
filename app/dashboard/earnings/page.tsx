"use client";

import { useState } from "react";
import Link from "next/link"; // <-- Link import kiya gaya hai
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  DollarSign,
  Star,
  Calendar,
  FileText,
  Download,
  Filter,
  Search,
  Copy,
  CheckCircle,
  ExternalLink,
  Landmark,
  Shield,
  Sparkles,
  Nfc,
  CreditCard,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Mock Data                                                          */
/* ------------------------------------------------------------------ */

const EARNINGS_DATA = {
  available: 1_250.0,
  pending: 340.0,
  lifetime: 15_400.0,
};

const MONTHLY_DATA = [
  { month: "MAY", value: 800 },
  { month: "JUN", value: 1100 },
  { month: "JUL", value: 1400 },
  { month: "AUG", value: 1650 },
  { month: "SEP", value: 2100 },
  { month: "OCT", value: 3850 },
];

// Projected line (slightly lower)
const PROJECTED_DATA = [
  { month: "MAY", value: 600 },
  { month: "JUN", value: 900 },
  { month: "JUL", value: 1150 },
  { month: "AUG", value: 1400 },
  { month: "SEP", value: 1950 },
  { month: "OCT", value: 3200 },
];

const PAYOUT_METHOD = {
  bank: "Chase",
  lastFour: "4242",
  nextPayout: "Nov 01, 2023",
  frequency: "Weekly",
};

interface Transaction {
  id: string;
  student: string;
  initials: string;
  subject: string;
  date: string;
  duration: string;
  gross: number;
  platformFee: number;
  net: number;
  status: "completed" | "pending" | "refunded";
  sessionType: string;
  rating: number;
  isTopStudent?: boolean;
}

const TRANSACTIONS: Transaction[] = [
  {
    id: "TXN-7842",
    student: "Alice W.",
    initials: "AW",
    subject: "Python Tutoring - Advanced",
    date: "Oct 24, 2023",
    duration: "60 min",
    gross: 55.0,
    platformFee: 5.0,
    net: 50.0,
    status: "completed",
    sessionType: "1-on-1 Tutoring",
    rating: 5,
    isTopStudent: true,
  },
  {
    id: "TXN-7841",
    student: "Mark S.",
    initials: "MS",
    subject: "Calculus Review",
    date: "Oct 23, 2023",
    duration: "45 min",
    gross: 50.0,
    platformFee: 5.0,
    net: 45.0,
    status: "pending",
    sessionType: "Exam Prep",
    rating: 5,
  },
  {
    id: "TXN-7839",
    student: "Sarah J.",
    initials: "SJ",
    subject: "Essay Editing",
    date: "Oct 22, 2023",
    duration: "30 min",
    gross: 33.0,
    platformFee: 3.0,
    net: 30.0,
    status: "completed",
    sessionType: "Review Session",
    rating: 4,
  },
  {
    id: "TXN-7836",
    student: "David Chen",
    initials: "DC",
    subject: "React Basics",
    date: "Oct 20, 2023",
    duration: "60 min",
    gross: 72.0,
    platformFee: 7.0,
    net: 65.0,
    status: "completed",
    sessionType: "1-on-1 Tutoring",
    rating: 5,
    isTopStudent: true,
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

/* ------------------------------------------------------------------ */
/* Background Particles                                                */
/* ------------------------------------------------------------------ */

function BackgroundParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden dark:block hidden">
      {/* Ambient radial glows */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "none",
        }}
      />
      {/* Floating particles */}
      <div className="absolute top-20 left-1/4 w-1 h-1 bg-white rounded-full opacity-20 animate-pulse" />
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-primary rounded-full opacity-10 animate-float" />
      <div
        className="absolute bottom-1/4 left-10 w-1 h-1 rounded-full opacity-30 animate-pulse"
        style={{ background: "#ffd700", animationDelay: "1s" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SVG Area Chart (Dual-line with tooltip)                            */
/* ------------------------------------------------------------------ */

function IncomeChart() {
  const data = MONTHLY_DATA;
  const projected = PROJECTED_DATA;
  const max = Math.max(...data.map((d) => d.value)) * 1.15;
  const W = 600;
  const H = 250;
  const padL = 10;
  const padR = 10;
  const padT = 10;
  const padB = 10;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const toPoint = (d: { value: number }, i: number) => ({
    x: padL + (i / (data.length - 1)) * chartW,
    y: padT + chartH - (d.value / max) * chartH,
  });

  const points = data.map(toPoint);
  const projPoints = projected.map(toPoint);

  // Build smooth cubic bezier paths
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

  const mainPath = buildCurvePath(points);
  const projPath = buildCurvePath(projPoints);
  const areaPath = `${mainPath} L ${points[points.length - 1].x} ${H - padB} L ${points[0].x} ${H - padB} Z`;

  // Grid horizontal lines
  const gridValues = [0, 1000, 2000, 3000, 4000];

  // Highlight the last data point (tooltip)
  const tipIdx = data.length - 1;
  const tipPt = points[tipIdx];

  return (
    <div className="relative w-full">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-400 dark:text-white/20 pr-2 py-2 select-none font-mono">
        <span>$4k</span>
        <span>$3k</span>
        <span>$2k</span>
        <span>$1k</span>
        <span>0</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px] ml-6" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8c30e8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8c30e8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8c30e8" />
            <stop offset="100%" stopColor="#00f0b5" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridValues.map((v) => {
          const y = padT + chartH - (v / max) * chartH;
          return (
            <line key={v} x1={padL} y1={y} x2={W - padR} y2={y} stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-white/5" />
          );
        })}

        {/* Area under main curve */}
        <path d={areaPath} fill="url(#areaGrad2)" />

        {/* Main revenue line */}
        <path
          d={mainPath}
          fill="none"
          stroke="url(#strokeGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          className="drop-shadow-[0_0_10px_rgba(140,48,232,0.5)]"
        />

        {/* Projected line (dashed gold) */}
        <path
          d={projPath}
          fill="none"
          stroke="#ffd700"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeOpacity="0.5"
          strokeLinecap="round"
        />

        {/* Tooltip vertical line */}
        <line
          x1={tipPt.x}
          y1={tipPt.y}
          x2={tipPt.x}
          y2={H - padB}
          stroke="#00f0b5"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        {/* Tooltip dot */}
        <circle cx={tipPt.x} cy={tipPt.y} r="5" fill="#00f0b5" className="drop-shadow-[0_0_10px_#00f0b5]" />
      </svg>

      {/* Tooltip bubble */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `calc(${(tipPt.x / W) * 100}% + 24px)`,
          top: `calc(${(tipPt.y / H) * 100}% - 32px)`,
          transform: "translateX(-50%)",
        }}
      >
        <div className="bg-white/90 dark:bg-black/80 border border-slate-200 dark:border-white/20 px-2.5 py-1 rounded-lg text-xs shadow-xl backdrop-blur-md">
          <span className="text-slate-900 dark:text-white font-bold">$3,850</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-[10px] font-medium font-mono text-slate-400 dark:text-white/40 px-7">
        {data.map((d, i) => (
          <span key={d.month} className={i === data.length - 1 ? "text-slate-900 dark:text-white" : ""}>
            {d.month}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bank Card Visualization                                            */
/* ------------------------------------------------------------------ */

function BankCard() {
  return (
    <div className="relative w-full aspect-[1.58] rounded-xl overflow-hidden group cursor-pointer">
      {/* Card background */}
      <div className="absolute inset-0 bg-[#7C3AED]   z-0" />

      {/* Dot grid texture */}
      <div
        className="absolute inset-0 opacity-20 z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=")`,
          backgroundSize: "4px 4px",
        }}
      />

      {/* Card content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
          <span className="text-white/80 text-base font-semibold tracking-wider">
            {PAYOUT_METHOD.bank}
          </span>
          <Nfc size={18} className="text-white/50" />
        </div>

        {/* Chip */}
        <div className="flex items-center gap-3 my-1">
          <div className="w-9 h-6 bg-amber-500/80 rounded-md opacity-80" />
        </div>

        <div className="flex justify-between items-end">
          <span className="font-mono font-medium text-white/90 tracking-widest text-sm">
            •••• {PAYOUT_METHOD.lastFour}
          </span>
          <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">
            Debit
          </span>
        </div>
      </div>

      {/* Shine sweep effect */}
      <div className="absolute top-0 -left-full w-full h-full bg-[#7C3AED]    group-hover:left-full transition-all duration-1000 ease-in-out z-20" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Transaction Row (Expandable)                                       */
/* ------------------------------------------------------------------ */

function TransactionRow({ tx }: { tx: Transaction }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 dark:border-white/5 last:border-0">
      {/* Summary row - styled as table-like */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full grid grid-cols-[100px_1fr_1fr_100px_120px] items-center gap-2 px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
      >
        {/* Date */}
        <span className="text-xs text-slate-500 dark:text-white/70 whitespace-nowrap">
          {tx.date}
        </span>

        {/* Student */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#7C3AED]   flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {tx.initials}
            </div>
            {/* Gold / Silver aura */}
            {tx.isTopStudent && (
              <div className="absolute -inset-1 rounded-full border border-accent-gold/50 animate-pulse" />
            )}
          </div>
          <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {tx.student}
          </span>
        </div>

        {/* Session */}
        <span className="text-xs text-slate-500 dark:text-white/70 truncate">
          {tx.subject}
        </span>

        {/* Amount */}
        <span className="text-sm font-bold text-slate-900 dark:text-white text-right">
          +{formatCurrency(tx.net)}
        </span>

        {/* Status + chevron */}
        <div className="flex items-center justify-end gap-2">
          {tx.status === "completed" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium border border-emerald-200 dark:border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Completed
            </span>
          ) : tx.status === "pending" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-primary/10 text-primary text-[10px] font-medium border border-purple-200 dark:border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Pending
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-medium border border-red-200 dark:border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Refunded
            </span>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-slate-400 dark:text-white/40" />
          </motion.div>
        </div>
      </button>

      {/* Expandable detail panel */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4 pl-[132px]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.08]">
                <DetailCell label="Session Type" value={tx.sessionType} />
                <DetailCell label="Duration" value={tx.duration} />
                <DetailCell label="Gross Amount" value={formatCurrency(tx.gross)} />
                <DetailCell label="Platform Fee" value={`-${formatCurrency(tx.platformFee)}`} highlight />
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={
                        i < tx.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-white/20"
                      }
                    />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-white/30 font-mono">
                  {tx.id}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-white/40 mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-semibold ${highlight ? "text-red-500 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function EarningsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Transaction["status"]>("all");

  const filtered = TRANSACTIONS.filter((tx) => {
    const matchesSearch =
      tx.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-slate-200 transition-colors">
      <BackgroundParticles />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 md:py-8 lg:px-10">
        {/* ── Page Title & Action ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-white mb-1">
              The Mentor&apos;s Treasury
            </h1>
            <p className="text-slate-500 dark:text-white/50 text-sm font-light">
              Your financial command center &amp; earnings overview
            </p>
          </div>
          
          {/* 👇 LINK TO MONTHLY REPORT ADDED HERE 👇 */}
          <Link href="/dashboard/earnings/report">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED]   text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300">
              <Sparkles className="w-4 h-4" />
              <span className="font-bold text-sm">View Monthly Report</span>
            </button>
          </Link>
        </motion.div>

        {/* ── Top Financial Metrics ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Available Balance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="glass-panel rounded-2xl p-6 relative overflow-hidden group transition-transform duration-300 cursor-default"
          >
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-3xl bg-accent-gold/5 group-hover:bg-accent-gold/10 transition-colors" />
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight size={16} className="text-accent-gold" />
            </div>
            <p className="text-slate-500 dark:text-white/60 text-sm font-medium mb-1">
              Available Balance
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              {formatCurrency(EARNINGS_DATA.available)}
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-gold shadow-[0_0_8px_#ffd700]" />
              <p className="text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-accent-gold">
                Ready for payout
              </p>
            </div>
          </motion.div>

          {/* Pending Clearance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="glass-panel rounded-2xl p-6 relative overflow-hidden group transition-transform duration-300 cursor-default"
          >
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-3xl bg-primary/5 group-hover:bg-primary/10 transition-colors" />
            <p className="text-slate-500 dark:text-white/60 text-sm font-medium mb-1">
              Pending Clearance
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              {formatCurrency(EARNINGS_DATA.pending)}
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Clearing in 2 days
              </p>
            </div>
          </motion.div>

          {/* Lifetime Earnings */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -4 }}
            className="glass-panel rounded-2xl p-6 relative overflow-hidden group transition-transform duration-300 cursor-default border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
          >
            <div className="absolute inset-0 bg-[#7C3AED]   opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-slate-500 dark:text-white/60 text-sm font-medium mb-1">
              Lifetime Earnings
            </p>
            <h3 className="text-3xl font-bold tracking-tight mb-2 text-[#7C3AED]">
              {formatCurrency(EARNINGS_DATA.lifetime)}
            </h3>
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500 dark:text-accent-mint" />
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-accent-mint">
                +12% vs last month
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Two-Column: Chart + Payout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chart Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-0.5">
                  Income Trends
                </h3>
                <p className="text-xs text-slate-400 dark:text-white/40">
                  Revenue overview for the last 6 months
                </p>
              </div>
              <select className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1 text-xs text-slate-600 dark:text-white/80 focus:ring-primary focus:border-primary">
                <option>Last 6 Months</option>
                <option>This Year</option>
              </select>
            </div>
            <IncomeChart />
          </motion.div>

          {/* Payout Method Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-1 glass-panel rounded-2xl p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                Payout Method
              </h3>
              {/* 👇 Link added here 👇 */}
              <Link href="/dashboard/earnings/setup">
                <button className="text-primary hover:text-purple-700 dark:hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
                  Manage
                </button>
              </Link>
            </div>

            {/* Bank Card */}
            <BankCard />

            {/* Payout details */}
            <div className="flex-1 flex flex-col justify-end gap-2 mt-4">
              <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500 dark:text-white/50">Next Payout</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {PAYOUT_METHOD.nextPayout}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500 dark:text-white/50">Frequency</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {PAYOUT_METHOD.frequency}
                </span>
              </div>
            </div>

            {/* 👇 Link added here 👇 */}
            <Link href="/dashboard/earnings/setup" className="w-full mt-5 block">
              <button className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white font-medium py-2.5 rounded-xl border border-slate-200 dark:border-white/10 transition-all hover:-translate-y-[2px] shadow-sm active:translate-y-0 text-sm">
                Change Method
              </button>
            </Link>
          </motion.div>
        </div>

        {/* ── Recent Transactions ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-panel rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white">
              Recent Transactions
            </h2>
            <div className="flex gap-2">
              <button className="bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-200 dark:border-transparent">
                Export CSV
              </button>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus:ring-primary focus:border-primary cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Table header row */}
          <div className="hidden sm:grid grid-cols-[100px_1fr_1fr_100px_120px] items-center gap-2 px-6 py-3 text-[10px] uppercase font-medium tracking-wider text-slate-400 dark:text-white/40 border-b border-slate-100 dark:border-white/5">
            <span>Date</span>
            <span>Student</span>
            <span>Session</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Status</span>
          </div>

          {/* Transaction rows */}
          <div>
            {filtered.length > 0 ? (
              filtered.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-white/40">
                <FileText size={28} className="mb-2 opacity-50" />
                <p className="text-sm">No transactions found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-white/5 flex justify-center">
            <button className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors flex items-center gap-1">
              View All History
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
