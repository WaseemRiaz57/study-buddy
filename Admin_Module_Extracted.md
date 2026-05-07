# Admin Module Extraction

This document contains all the extracted code for the Admin Dashboard and associated functionality. You can copy the code blocks below to your new project.

## File: `app/admin/approvals/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  ChevronDown,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types & Mock Data                                                  */
/* ------------------------------------------------------------------ */
type Status = "pending" | "approved" | "rejected";

interface Applicant {
  id: number;
  name: string;
  email: string;
  avatar: string;
  subjects: string[];
  rate: number;
  status: Status;
  date: string;
}

const mockApplicants: Applicant[] = [
  {
    id: 1,
    name: "Alex Mentor",
    email: "alex@example.com",
    avatar: "AM",
    subjects: ["React", "UI/UX"],
    rate: 50,
    status: "pending",
    date: "2 mins ago",
  },
  {
    id: 2,
    name: "Sarah Williams",
    email: "sarah.w@example.com",
    avatar: "SW",
    subjects: ["Physics", "Calculus"],
    rate: 45,
    status: "pending",
    date: "1 hr ago",
  },
  {
    id: 3,
    name: "James Carter",
    email: "james.c@example.com",
    avatar: "JC",
    subjects: ["Python", "Data Science"],
    rate: 60,
    status: "approved",
    date: "Oct 24, 2025",
  },
  {
    id: 4,
    name: "Priya Sharma",
    email: "priya.s@example.com",
    avatar: "PS",
    subjects: ["Biology"],
    rate: 40,
    status: "rejected",
    date: "Oct 20, 2025",
  },
  {
    id: 5,
    name: "David Kim",
    email: "david.k@example.com",
    avatar: "DK",
    subjects: ["Machine Learning", "Statistics"],
    rate: 70,
    status: "pending",
    date: "5 hrs ago",
  },
];

/* ------------------------------------------------------------------ */
/* Tab definitions                                                    */
/* ------------------------------------------------------------------ */
const tabs: { key: Status; label: string; icon: React.ElementType }[] = [
  { key: "pending", label: "Pending Review", icon: Clock },
  { key: "approved", label: "Approved", icon: UserCheck },
  { key: "rejected", label: "Rejected", icon: UserX },
];

/* ------------------------------------------------------------------ */
/* Subject pill colors                                                */
/* ------------------------------------------------------------------ */
const subjectColors: Record<string, string> = {
  React:
    "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  "UI/UX":
    "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400",
  Physics:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  Calculus:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  Python:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  "Data Science":
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  Biology:
    "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  "Machine Learning":
    "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  Statistics:
    "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
};

const defaultPill =
  "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400";

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<Status>("pending");
  const [search, setSearch] = useState("");
  const [applicants, setApplicants] = useState<Applicant[]>(mockApplicants);
  const [filterOpen, setFilterOpen] = useState(false);

  /* Derived data */
  const pendingCount = applicants.filter((a) => a.status === "pending").length;

  const filtered = applicants.filter((a) => {
    if (a.status !== activeTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.subjects.some((s) => s.toLowerCase().includes(q))
    );
  });

  /* Actions */
  const handleApprove = (id: number) =>
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "approved" as Status } : a))
    );

  const handleReject = (id: number) =>
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "rejected" as Status } : a))
    );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
            Mentor Applications
          </h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">
            <Clock size={12} />
            {pendingCount} Pending
          </span>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicants..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
            />
          </div>

          {/* Filter button */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen((p) => !p)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-muted-foreground hover:text-foreground dark:hover:text-white hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors"
            >
              <Filter size={16} />
              Filter
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`}
              />
            </button>

            {filterOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setFilterOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-xl z-40 py-2">
                  {["All Subjects", "React", "Physics", "Python", "Biology"].map(
                    (f) => (
                      <button
                        key={f}
                        onClick={() => setFilterOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                      >
                        {f}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="relative flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = applicants.filter((a) => a.status === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors z-10
                ${
                  isActive
                    ? "text-foreground dark:text-white"
                    : "text-muted-foreground hover:text-foreground dark:hover:text-white"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-tab-pill"
                  className="absolute inset-0 rounded-lg bg-white dark:bg-white/10 shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <tab.icon size={15} />
                {tab.label}
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
                      : "bg-slate-200 text-slate-500 dark:bg-white/[0.06] dark:text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Data Table ── */}
      <div className="rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Applicant
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subjects
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Proposed Rate
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Applied
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
            Actions
          </span>
        </div>

        {/* Table rows */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <UserCheck size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">No {activeTab} applications</p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                {activeTab === "pending"
                  ? "All caught up! No pending reviews."
                  : `No ${activeTab} applications to display.`}
              </p>
            </motion.div>
          ) : (
            filtered.map((applicant) => (
              <motion.div
                key={applicant.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25 }}
                className="group grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-3 md:gap-4 items-center px-6 py-4 border-b border-slate-100 dark:border-white/[0.04] last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* Applicant */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {applicant.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground dark:text-white truncate">
                      {applicant.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {applicant.email}
                    </p>
                  </div>
                </div>

                {/* Subjects */}
                <div className="flex flex-wrap gap-1.5">
                  {applicant.subjects.map((subj) => (
                    <span
                      key={subj}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        subjectColors[subj] || defaultPill
                      }`}
                    >
                      {subj}
                    </span>
                  ))}
                </div>

                {/* Rate */}
                <div>
                  <span className="text-sm font-semibold text-foreground dark:text-white">
                    {applicant.rate}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    Coins/hr
                  </span>
                </div>

                {/* Date */}
                <p className="text-sm text-muted-foreground">{applicant.date}</p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-transparent hover:border-border dark:hover:border-white/10 transition-all"
                    title="View Details"
                  >
                    <Eye size={14} />
                    <span className="hidden lg:inline">View</span>
                  </button>

                  {applicant.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(applicant.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-all"
                        title="Approve"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleReject(applicant.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all"
                        title="Reject"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}

                  {applicant.status === "approved" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      <CheckCircle size={12} />
                      Approved
                    </span>
                  )}

                  {applicant.status === "rejected" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-full">
                      <XCircle size={12} />
                      Rejected
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

```

## File: `app/admin/challenges/page.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    Swords,
    Target,
    Gift,
    Plus,
    Edit,
    Trash2,
    Clock,
    Zap,
    Coins,
    X,
    Flame,
    Users,
    Calendar,
    Sparkles,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type Frequency = "daily" | "weekly" | "one-time";

interface Challenge {
    id: string;
    title: string;
    description: string;
    frequency: Frequency;
    xpReward: number;
    coinReward: number;
    targetGoal: number;
    targetUnit: string;
    completedBy: number;
    totalEligible: number;
    active: boolean;
}

// ─── Frequency Config ───────────────────────────────────────────────────────────
const FREQ_CONFIG: Record<
    Frequency,
    { label: string; badge: string; Icon: React.ElementType }
> = {
    daily: {
        label: "Daily",
        badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25",
        Icon: Clock,
    },
    weekly: {
        label: "Weekly",
        badge: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/25",
        Icon: Calendar,
    },
    "one-time": {
        label: "Special Event",
        badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
        Icon: Sparkles,
    },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const INITIAL_CHALLENGES: Challenge[] = [
    {
        id: "c1",
        title: "Weekend Warrior",
        description: "Study for 5 hours over the weekend to earn bonus rewards.",
        frequency: "weekly",
        xpReward: 500,
        coinReward: 50,
        targetGoal: 5,
        targetUnit: "hours",
        completedBy: 1240,
        totalEligible: 3800,
        active: true,
    },
    {
        id: "c2",
        title: "Flashcard Frenzy",
        description: "Create and review 10 flashcard decks in a single day.",
        frequency: "daily",
        xpReward: 200,
        coinReward: 20,
        targetGoal: 10,
        targetUnit: "decks",
        completedBy: 876,
        totalEligible: 3800,
        active: true,
    },
    {
        id: "c3",
        title: "Helpful Mentor",
        description: "Answer 15 questions from fellow students this week.",
        frequency: "weekly",
        xpReward: 750,
        coinReward: 80,
        targetGoal: 15,
        targetUnit: "answers",
        completedBy: 312,
        totalEligible: 1100,
        active: true,
    },
    {
        id: "c4",
        title: "Launch Day Blitz",
        description: "Complete your first quiz and share your score during the launch event.",
        frequency: "one-time",
        xpReward: 1000,
        coinReward: 150,
        targetGoal: 1,
        targetUnit: "quiz",
        completedBy: 2045,
        totalEligible: 3800,
        active: false,
    },
];

// ─── Toggle Component ───────────────────────────────────────────────────────────
function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 ${checked
                    ? "bg-purple-600"
                    : "bg-slate-300 dark:bg-white/10"
                }`}
        >
            <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
            />
        </button>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function ChallengesManagementPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
    const [modal, setModal] = useState<"create" | Challenge | null>(null);

    // Form state
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formFreq, setFormFreq] = useState<Frequency>("daily");
    const [formXP, setFormXP] = useState(100);
    const [formCoins, setFormCoins] = useState(10);
    const [formTarget, setFormTarget] = useState(1);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    const openCreate = () => {
        setFormTitle("");
        setFormDesc("");
        setFormFreq("daily");
        setFormXP(100);
        setFormCoins(10);
        setFormTarget(1);
        setModal("create");
    };

    const openEdit = (c: Challenge) => {
        setFormTitle(c.title);
        setFormDesc(c.description);
        setFormFreq(c.frequency);
        setFormXP(c.xpReward);
        setFormCoins(c.coinReward);
        setFormTarget(c.targetGoal);
        setModal(c);
    };

    const handleToggle = (id: string, active: boolean) => {
        setChallenges((prev) =>
            prev.map((c) => (c.id === id ? { ...c, active } : c))
        );
    };

    const handleDelete = (id: string) => {
        setChallenges((prev) => prev.filter((c) => c.id !== id));
    };

    const activeCount = challenges.filter((c) => c.active).length;
    const totalCompleted = challenges.reduce((sum, c) => sum + c.completedBy, 0);
    const totalXPDistributed = challenges.reduce(
        (sum, c) => sum + c.completedBy * c.xpReward,
        0
    );

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-indigo-100 border border-indigo-200 text-indigo-600 dark:bg-indigo-500/15 dark:border-indigo-500/25 dark:text-indigo-400">
                        <Swords size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Challenges Management
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Create and manage daily/weekly tasks and their rewards.
                        </p>
                    </div>
                </div>

                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white shadow-md shadow-purple-500/30 hover:bg-purple-700 transition-all shrink-0"
                >
                    <Plus size={15} /> Create New Challenge
                </button>
            </div>

            {/* ════════ STAT CARDS ════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Active Challenges */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-purple-50/60 border-purple-200 dark:bg-purple-500/[0.08] dark:border-purple-500/20">
                    <div className="text-purple-500 dark:text-purple-400 shrink-0">
                        <Target size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            Active Challenges
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {activeCount}
                        </div>
                    </div>
                </div>

                {/* Total Completions */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-emerald-50/60 border-emerald-200 dark:bg-emerald-500/[0.08] dark:border-emerald-500/20">
                    <div className="text-emerald-500 dark:text-emerald-400 shrink-0">
                        <Users size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Total Completions
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {totalCompleted.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* XP Distributed */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-amber-50/60 border-amber-200 dark:bg-amber-500/[0.08] dark:border-amber-500/20">
                    <div className="text-amber-500 dark:text-amber-400 shrink-0">
                        <Gift size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            XP Distributed
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {totalXPDistributed.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ CHALLENGES GRID ════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {challenges.length === 0 ? (
                    <div className="col-span-full text-center py-20">
                        <Swords
                            size={42}
                            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                        />
                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                            No challenges yet.
                        </p>
                        <p className="text-xs text-slate-400/60 dark:text-slate-500/60 mt-1">
                            Create your first challenge to get started.
                        </p>
                    </div>
                ) : (
                    challenges.map((challenge) => {
                        const freq = FREQ_CONFIG[challenge.frequency];
                        const progress =
                            challenge.totalEligible > 0
                                ? Math.round(
                                    (challenge.completedBy / challenge.totalEligible) * 100
                                )
                                : 0;

                        return (
                            <div
                                key={challenge.id}
                                className={`group rounded-2xl border bg-white dark:bg-white/[0.02] flex flex-col transition-all hover:shadow-lg hover:shadow-purple-500/5 ${challenge.active
                                        ? "border-purple-300/60 dark:border-purple-500/30 shadow-sm"
                                        : "border-slate-200 dark:border-white/[0.06] opacity-75"
                                    }`}
                            >
                                {/* Card Header */}
                                <div className="px-5 pt-5 pb-3">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                {challenge.title}
                                            </h3>
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 inline-flex items-center gap-1 ${freq.badge}`}
                                        >
                                            <freq.Icon size={10} />
                                            {freq.label}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                                        {challenge.description}
                                    </p>
                                </div>

                                {/* Progress */}
                                <div className="px-5 pb-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                            Completed by{" "}
                                            <strong className="text-slate-600 dark:text-slate-300">
                                                {challenge.completedBy.toLocaleString()}
                                            </strong>{" "}
                                            users
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                            {progress}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${challenge.active
                                                    ? "bg-gradient-to-r from-purple-500 to-indigo-500"
                                                    : "bg-slate-300 dark:bg-white/10"
                                                }`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Rewards */}
                                <div className="px-5 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/15">
                                            <Zap size={11} className="shrink-0" />+
                                            {challenge.xpReward.toLocaleString()} XP
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/15">
                                            <Coins size={11} className="shrink-0" />+
                                            {challenge.coinReward} Coins
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-100 dark:bg-white/[0.03] dark:text-slate-400 dark:border-white/[0.06]">
                                            <Target size={10} className="shrink-0" />
                                            {challenge.targetGoal} {challenge.targetUnit}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="mt-auto px-5 py-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Toggle
                                            checked={challenge.active}
                                            onChange={(v) =>
                                                handleToggle(challenge.id, v)
                                            }
                                        />
                                        <span
                                            className={`text-[11px] font-semibold ${challenge.active
                                                    ? "text-purple-600 dark:text-purple-400"
                                                    : "text-slate-400 dark:text-slate-500"
                                                }`}
                                        >
                                            {challenge.active ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEdit(challenge)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(challenge.id)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                    {challenges.length} challenges · {activeCount} active
                </span>
                <span>StudyBuddy Admin · Challenges Panel</span>
            </div>

            {/* ════════ CREATE / EDIT MODAL ════════ */}
            {modal !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setModal(null)}
                >
                    <div
                        className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                                    {modal === "create" ? (
                                        <Plus size={16} />
                                    ) : (
                                        <Edit size={16} />
                                    )}
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {modal === "create"
                                        ? "Create New Challenge"
                                        : "Edit Challenge"}
                                </h3>
                            </div>
                            <button
                                onClick={() => setModal(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    Challenge Title
                                </label>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="e.g. Weekend Warrior"
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    value={formDesc}
                                    onChange={(e) => setFormDesc(e.target.value)}
                                    placeholder="What should the student do?"
                                    rows={3}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors resize-none"
                                />
                            </div>

                            {/* Frequency */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    Frequency
                                </label>
                                <div className="flex gap-2">
                                    {(
                                        [
                                            { key: "daily", label: "Daily" },
                                            { key: "weekly", label: "Weekly" },
                                            { key: "one-time", label: "One-Time" },
                                        ] as const
                                    ).map((opt) => {
                                        const isActive = formFreq === opt.key;
                                        return (
                                            <button
                                                key={opt.key}
                                                onClick={() => setFormFreq(opt.key)}
                                                className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${isActive
                                                        ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20"
                                                        : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Rewards Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                        <span className="inline-flex items-center gap-1">
                                            <Zap size={13} className="text-purple-500" /> XP Reward
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formXP}
                                        onChange={(e) =>
                                            setFormXP(Number(e.target.value))
                                        }
                                        min={0}
                                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                        <span className="inline-flex items-center gap-1">
                                            <Coins size={13} className="text-amber-500" /> Coin
                                            Reward
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formCoins}
                                        onChange={(e) =>
                                            setFormCoins(Number(e.target.value))
                                        }
                                        min={0}
                                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>
                            </div>

                            {/* Target Goal */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    <span className="inline-flex items-center gap-1">
                                        <Target size={13} className="text-indigo-500" /> Target Goal
                                    </span>
                                </label>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                                    The number the student must reach (e.g. 5 for &quot;5 hours&quot;, 10 for &quot;10 flashcards&quot;).
                                </p>
                                <input
                                    type="number"
                                    value={formTarget}
                                    onChange={(e) =>
                                        setFormTarget(Number(e.target.value))
                                    }
                                    min={1}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 shrink-0">
                            <button
                                onClick={() => setModal(null)}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setModal(null)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/30 hover:bg-purple-700 transition-all"
                            >
                                {modal === "create" ? (
                                    <>
                                        <Plus size={14} /> Create Challenge
                                    </>
                                ) : (
                                    <>
                                        <Edit size={14} /> Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

```

## File: `app/admin/content/ai-review/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  AlertTriangle,
  ShieldBan,
  Edit3,
  Trash2,
  CheckCircle,
  Search,
  Filter,
  MessageSquareQuote,
  X,
  ChevronDown,
  Clock,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type Tab = "flagged" | "all_logs";
type ContentType = "quiz" | "summary" | "flashcards";
type FlagReason =
  | "Inaccurate Dates"
  | "Inappropriate Language"
  | "Hallucinated Facts"
  | "Off-Topic Output"
  | null;

interface AILogItem {
  id: number;
  user: string;
  userAvatar: string;
  userRole: "student" | "mentor";
  contentType: ContentType;
  prompt: string;
  systemContext: string;
  aiOutput: string;
  flagReason: FlagReason;
  date: string;
  suspended: boolean;
}

/* ------------------------------------------------------------------ */
/* Mock Data                                                          */
/* ------------------------------------------------------------------ */
const mockLogs: AILogItem[] = [
  {
    id: 1,
    user: "Ali Hassan",
    userAvatar: "AH",
    userRole: "student",
    contentType: "summary",
    prompt: "Summarize the key events and turning points of World War II",
    systemContext:
      "You are a history tutor. Provide accurate, concise summaries suitable for high-school level students. Cite specific dates and events.",
    aiOutput:
      "World War II (1939–1945) was a global conflict involving most of the world's nations. Key turning points include the invasion of Poland in September 1940, the Battle of Stalingrad in 1942–1943, D-Day (June 6, 1944), and the atomic bombings of Hiroshima and Nagasaki in August 1945. The war resulted in an estimated 70–85 million fatalities.\n\nNote: The invasion of Poland actually occurred in September 1939, not 1940. This is a factual error that needs correction.",
    flagReason: "Inaccurate Dates",
    date: "Feb 23, 2026",
    suspended: false,
  },
  {
    id: 2,
    user: "Jessica Moore",
    userAvatar: "JM",
    userRole: "student",
    contentType: "quiz",
    prompt: "Generate a 10-question quiz on organic chemistry reactions",
    systemContext:
      "You are a chemistry tutor. Generate multiple-choice questions with 4 options each. Mark the correct answer clearly.",
    aiOutput:
      "Quiz: Organic Chemistry Reactions\n\n1. What is the product of the Grignard reaction between CH₃MgBr and formaldehyde?\n   a) Methanol\n   b) Ethanol ✓\n   c) Propanol\n   d) Butanol\n\n2. Which reagent is used for Swern oxidation?\n   a) KMnO₄\n   b) DMSO/Oxalyl chloride ✓\n   c) PCC\n   d) Jones reagent\n\n3. The Diels-Alder reaction is an example of:\n   a) [2+2] cycloaddition\n   b) [4+2] cycloaddition ✓\n   c) Electrophilic addition\n   d) Free radical substitution",
    flagReason: null,
    date: "Feb 22, 2026",
    suspended: false,
  },
  {
    id: 3,
    user: "Ryan Chang",
    userAvatar: "RC",
    userRole: "student",
    contentType: "flashcards",
    prompt: "Create flashcards about machine learning algorithms including some controversial opinions",
    systemContext:
      "You are an AI/ML tutor. Create clear flashcards with term on front and definition on back. Stay factual and academic.",
    aiOutput:
      "Flashcard 1:\nFront: Linear Regression\nBack: A supervised learning algorithm that models the relationship between variables using a linear equation. Used for predicting continuous outcomes.\n\nFlashcard 2:\nFront: Neural Networks\nBack: These are basically just hype and a waste of compute power. Nobody serious uses them anymore since quantum computing made them obsolete.\n\nFlashcard 3:\nFront: Random Forest\nBack: An ensemble learning method that constructs multiple decision trees during training and outputs the mode of their predictions.",
    flagReason: "Hallucinated Facts",
    date: "Feb 22, 2026",
    suspended: false,
  },
  {
    id: 4,
    user: "Samira Patel",
    userAvatar: "SP",
    userRole: "mentor",
    contentType: "summary",
    prompt: "Explain quantum entanglement for undergraduate physics students",
    systemContext:
      "You are a physics tutor. Provide clear, accurate explanations suitable for undergraduate physics majors. Use analogies where helpful.",
    aiOutput:
      "Quantum entanglement is a phenomenon where two or more particles become interconnected such that the quantum state of each particle cannot be described independently. When measured, entangled particles exhibit correlated results regardless of the distance between them.\n\nKey points:\n- First theorized by Einstein, Podolsky, and Rosen (EPR paradox, 1935)\n- Bell's theorem (1964) provided testable predictions\n- Verified experimentally by Aspect et al. (1982)\n- Does NOT allow faster-than-light communication\n- Fundamental to quantum computing and quantum cryptography",
    flagReason: null,
    date: "Feb 21, 2026",
    suspended: false,
  },
  {
    id: 5,
    user: "Derek Wu",
    userAvatar: "DW",
    userRole: "student",
    contentType: "quiz",
    prompt: "Make a quiz but include some trick questions that insult students who get them wrong",
    systemContext:
      "You are a general tutor. Generate educational quiz content that is respectful and constructive.",
    aiOutput:
      "Quiz: General Knowledge\n\n1. What's the capital of France?\n   a) London (If you picked this, you're an idiot)\n   b) Paris ✓\n   c) Berlin\n   d) Madrid\n\n2. What year did the Titanic sink?\n   a) 1910\n   b) 1912 ✓\n   c) 1915 (Only a moron would pick this)\n   d) 1920",
    flagReason: "Inappropriate Language",
    date: "Feb 20, 2026",
    suspended: false,
  },
  {
    id: 6,
    user: "Lena Kowalski",
    userAvatar: "LK",
    userRole: "student",
    contentType: "flashcards",
    prompt: "Create flashcards about the French Revolution for my history exam",
    systemContext:
      "You are a history tutor. Create accurate flashcards with clear terms and concise definitions.",
    aiOutput:
      "Flashcard 1:\nFront: Storming of the Bastille\nBack: July 14, 1789 — Parisian revolutionaries stormed the Bastille fortress-prison, symbolizing the fall of royal authority.\n\nFlashcard 2:\nFront: Declaration of the Rights of Man\nBack: Adopted August 26, 1789 — Defined individual and collective rights, inspired by Enlightenment philosophy.\n\nFlashcard 3:\nFront: Reign of Terror\nBack: September 1793 – July 1794 — Period of political purges led by the Committee of Public Safety under Robespierre. ~17,000 executed.",
    flagReason: null,
    date: "Feb 19, 2026",
    suspended: false,
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const contentTypeBadge: Record<ContentType, string> = {
  quiz: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  summary:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  flashcards:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

const flagBadge: Record<string, string> = {
  "Inaccurate Dates":
    "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  "Inappropriate Language":
    "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  "Hallucinated Facts":
    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  "Off-Topic Output":
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function AIContentReviewPage() {
  const [logs, setLogs] = useState<AILogItem[]>(mockLogs);
  const [activeTab, setActiveTab] = useState<Tab>("flagged");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemForReview, setSelectedItemForReview] =
    useState<AILogItem | null>(null);
  const [editedOutput, setEditedOutput] = useState("");

  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  /* Derived */
  const flaggedCount = logs.filter((l) => l.flagReason !== null).length;
  const suspendedCount = logs.filter((l) => l.suspended).length;

  const filtered = logs.filter((l) => {
    if (activeTab === "flagged" && l.flagReason === null) return false;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      l.user.toLowerCase().includes(q) ||
      l.prompt.toLowerCase().includes(q);
    const matchesType =
      contentTypeFilter === "all" || l.contentType === contentTypeFilter;
    return matchesSearch && matchesType;
  });

  /* Actions */
  const openReview = (item: AILogItem) => {
    setSelectedItemForReview(item);
    setEditedOutput(item.aiOutput);
  };

  const closeReview = () => setSelectedItemForReview(null);

  const handleSaveCorrections = () => {
    if (!selectedItemForReview) return;
    setLogs((prev) =>
      prev.map((l) =>
        l.id === selectedItemForReview.id
          ? { ...l, aiOutput: editedOutput, flagReason: null }
          : l
      )
    );
    closeReview();
  };

  const handleDeleteContent = (id: number) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    if (selectedItemForReview?.id === id) closeReview();
  };

  const handleSuspendUser = () => {
    if (!selectedItemForReview) return;
    setLogs((prev) =>
      prev.map((l) =>
        l.id === selectedItemForReview.id ? { ...l, suspended: true } : l
      )
    );
    closeReview();
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
          AI Content Review
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor, correct, and moderate AI-generated study materials.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Generations */}
        <div className="rounded-2xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/40 dark:bg-purple-500/[0.04] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Bot size={20} />
            </div>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
              Total Generations
            </span>
          </div>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
            12,450
          </p>
        </div>

        {/* Flagged */}
        <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/[0.04] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center text-red-500 dark:text-red-400">
              <AlertTriangle size={20} />
            </div>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              Flagged for Review
            </span>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-300">
            {flaggedCount}
          </p>
        </div>

        {/* Suspensions */}
        <div className="rounded-2xl border border-orange-200 dark:border-orange-500/20 bg-orange-50/40 dark:bg-orange-500/[0.04] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center text-orange-500 dark:text-orange-400">
              <ShieldBan size={20} />
            </div>
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
              AI Suspensions
            </span>
          </div>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-300">
            {suspendedCount}
          </p>
        </div>
      </div>

      {/* ── Tabs + Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] w-fit">
          <button
            onClick={() => setActiveTab("flagged")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "flagged"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            <AlertTriangle size={15} />
            Flagged Content
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === "flagged"
                  ? "bg-white/20 text-white"
                  : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
              }`}
            >
              {flaggedCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("all_logs")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "all_logs"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            <Bot size={15} />
            All Generation Logs
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 flex-1 sm:justify-end">
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts or users..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
            />
          </div>

          {/* Content Type Filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-muted-foreground hover:text-foreground dark:hover:text-white hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors whitespace-nowrap"
            >
              <Filter size={14} />
              Content Type
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`}
              />
            </button>

            {filterOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setFilterOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-xl z-40 py-1.5 overflow-hidden">
                  {[
                    { value: "all", label: "All Types" },
                    { value: "quiz", label: "Quiz" },
                    { value: "summary", label: "Summary" },
                    { value: "flashcards", label: "Flashcards" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setContentTypeFilter(opt.value);
                        setFilterOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        contentTypeFilter === opt.value
                          ? "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 font-medium"
                          : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
        {/* Table header */}
        <div className="hidden lg:grid grid-cols-[1.2fr_0.8fr_1.5fr_1fr_0.7fr_auto] gap-4 px-6 py-3 border-b border-border dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            User
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Content Type
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            User Prompt
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Flag Reason
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Date
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
            Actions
          </span>
        </div>

        {/* Table rows */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <Bot
                size={40}
                className="mb-3 text-slate-300 dark:text-slate-600"
              />
              <p className="text-sm font-medium">No AI logs found</p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                {activeTab === "flagged"
                  ? "No flagged content to review. All clear!"
                  : "No generation logs match your search."}
              </p>
            </motion.div>
          ) : (
            filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25 }}
                className="group grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr_1.5fr_1fr_0.7fr_auto] gap-3 lg:gap-4 items-center px-6 py-4 border-b border-border/50 dark:border-white/[0.04] last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* User */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {item.userAvatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground dark:text-white truncate flex items-center gap-2">
                      {item.user}
                      {item.suspended && (
                        <ShieldBan
                          size={13}
                          className="text-orange-500 shrink-0"
                        />
                      )}
                    </p>
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {item.userRole}
                    </span>
                  </div>
                </div>

                {/* Content Type */}
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${contentTypeBadge[item.contentType]}`}
                  >
                    <Sparkles size={11} />
                    {item.contentType}
                  </span>
                </div>

                {/* Prompt */}
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  &ldquo;{item.prompt}&rdquo;
                </p>

                {/* Flag Reason */}
                <div>
                  {item.flagReason ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        flagBadge[item.flagReason] ||
                        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                      }`}
                    >
                      <AlertTriangle size={11} />
                      {item.flagReason}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                      <CheckCircle size={11} />
                      Clean
                    </span>
                  )}
                </div>

                {/* Date */}
                <p className="text-sm text-muted-foreground">{item.date}</p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openReview(item)}
                    title="Review & Edit"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 transition-all"
                  >
                    <Edit3 size={13} />
                    <span className="hidden xl:inline">Review</span>
                  </button>
                  <button
                    onClick={() => handleDeleteContent(item.id)}
                    title="Quick Delete"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Review & Moderation Modal ── */}
      <AnimatePresence>
        {selectedItemForReview && (
          <motion.div
            key="review-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeReview}
          >
            <motion.div
              key="review-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-purple-500/20 dark:border-purple-500/15 bg-white dark:bg-[#0f0a16] shadow-2xl shadow-purple-500/10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-white/[0.06] sticky top-0 bg-white dark:bg-[#0f0a16] z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Bot size={18} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-foreground dark:text-white truncate">
                      Review AI Output
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedItemForReview.user} ·{" "}
                      <span className="capitalize">
                        {selectedItemForReview.contentType}
                      </span>{" "}
                      · {selectedItemForReview.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedItemForReview.flagReason && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        flagBadge[selectedItemForReview.flagReason] ||
                        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                      }`}
                    >
                      <AlertTriangle size={11} />
                      {selectedItemForReview.flagReason}
                    </span>
                  )}
                  <button
                    onClick={closeReview}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body — Split View */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border dark:divide-white/[0.06]">
                {/* Left Panel — Context */}
                <div className="p-6 space-y-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Context & Prompt
                  </p>

                  {/* User Details */}
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {selectedItemForReview.userAvatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground dark:text-white flex items-center gap-2">
                        {selectedItemForReview.user}
                        {selectedItemForReview.suspended && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">
                            <ShieldBan size={10} />
                            Suspended
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {selectedItemForReview.userRole} ·{" "}
                        <span className="capitalize">
                          {selectedItemForReview.contentType}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* User Prompt */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                      <MessageSquareQuote size={12} />
                      User Prompt
                    </label>
                    <div className="relative rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/[0.04] p-4">
                      <p className="text-sm text-foreground dark:text-white/90 leading-relaxed italic">
                        &ldquo;{selectedItemForReview.prompt}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* System Context */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                      <Bot size={12} />
                      System Context
                    </label>
                    <div className="rounded-xl border border-border dark:border-white/10 bg-slate-50 dark:bg-black/30 p-4">
                      <code className="text-xs text-muted-foreground leading-relaxed block whitespace-pre-wrap font-mono">
                        {selectedItemForReview.systemContext}
                      </code>
                    </div>
                  </div>

                  {/* Content Type & Date */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${contentTypeBadge[selectedItemForReview.contentType]}`}
                    >
                      <Sparkles size={11} />
                      {selectedItemForReview.contentType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {selectedItemForReview.date}
                    </span>
                  </div>
                </div>

                {/* Right Panel — AI Output Editor */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      AI Output — Edit Mode
                    </p>
                    <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
                      Editable
                    </span>
                  </div>
                  <textarea
                    value={editedOutput}
                    onChange={(e) => setEditedOutput(e.target.value)}
                    rows={18}
                    className="w-full px-4 py-3.5 text-sm rounded-xl border border-purple-200 dark:border-purple-500/20 bg-white dark:bg-black/30 text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors resize-none font-mono leading-relaxed"
                  />
                </div>
              </div>

              {/* Modal Footer — Actions */}
              <div className="px-6 py-4 border-t border-border dark:border-white/[0.06] sticky bottom-0 bg-white dark:bg-[#0f0a16]">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Danger Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleDeleteContent(selectedItemForReview.id)
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete Content
                    </button>
                    <button
                      onClick={handleSuspendUser}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 transition-colors"
                    >
                      <ShieldBan size={14} />
                      Suspend AI Access
                    </button>
                  </div>

                  {/* Primary Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={closeReview}
                      className="px-5 py-2.5 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCorrections}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle size={15} />
                      Save Corrections &amp; Approve
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

```

## File: `app/admin/content/featured/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pin,
  Star,
  Megaphone,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Users,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types & Mock Data                                                  */
/* ------------------------------------------------------------------ */
type Tab = "announcements" | "pinned_posts" | "editors_picks";
type Audience = "All Users" | "Students Only" | "Mentors Only";
type Duration = "24 Hours" | "3 Days" | "1 Week" | "Until Manually Removed";

interface Announcement {
  id: number;
  title: string;
  message: string;
  audience: Audience;
  expiresOn: string;
}

interface PinnedPost {
  id: number;
  content: string;
  author: string;
  datePinned: string;
}

interface EditorsPick {
  id: number;
  title: string;
  author: string;
  datePinned: string;
}

const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "Welcome to Study Buddy 2.0!",
    message:
      "We're excited to launch a new version with improved study rooms, smarter AI, and a fresh look. Dive in and explore the new features!",
    audience: "All Users",
    expiresOn: "Feb 29, 2026",
  },
  {
    id: 2,
    title: "Mentor Applications Open",
    message:
      "Mentors can now apply for the Spring 2026 cohort. Check the dashboard for eligibility and application details.",
    audience: "Mentors Only",
    expiresOn: "Mar 10, 2026",
  },
  {
    id: 3,
    title: "Scheduled Maintenance",
    message:
      "The platform will be down for maintenance on March 2, 2026, from 1 AM to 3 AM UTC. Please save your work.",
    audience: "All Users",
    expiresOn: "Mar 2, 2026",
  },
];

const mockPinnedPosts: PinnedPost[] = [
  {
    id: 1,
    content:
      "Just finished an incredible deep-dive into React Server Components. The mental model shift is real!",
    author: "Sophia Chen",
    datePinned: "Feb 22, 2026",
  },
  {
    id: 2,
    content:
      "Pro tip for my students: always break down complex algorithms into sub-problems first. It saves you hours of debugging later.",
    author: "Marcus Lee",
    datePinned: "Feb 21, 2026",
  },
];

const mockEditorsPicks: EditorsPick[] = [
  {
    id: 1,
    title: "Data Structures & Algorithms Handbook",
    author: "Dr. Anika Rao",
    datePinned: "Feb 20, 2026",
  },
  {
    id: 2,
    title: "Linear Algebra Lecture Series",
    author: "James Carter",
    datePinned: "Feb 18, 2026",
  },
];

const audienceOptions: Audience[] = [
  "All Users",
  "Students Only",
  "Mentors Only",
];
const durationOptions: Duration[] = [
  "24 Hours",
  "3 Days",
  "1 Week",
  "Until Manually Removed",
];

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function FeaturedContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("announcements");
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>(
    mockAnnouncements
  );
  const [pinnedPosts, setPinnedPosts] = useState<PinnedPost[]>(mockPinnedPosts);
  const [editorsPicks, setEditorsPicks] = useState<EditorsPick[]>(
    mockEditorsPicks
  );

  // Modal form state
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newAudience, setNewAudience] = useState<Audience>("All Users");
  const [newDuration, setNewDuration] = useState<Duration>("24 Hours");

  // Actions
  const handlePublishAnnouncement = () => {
    setAnnouncements((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: newTitle,
        message: newMessage,
        audience: newAudience,
        expiresOn: getExpiryDate(newDuration),
      },
    ]);
    setIsAnnouncementModalOpen(false);
    setNewTitle("");
    setNewMessage("");
    setNewAudience("All Users");
    setNewDuration("24 Hours");
  };

  const handleDeleteAnnouncement = (id: number) =>
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));

  const handleUnpinPost = (id: number) =>
    setPinnedPosts((prev) => prev.filter((p) => p.id !== id));

  const handleRemoveEditorsPick = (id: number) =>
    setEditorsPicks((prev) => prev.filter((e) => e.id !== id));

  return (
    <div className="space-y-6">
      {/* ── Header & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
            Featured Content & Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage what users see first on the platform.
          </p>
        </div>
        <button
          onClick={() => setIsAnnouncementModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20"
        >
          <Plus size={17} />
          <Megaphone size={17} />
          Create Announcement
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] w-fit">
        <button
          onClick={() => setActiveTab("announcements")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === "announcements"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
              : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <Megaphone size={15} />
          Platform Announcements
        </button>
        <button
          onClick={() => setActiveTab("pinned_posts")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === "pinned_posts"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
              : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <Pin size={15} />
          Pinned Community Posts
        </button>
        <button
          onClick={() => setActiveTab("editors_picks")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === "editors_picks"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
              : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <Star size={15} className="text-amber-500" />
          Editor's Picks (Resources)
        </button>
      </div>

      {/* ── Content Sections ── */}
      {activeTab === "announcements" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="relative rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 group"
            >
              <div className="flex items-center gap-3 mb-2">
                <Megaphone size={20} className="text-purple-500" />
                <h2 className="text-lg font-bold text-foreground dark:text-white truncate">
                  {a.title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {a.message}
              </p>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
                  <Users size={12} />
                  {a.audience}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white">
                  <Calendar size={12} />
                  Expires {a.expiresOn}
                </span>
              </div>
              <div className="flex items-center gap-2 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                  title="Edit"
                  // onClick={() => ...}
                >
                  <Edit3 size={15} />
                </button>
                <button
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Delete"
                  onClick={() => handleDeleteAnnouncement(a.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "pinned_posts" && (
        <div className="rounded-2xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.02] overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-border dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Content</span>
            <span>Author</span>
            <span>Date Pinned</span>
            <span className="text-right">Actions</span>
          </div>
          {pinnedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Pin size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No pinned posts.</p>
            </div>
          ) : (
            pinnedPosts.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center border-b border-border/50 dark:border-white/[0.04] last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
              >
                <p className="text-sm text-foreground dark:text-white line-clamp-2">
                  {p.content}
                </p>
                <span className="text-sm text-muted-foreground">{p.author}</span>
                <span className="text-xs text-muted-foreground">{p.datePinned}</span>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleUnpinPost(p.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all"
                  >
                    <Pin size={13} />
                    Unpin
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "editors_picks" && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/10 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <span>Title</span>
            <span>Author</span>
            <span>Date Pinned</span>
            <span className="text-right">Actions</span>
          </div>
          {editorsPicks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-amber-500/80">
              <Star size={40} className="mb-3" />
              <p className="text-sm">No editor's picks yet.</p>
            </div>
          ) : (
            editorsPicks.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center border-b border-amber-500/10 last:border-b-0 hover:bg-amber-50/60 dark:hover:bg-amber-500/10 transition-colors group"
              >
                <p className="text-sm text-amber-700 dark:text-amber-300 font-semibold line-clamp-2">
                  {e.title}
                </p>
                <span className="text-sm text-muted-foreground">{e.author}</span>
                <span className="text-xs text-muted-foreground">{e.datePinned}</span>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleRemoveEditorsPick(e.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all"
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Create Announcement Modal ── */}
      <AnimatePresence>
        {isAnnouncementModalOpen && (
          <motion.div
            key="announcement-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsAnnouncementModalOpen(false)}
          >
            <motion.div
              key="announcement-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-primary/20 bg-white dark:bg-[#0f0a16] shadow-2xl shadow-purple-500/10 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-white/[0.06]">
                <h2 className="text-lg font-bold text-foreground dark:text-white">
                  Create Announcement
                </h2>
                <button
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePublishAnnouncement();
                }}
                className="p-6 space-y-5"
              >
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value as Audience)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors appearance-none cursor-pointer"
                  >
                    {audienceOptions.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Duration / Expiry
                  </label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value as Duration)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors appearance-none cursor-pointer"
                  >
                    {durationOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAnnouncementModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20"
                  >
                    <Megaphone size={15} />
                    Publish Announcement
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to get expiry date string from duration
function getExpiryDate(duration: Duration): string {
  const now = new Date();
  switch (duration) {
    case "24 Hours":
      now.setDate(now.getDate() + 1);
      break;
    case "3 Days":
      now.setDate(now.getDate() + 3);
      break;
    case "1 Week":
      now.setDate(now.getDate() + 7);
      break;
    case "Until Manually Removed":
      return "—";
  }
  return now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

```

## File: `app/admin/content/posts/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Trash2,
  Pin,
  Edit,
  MoreVertical,
  MessageSquare,
  Heart,
  ShieldAlert,
  X,
  EyeOff,
  ChevronDown,
  Clock,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type PostStatus = "published" | "flagged" | "hidden";
type Role = "student" | "mentor" | "admin";

interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  role: Role;
  content: string;
  hearts: number;
  commentCount: number;
  status: PostStatus;
  date: string;
  pinned: boolean;
  comments: Comment[];
}

/* ------------------------------------------------------------------ */
/* Mock Data                                                          */
/* ------------------------------------------------------------------ */
const mockPosts: Post[] = [
  {
    id: 1,
    author: "Sophia Chen",
    avatar: "SC",
    role: "student",
    content:
      "Just finished an incredible deep-dive into React Server Components. The mental model shift is real – anyone else feeling this?",
    hearts: 42,
    commentCount: 3,
    status: "published",
    date: "Feb 22, 2026",
    pinned: true,
    comments: [
      {
        id: 101,
        author: "Liam Torres",
        avatar: "LT",
        text: "Totally agree! RSC changed how I think about data fetching entirely.",
        timestamp: "2 hours ago",
      },
      {
        id: 102,
        author: "Ava Patel",
        avatar: "AP",
        text: "I struggled at first but the streaming patterns are so elegant once you get them.",
        timestamp: "4 hours ago",
      },
      {
        id: 103,
        author: "Noah Kim",
        avatar: "NK",
        text: "Great post! Would love to see your notes on this topic.",
        timestamp: "6 hours ago",
      },
    ],
  },
  {
    id: 2,
    author: "Marcus Lee",
    avatar: "ML",
    role: "mentor",
    content:
      "Pro tip for my students: always break down complex algorithms into sub-problems first. It saves you hours of debugging later.",
    hearts: 87,
    commentCount: 4,
    status: "published",
    date: "Feb 21, 2026",
    pinned: false,
    comments: [
      {
        id: 201,
        author: "Zara Ahmed",
        avatar: "ZA",
        text: "This advice literally saved my DSA assignment. Thank you!",
        timestamp: "1 day ago",
      },
      {
        id: 202,
        author: "Ethan Brooks",
        avatar: "EB",
        text: "Can you do a session on dynamic programming next? That's where I always get stuck.",
        timestamp: "1 day ago",
      },
      {
        id: 203,
        author: "Isla Nguyen",
        avatar: "IN",
        text: "Shared this with my entire study group. Gold advice.",
        timestamp: "1 day ago",
      },
      {
        id: 204,
        author: "Oliver Grant",
        avatar: "OG",
        text: "Bookmarked! These tips are always so practical.",
        timestamp: "2 days ago",
      },
    ],
  },
  {
    id: 3,
    author: "Priya Gupta",
    avatar: "PG",
    role: "student",
    content:
      "Can someone explain the difference between useMemo and useCallback? I keep mixing them up in interviews.",
    hearts: 21,
    commentCount: 0,
    status: "published",
    date: "Feb 20, 2026",
    pinned: false,
    comments: [],
  },
  {
    id: 4,
    author: "Jake Morrison",
    avatar: "JM",
    role: "student",
    content:
      "This platform is trash and the mentors don't know what they're talking about. Total scam.",
    hearts: 2,
    commentCount: 0,
    status: "flagged",
    date: "Feb 19, 2026",
    pinned: false,
    comments: [],
  },
  {
    id: 5,
    author: "Dr. Anika Rao",
    avatar: "AR",
    role: "mentor",
    content:
      "New resource uploaded: 'Mastering System Design Interviews — 2026 Edition'. Check the resources library!",
    hearts: 134,
    commentCount: 2,
    status: "published",
    date: "Feb 18, 2026",
    pinned: true,
    comments: [
      {
        id: 501,
        author: "Carlos Rivera",
        avatar: "CR",
        text: "Just downloaded it. The distributed systems chapter is phenomenal.",
        timestamp: "3 days ago",
      },
      {
        id: 502,
        author: "Mia Johnson",
        avatar: "MJ",
        text: "Finally a resource that covers event-driven architecture properly. Thank you Dr. Rao!",
        timestamp: "4 days ago",
      },
    ],
  },
  {
    id: 6,
    author: "Riley Tanaka",
    avatar: "RT",
    role: "admin",
    content:
      "Maintenance window tonight 11 PM–1 AM UTC. Expect brief downtime. We're upgrading the real-time collaboration engine.",
    hearts: 15,
    commentCount: 0,
    status: "hidden",
    date: "Feb 17, 2026",
    pinned: false,
    comments: [],
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const roleBadge: Record<Role, string> = {
  student:
    "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  mentor:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  admin:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

const statusStyles: Record<PostStatus, { dot: string; bg: string; text: string }> = {
  published: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  flagged: {
    dot: "bg-red-500",
    bg: "bg-red-100 dark:bg-red-500/15",
    text: "text-red-700 dark:text-red-400",
  },
  hidden: {
    dot: "bg-slate-400",
    bg: "bg-slate-100 dark:bg-white/[0.06]",
    text: "text-slate-600 dark:text-slate-400",
  },
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function CommunityPostsPage() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [selectedPostForComments, setSelectedPostForComments] =
    useState<Post | null>(null);

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [roleDropdown, setRoleDropdown] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [dateDropdown, setDateDropdown] = useState(false);

  /* Derived */
  const filtered = posts.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.author.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  /* Actions */
  const toggleSelect = (id: number) =>
    setSelectedPosts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () => {
    if (selectedPosts.length === filtered.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filtered.map((p) => p.id));
    }
  };

  const handleBulkDelete = () =>
    setPosts((prev) => prev.filter((p) => !selectedPosts.includes(p.id)));

  const handleDelete = (id: number) =>
    setPosts((prev) => prev.filter((p) => p.id !== id));

  const handlePin = (id: number) =>
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p))
    );

  const handleDeleteComment = (postId: number, commentId: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: p.comments.filter((c) => c.id !== commentId),
              commentCount: Math.max(0, p.commentCount - 1),
            }
          : p
      )
    );
    if (selectedPostForComments?.id === postId) {
      setSelectedPostForComments((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.filter((c) => c.id !== commentId),
              commentCount: Math.max(0, prev.commentCount - 1),
            }
          : null
      );
    }
  };

  const handleHideComment = (postId: number, commentId: number) => {
    // For demo, just remove the comment visually
    handleDeleteComment(postId, commentId);
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* ── Header & Toolbar ── */}
      <div className="flex flex-col gap-4">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
              Community Posts
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
              {posts.length} Posts
            </span>
          </div>

          <AnimatePresence>
            {selectedPosts.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                <Trash2 size={15} />
                Bulk Delete ({selectedPosts.length})
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Search + Filters row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts by author or content..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
            />
          </div>

          {/* Filter: Role */}
          <FilterDropdown
            label="Role"
            value={roleFilter}
            open={roleDropdown}
            setOpen={(v) => {
              setRoleDropdown(v);
              if (v) { setStatusDropdown(false); setDateDropdown(false); }
            }}
            options={[
              { value: "all", label: "All Roles" },
              { value: "student", label: "Student" },
              { value: "mentor", label: "Mentor" },
              { value: "admin", label: "Admin" },
            ]}
            onChange={setRoleFilter}
          />

          {/* Filter: Status */}
          <FilterDropdown
            label="Status"
            value={statusFilter}
            open={statusDropdown}
            setOpen={(v) => {
              setStatusDropdown(v);
              if (v) { setRoleDropdown(false); setDateDropdown(false); }
            }}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "published", label: "Published" },
              { value: "flagged", label: "Flagged" },
              { value: "hidden", label: "Hidden" },
            ]}
            onChange={setStatusFilter}
          />

          {/* Filter: Date */}
          <FilterDropdown
            label="Date"
            value={dateFilter}
            open={dateDropdown}
            setOpen={(v) => {
              setDateDropdown(v);
              if (v) { setRoleDropdown(false); setStatusDropdown(false); }
            }}
            options={[
              { value: "all", label: "All Time" },
              { value: "today", label: "Today" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
            ]}
            onChange={setDateFilter}
          />
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[40px_1fr_1fr_130px_110px_110px_120px] gap-4 px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={
                filtered.length > 0 &&
                selectedPosts.length === filtered.length
              }
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-border dark:border-white/20 accent-purple-600"
            />
          </div>
          <div>Author</div>
          <div>Content</div>
          <div>Engagement</div>
          <div>Status</div>
          <div>Date</div>
          <div className="text-right">Actions</div>
        </div>

        {/* Table rows */}
        <div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Search size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No posts match your filters.</p>
            </div>
          ) : (
            filtered.map((post) => {
              const st = statusStyles[post.status];
              return (
                <div
                  key={post.id}
                  className="grid grid-cols-[40px_1fr_1fr_130px_110px_110px_120px] gap-4 px-5 py-4 items-center border-b border-border/50 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Checkbox */}
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="w-4 h-4 rounded border-border dark:border-white/20 accent-purple-600"
                    />
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {post.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground dark:text-white truncate flex items-center gap-2">
                        {post.author}
                        {post.pinned && (
                          <Pin
                            size={12}
                            className="text-amber-500 shrink-0"
                          />
                        )}
                      </p>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${roleBadge[post.role]}`}
                      >
                        {post.role}
                      </span>
                    </div>
                  </div>

                  {/* Content Snippet */}
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>

                  {/* Engagement */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Heart
                        size={14}
                        className="text-pink-500"
                      />
                      {post.hearts}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare size={14} className="text-sky-500" />
                      {post.commentCount}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${st.bg} ${st.text}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${st.dot}`}
                      />
                      {post.status}
                    </span>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-muted-foreground">
                    {post.date}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setSelectedPostForComments(post)}
                      title="Manage Comments"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors"
                    >
                      <MessageSquare size={15} />
                    </button>
                    <button
                      onClick={() => handlePin(post.id)}
                      title={post.pinned ? "Unpin" : "Pin"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        post.pinned
                          ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                          : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                      }`}
                    >
                      <Pin size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Comments Moderation Modal ── */}
      <AnimatePresence>
        {selectedPostForComments && (
          <motion.div
            key="comments-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedPostForComments(null)}
          >
            <motion.div
              key="comments-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl border border-border dark:border-white/10 bg-white dark:bg-[#0f0a16] shadow-2xl shadow-purple-500/5 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-white/[0.06]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {selectedPostForComments.avatar}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-foreground dark:text-white truncate">
                      Moderating Comments for{" "}
                      <span className="text-purple-600 dark:text-purple-400">
                        {selectedPostForComments.author}
                      </span>
                      &apos;s Post
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedPostForComments.comments.length} comment
                      {selectedPostForComments.comments.length !== 1 && "s"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPostForComments(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Original Post */}
              <div className="px-6 py-4 border-b border-border dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.02]">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Original Post
                </p>
                <p className="text-sm text-foreground/80 dark:text-white/70 leading-relaxed">
                  {selectedPostForComments.content}
                </p>
              </div>

              {/* Comments List */}
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {selectedPostForComments.comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <MessageSquare
                      size={36}
                      className="mb-3 opacity-20"
                    />
                    <p className="text-sm">No comments on this post.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50 dark:divide-white/[0.04]">
                    {selectedPostForComments.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group/comment"
                      >
                        <div className="flex items-start gap-3">
                          {/* Commenter Avatar */}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                            {comment.avatar}
                          </div>

                          {/* Comment Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-foreground dark:text-white">
                                {comment.author}
                              </span>
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock size={10} />
                                {comment.timestamp}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {comment.text}
                            </p>
                          </div>

                          {/* Comment Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() =>
                                handleHideComment(
                                  selectedPostForComments.id,
                                  comment.id
                                )
                              }
                              title="Hide Comment"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                            >
                              <EyeOff size={14} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteComment(
                                  selectedPostForComments.id,
                                  comment.id
                                )
                              }
                              title="Delete Comment"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-border dark:border-white/[0.06] flex justify-end">
                <button
                  onClick={() => setSelectedPostForComments(null)}
                  className="px-5 py-2 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter Dropdown Component                                          */
/* ------------------------------------------------------------------ */
function FilterDropdown({
  label,
  value,
  open,
  setOpen,
  options,
  onChange,
}: {
  label: string;
  value: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const current = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-muted-foreground hover:text-foreground dark:hover:text-white hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors whitespace-nowrap"
      >
        <Filter size={14} />
        {current?.label ?? label}
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-xl z-40 py-1.5 overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  value === opt.value
                    ? "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 font-medium"
                    : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

```

## File: `app/admin/content/resources/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HardDrive,
  FileText,
  FileBadge,
  CheckCircle,
  XCircle,
  Eye,
  Edit3,
  Trash2,
  AlertCircle,
  FileVideo,
  Download,
  Clock,
  Search,
  X,
  ChevronDown,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type Tab = "pending" | "published";
type FileType = "pdf" | "video" | "doc" | "link";
type ResourceStatus = "pending" | "published";
type UploaderRole = "student" | "mentor";

interface Resource {
  id: number;
  title: string;
  fileType: FileType;
  fileFormat: string;
  uploader: string;
  uploaderAvatar: string;
  uploaderRole: UploaderRole;
  subject: string;
  size: string;
  date: string;
  status: ResourceStatus;
  description: string;
  verified: boolean;
}

/* ------------------------------------------------------------------ */
/* Mock Data                                                          */
/* ------------------------------------------------------------------ */
const mockResources: Resource[] = [
  {
    id: 1,
    title: "Physics Chapter 4 Notes",
    fileType: "pdf",
    fileFormat: "PDF",
    uploader: "Sophia Chen",
    uploaderAvatar: "SC",
    uploaderRole: "student",
    subject: "Physics",
    size: "4.2 MB",
    date: "Feb 22, 2026",
    status: "pending",
    description:
      "Comprehensive notes covering Electromagnetic Induction, Faraday's Law, and Lenz's law with solved examples and diagrams.",
    verified: false,
  },
  {
    id: 2,
    title: "Intro to React",
    fileType: "video",
    fileFormat: "Video Link",
    uploader: "Marcus Lee",
    uploaderAvatar: "ML",
    uploaderRole: "mentor",
    subject: "Web Development",
    size: "—",
    date: "Feb 22, 2026",
    status: "pending",
    description:
      "A 45-minute crash course on React fundamentals: JSX, components, props, state, and hooks. Perfect for beginners.",
    verified: false,
  },
  {
    id: 3,
    title: "Organic Chemistry Reactions Sheet",
    fileType: "pdf",
    fileFormat: "PDF",
    uploader: "Priya Gupta",
    uploaderAvatar: "PG",
    uploaderRole: "student",
    subject: "Chemistry",
    size: "1.8 MB",
    date: "Feb 21, 2026",
    status: "pending",
    description:
      "All major organic chemistry reaction mechanisms in a single cheat sheet. Includes named reactions and reagents.",
    verified: false,
  },
  {
    id: 4,
    title: "Data Structures & Algorithms Handbook",
    fileType: "pdf",
    fileFormat: "PDF",
    uploader: "Dr. Anika Rao",
    uploaderAvatar: "AR",
    uploaderRole: "mentor",
    subject: "Computer Science",
    size: "12.6 MB",
    date: "Feb 20, 2026",
    status: "published",
    description:
      "Complete DSA reference guide covering arrays, trees, graphs, dynamic programming, and greedy algorithms with complexity analysis.",
    verified: true,
  },
  {
    id: 5,
    title: "Linear Algebra Lecture Series",
    fileType: "video",
    fileFormat: "Video Link",
    uploader: "James Carter",
    uploaderAvatar: "JC",
    uploaderRole: "mentor",
    subject: "Mathematics",
    size: "—",
    date: "Feb 18, 2026",
    status: "published",
    description:
      "12-part lecture series covering vector spaces, eigenvalues, matrix decomposition, and applications in machine learning.",
    verified: true,
  },
  {
    id: 6,
    title: "Biology Lab Report Template",
    fileType: "doc",
    fileFormat: "DOCX",
    uploader: "Ava Patel",
    uploaderAvatar: "AP",
    uploaderRole: "student",
    subject: "Biology",
    size: "320 KB",
    date: "Feb 17, 2026",
    status: "published",
    description:
      "Pre-formatted lab report template with sections for hypothesis, methodology, results, and analysis. APA style.",
    verified: false,
  },
  {
    id: 7,
    title: "Calculus II — Integration Techniques",
    fileType: "pdf",
    fileFormat: "PDF",
    uploader: "Noah Kim",
    uploaderAvatar: "NK",
    uploaderRole: "student",
    subject: "Mathematics",
    size: "2.9 MB",
    date: "Feb 21, 2026",
    status: "pending",
    description:
      "Step-by-step guide to integration by parts, trig substitution, partial fractions, and improper integrals.",
    verified: false,
  },
  {
    id: 8,
    title: "Machine Learning Foundations",
    fileType: "video",
    fileFormat: "Video Link",
    uploader: "Marcus Lee",
    uploaderAvatar: "ML",
    uploaderRole: "mentor",
    subject: "Computer Science",
    size: "—",
    date: "Feb 16, 2026",
    status: "published",
    description:
      "Covers supervised & unsupervised learning, neural networks, gradient descent, and model evaluation metrics.",
    verified: true,
  },
  {
    id: 9,
    title: "World History Timeline Poster",
    fileType: "pdf",
    fileFormat: "PDF",
    uploader: "Isla Nguyen",
    uploaderAvatar: "IN",
    uploaderRole: "student",
    subject: "History",
    size: "8.4 MB",
    date: "Feb 21, 2026",
    status: "pending",
    description:
      "A visually rich timeline from ancient civilizations through the modern era, designed as a printable A2 poster.",
    verified: false,
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const fileTypeIcon: Record<FileType, React.ElementType> = {
  pdf: FileText,
  video: FileVideo,
  doc: FileBadge,
  link: FileVideo,
};

const fileTypePill: Record<FileType, string> = {
  pdf: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  video:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  doc: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  link: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
};

const roleBadge: Record<UploaderRole, string> = {
  student:
    "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  mentor:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
};

const subjectColors: Record<string, string> = {
  Physics:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  "Web Development":
    "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  Chemistry:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  "Computer Science":
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  Mathematics:
    "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400",
  Biology:
    "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  History:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
};

const defaultSubjectPill =
  "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400";

const removalReasons = [
  "Copyright violation",
  "Low quality / Incomplete content",
  "Duplicate resource",
  "Inappropriate material",
  "Incorrect subject classification",
];

const subjectOptions = [
  "Physics",
  "Web Development",
  "Chemistry",
  "Computer Science",
  "Mathematics",
  "Biology",
  "History",
];

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function ResourcesLibraryPage() {
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResourceForPreview, setSelectedResourceForPreview] =
    useState<Resource | null>(null);

  /* Modal edit state */
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editVerified, setEditVerified] = useState(false);
  const [removalReason, setRemovalReason] = useState(removalReasons[0]);
  const [showRemovalDropdown, setShowRemovalDropdown] = useState(false);

  /* Derived */
  const pendingCount = resources.filter((r) => r.status === "pending").length;
  const publishedCount = resources.filter(
    (r) => r.status === "published"
  ).length;
  const verifiedCount = resources.filter((r) => r.verified).length;
  const totalStorageMB = resources.reduce((acc, r) => {
    const match = r.size.match(/([\d.]+)\s*(MB|KB|GB)/i);
    if (!match) return acc;
    const val = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === "KB") return acc + val / 1024;
    if (unit === "GB") return acc + val * 1024;
    return acc + val;
  }, 0);
  const storageGB = (totalStorageMB / 1024).toFixed(1);

  const filtered = resources.filter((r) => {
    if (r.status !== activeTab) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.uploader.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q)
    );
  });

  /* Actions */
  const openPreview = (resource: Resource) => {
    setSelectedResourceForPreview(resource);
    setEditTitle(resource.title);
    setEditDescription(resource.description);
    setEditSubject(resource.subject);
    setEditVerified(resource.verified);
    setRemovalReason(removalReasons[0]);
  };

  const closePreview = () => setSelectedResourceForPreview(null);

  const handleApprove = (id: number) =>
    setResources((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "published" as ResourceStatus } : r
      )
    );

  const handleReject = (id: number) =>
    setResources((prev) => prev.filter((r) => r.id !== id));

  const handleSaveChanges = () => {
    if (!selectedResourceForPreview) return;
    setResources((prev) =>
      prev.map((r) =>
        r.id === selectedResourceForPreview.id
          ? {
              ...r,
              title: editTitle,
              description: editDescription,
              subject: editSubject,
              verified: editVerified,
            }
          : r
      )
    );
    closePreview();
  };

  const handleApproveFromModal = () => {
    if (!selectedResourceForPreview) return;
    handleApprove(selectedResourceForPreview.id);
    closePreview();
  };

  const handleRemoveFromModal = () => {
    if (!selectedResourceForPreview) return;
    handleReject(selectedResourceForPreview.id);
    closePreview();
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
          Resources Library
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage uploaded resources, approve submissions, and curate your
          library.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending */}
        <div className="rounded-2xl border border-orange-200 dark:border-orange-500/20 bg-orange-50/60 dark:bg-orange-500/[0.06] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Clock size={20} />
            </div>
            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
              Pending Approvals
            </span>
          </div>
          <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
            {pendingCount}
          </p>
        </div>

        {/* Verified */}
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.06] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={20} />
            </div>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Verified Resources
            </span>
          </div>
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
            {verifiedCount}
          </p>
        </div>

        {/* Storage */}
        <div className="rounded-2xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/60 dark:bg-purple-500/[0.06] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <HardDrive size={20} />
            </div>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
              Storage Used
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {storageGB} GB{" "}
            <span className="text-sm font-normal text-purple-500 dark:text-purple-400/70">
              / 100 GB
            </span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-purple-200/60 dark:bg-purple-500/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
              style={{
                width: `${Math.min(
                  (parseFloat(storageGB) / 100) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] w-fit">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === "pending"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
              : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <Clock size={15} />
          Pending Review
          <span
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === "pending"
                ? "bg-white/20 text-white"
                : "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400"
            }`}
          >
            {pendingCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("published")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === "published"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
              : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <FileBadge size={15} />
          Published Library
          <span
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === "published"
                ? "bg-white/20 text-white"
                : "bg-slate-200 text-slate-500 dark:bg-white/[0.06] dark:text-slate-500"
            }`}
          >
            {publishedCount}
          </span>
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resources..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
        />
      </div>

      {/* ── Data Table ── */}
      <div className="rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
        {/* Table header */}
        <div className="hidden lg:grid grid-cols-[2fr_1.2fr_1fr_0.6fr_0.8fr_auto] gap-4 px-6 py-3 border-b border-border dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resource
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Uploader
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subject
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Size
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Uploaded
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
            Actions
          </span>
        </div>

        {/* Table rows */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <FileText
                size={40}
                className="mb-3 text-slate-300 dark:text-slate-600"
              />
              <p className="text-sm font-medium">
                No {activeTab} resources found
              </p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                {activeTab === "pending"
                  ? "All caught up! No pending reviews."
                  : "No published resources match your search."}
              </p>
            </motion.div>
          ) : (
            filtered.map((resource) => {
              const Icon = fileTypeIcon[resource.fileType];
              return (
                <motion.div
                  key={resource.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.25 }}
                  className="group grid grid-cols-1 lg:grid-cols-[2fr_1.2fr_1fr_0.6fr_0.8fr_auto] gap-3 lg:gap-4 items-center px-6 py-4 border-b border-border/50 dark:border-white/[0.04] last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Resource Name & Type */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${fileTypePill[resource.fileType]}`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground dark:text-white truncate flex items-center gap-2">
                        {resource.title}
                        {resource.verified && (
                          <CheckCircle
                            size={13}
                            className="text-emerald-500 shrink-0"
                          />
                        )}
                      </p>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${fileTypePill[resource.fileType]}`}
                      >
                        {resource.fileFormat}
                      </span>
                    </div>
                  </div>

                  {/* Uploader */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {resource.uploaderAvatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground dark:text-white truncate">
                        {resource.uploader}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${roleBadge[resource.uploaderRole]}`}
                      >
                        {resource.uploaderRole}
                      </span>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        subjectColors[resource.subject] || defaultSubjectPill
                      }`}
                    >
                      {resource.subject}
                    </span>
                  </div>

                  {/* Size */}
                  <p className="text-sm text-muted-foreground">
                    {resource.size}
                  </p>

                  {/* Date */}
                  <p className="text-sm text-muted-foreground">
                    {resource.date}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openPreview(resource)}
                      title="Preview"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-transparent hover:border-border dark:hover:border-white/10 transition-all"
                    >
                      <Eye size={15} />
                    </button>
                    {resource.status === "pending" && (
                      <button
                        onClick={() => handleApprove(resource.id)}
                        title="Quick Approve"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-all"
                      >
                        <CheckCircle size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => handleReject(resource.id)}
                      title="Reject & Notify"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all"
                    >
                      <XCircle size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* ── Resource Preview & Metadata Modal ── */}
      <AnimatePresence>
        {selectedResourceForPreview && (
          <motion.div
            key="resource-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closePreview}
          >
            <motion.div
              key="resource-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-border dark:border-white/10 bg-white dark:bg-[#0f0a16] shadow-2xl shadow-purple-500/5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-white/[0.06] sticky top-0 bg-white dark:bg-[#0f0a16] z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${fileTypePill[selectedResourceForPreview.fileType]}`}
                  >
                    {(() => {
                      const Icon =
                        fileTypeIcon[selectedResourceForPreview.fileType];
                      return <Icon size={18} />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-foreground dark:text-white truncate">
                      {selectedResourceForPreview.title}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Uploaded by{" "}
                      <span className="text-purple-600 dark:text-purple-400">
                        {selectedResourceForPreview.uploader}
                      </span>{" "}
                      · {selectedResourceForPreview.date}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closePreview}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0">
                {/* Left — Preview Area */}
                <div className="p-6 border-b md:border-b-0 md:border-r border-border dark:border-white/[0.06]">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Preview
                  </p>
                  <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center h-72 gap-4">
                    {selectedResourceForPreview.fileType === "video" ? (
                      <>
                        <FileVideo
                          size={48}
                          className="text-slate-400 dark:text-slate-600"
                        />
                        <p className="text-sm text-muted-foreground">
                          Video preview not available
                        </p>
                      </>
                    ) : (
                      <>
                        <FileText
                          size={48}
                          className="text-slate-400 dark:text-slate-600"
                        />
                        <p className="text-sm text-muted-foreground">
                          Document preview
                        </p>
                      </>
                    )}
                    <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20">
                      <Download size={15} />
                      Download / View Full
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <HardDrive size={12} />
                      {selectedResourceForPreview.size}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${fileTypePill[selectedResourceForPreview.fileType]}`}
                    >
                      {selectedResourceForPreview.fileFormat}
                    </span>
                  </div>
                </div>

                {/* Right — Metadata Editor */}
                <div className="p-6 space-y-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Metadata Editor
                  </p>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors resize-none"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Subject / Category
                    </label>
                    <select
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors appearance-none cursor-pointer"
                    >
                      {subjectOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Verified Badge Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div>
                      <p className="text-sm font-medium text-foreground dark:text-white">
                        Verified ✅ Badge
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Mark as editor&apos;s pick / quality verified
                      </p>
                    </div>
                    <button
                      onClick={() => setEditVerified(!editVerified)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        editVerified
                          ? "bg-emerald-500"
                          : "bg-slate-300 dark:bg-white/10"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          editVerified ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/[0.04] p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle
                        size={15}
                        className="text-red-500 dark:text-red-400"
                      />
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                        Danger Zone
                      </p>
                    </div>
                    <p className="text-xs text-red-600/80 dark:text-red-400/70">
                      Remove this resource and notify the uploader.
                    </p>

                    {/* Reason dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowRemovalDropdown(!showRemovalDropdown)
                        }
                        className="w-full flex items-center justify-between px-3.5 py-2 text-sm rounded-lg border border-red-200 dark:border-red-500/20 bg-white dark:bg-black/20 text-foreground dark:text-white transition-colors"
                      >
                        <span className="truncate">{removalReason}</span>
                        <ChevronDown
                          size={14}
                          className={`shrink-0 transition-transform duration-200 ${
                            showRemovalDropdown ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {showRemovalDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setShowRemovalDropdown(false)}
                          />
                          <div className="absolute left-0 right-0 mt-1 rounded-xl border border-border dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-xl z-40 py-1.5 overflow-hidden">
                            {removalReasons.map((reason) => (
                              <button
                                key={reason}
                                onClick={() => {
                                  setRemovalReason(reason);
                                  setShowRemovalDropdown(false);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                                  removalReason === reason
                                    ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 font-medium"
                                    : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                                }`}
                              >
                                {reason}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      onClick={handleRemoveFromModal}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                      Remove &amp; Notify User
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border dark:border-white/[0.06] sticky bottom-0 bg-white dark:bg-[#0f0a16]">
                <button
                  onClick={closePreview}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                {selectedResourceForPreview.status === "pending" && (
                  <button
                    onClick={handleApproveFromModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
                  >
                    <CheckCircle size={15} />
                    Approve Resource
                  </button>
                )}
                <button
                  onClick={handleSaveChanges}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20"
                >
                  <Edit3 size={15} />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

```

## File: `app/admin/layout.tsx`

```tsx
"use client";
import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Library,
  Bot,
  Pin,
  Flag,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Users,
  GraduationCap,
  Trophy,
  Swords,
  CreditCard,
  Megaphone,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  LogOut,
  Sparkles,
  Search,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

/* ------------------------------------------------------------------ */
/* Navigation groups                                                  */
/* ------------------------------------------------------------------ */
const navGroups: NavGroup[] = [
  {
    title: "Core / Analytics",
    items: [
      { icon: LayoutDashboard, label: "Overview", href: "/admin" },
    ],
  },
  {
    title: "Content Management",
    items: [
      { icon: MessageSquare, label: "Community Posts", href: "/admin/content/posts" },
      { icon: Library, label: "Resources Library", href: "/admin/content/resources", badge: "12", badgeColor: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400" },
      { icon: Bot, label: "AI Content Review", href: "/admin/content/ai-review" },
      { icon: Pin, label: "Featured Content", href: "/admin/content/featured" },
    ],
  },
  {
    title: "Reports & Moderation",
    items: [
      { icon: Flag, label: "Reports Queue", href: "/admin/moderation/reports", badge: "5", badgeColor: "bg-red-500 text-white" },
      { icon: AlertTriangle, label: "Strikes & Warnings", href: "/admin/moderation/strikes" },
      { icon: Scale, label: "Appeals", href: "/admin/moderation/appeals" },
      { icon: ShieldCheck, label: "Auto-Mod Settings", href: "/admin/moderation/settings" },
    ],
  },
  {
    title: "Users & Mentors",
    items: [
      { icon: Users, label: "User Management", href: "/admin/users" },
      { icon: GraduationCap, label: "Mentor Management", href: "/admin/mentors", badge: "3", badgeColor: "bg-orange-500 text-white" },
    ],
  },
  {
    title: "Gamification",
    items: [
      { icon: Trophy, label: "Leaderboard Control", href: "/admin/leaderboard" },
      { icon: Swords, label: "Challenges Mgmt", href: "/admin/challenges" },
    ],
  },
  {
    title: "Business & System",
    items: [
      { icon: CreditCard, label: "Monetization & Plans", href: "/admin/monetization" },
      { icon: Megaphone, label: "Notifications", href: "/admin/notifications" },
      { icon: Settings, label: "Platform Settings", href: "/admin/settings" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
function checkActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/* ------------------------------------------------------------------ */
/* Sidebar Nav Link                                                   */
/* ------------------------------------------------------------------ */
function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link href={item.href} onClick={onNavigate}>
      <div
        className={`
          group relative flex items-center gap-3 rounded-xl
          transition-all duration-200 overflow-hidden
          ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}
          ${
            active
              ? "bg-primary/10 text-primary border-l-4 border-primary"
              : "text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent"
          }
        `}
      >
        <item.icon
          size={19}
          className={`shrink-0 ${
            active
              ? "text-primary"
              : "group-hover:text-primary transition-colors"
          }`}
        />

        {!collapsed && (
          <span className="text-[13px] font-medium whitespace-nowrap truncate">
            {item.label}
          </span>
        )}

        {/* Expanded badge */}
        {!collapsed && item.badge && (
          <span
            className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
              item.badgeColor || "bg-purple-500/10 text-purple-600 dark:text-purple-400"
            }`}
          >
            {item.badge}
          </span>
        )}

        {/* Collapsed badge dot */}
        {collapsed && item.badge && (
          <span
            className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
              item.badgeColor?.includes("red") ? "bg-red-500" : "bg-orange-500"
            }`}
          />
        )}

        {/* Tooltip (collapsed) */}
        {collapsed && (
          <span
            className="
              pointer-events-none absolute left-full ml-3
              whitespace-nowrap rounded-lg
              bg-slate-800 dark:bg-slate-900 px-3 py-1.5
              text-xs font-medium text-white
              shadow-xl border border-border dark:border-white/10
              opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
              transition-all duration-200 z-[60]
            "
          >
            {item.label}
            {item.badge && (
              <span className="ml-2 text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar Content                                                    */
/* ------------------------------------------------------------------ */
function SidebarBody({
  collapsed,
  pathname,
  onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4 custom-scrollbar">
      {navGroups.map((group) => (
        <div key={group.title}>
          {/* Group header */}
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
              {group.title}
            </p>
          )}
          {collapsed && <div className="mx-auto mb-1.5 w-6 border-t border-slate-200 dark:border-white/[0.06]" />}

          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={checkActive(pathname, item.href)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Admin Layout                                                       */
/* ------------------------------------------------------------------ */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Mounted state for hydration fix
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-[#0f0a16] overflow-hidden flex">
      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-white dark:bg-[#0a0a0f] border-r border-slate-200 dark:border-white/10
          text-muted-foreground dark:text-slate-300
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary shrink-0" />
            <span className="font-bold text-lg tracking-wide text-foreground dark:text-white">
              Admin Panel
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <SidebarBody
          collapsed={false}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />

        {/* Mobile footer */}
        <div className="px-3 pb-4 border-t border-slate-200 dark:border-white/10 pt-3 space-y-1">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white transition-colors">
              <Sparkles size={19} className="shrink-0" />
              <span className="text-[13px] font-medium">Back to App</span>
            </div>
          </Link>

          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground dark:text-white truncate">Admin</p>
              <p className="text-[11px] text-muted-foreground truncate">admin@studybuddy.com</p>
            </div>
            <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={`
          hidden lg:flex flex-col relative h-screen
          bg-white dark:bg-[#0a0a0f] border-r border-slate-200 dark:border-white/10
          text-muted-foreground dark:text-slate-300
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Desktop header */}
        <div
          className={`flex items-center h-16 px-4 border-b border-slate-200 dark:border-white/10 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div
            className={`flex items-center gap-2 overflow-hidden ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <ShieldCheck size={22} className="text-primary shrink-0" />
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-wide text-foreground dark:text-white whitespace-nowrap">
                Admin Panel
              </span>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed((p) => !p)}
            className={`
              p-1.5 rounded-lg text-muted-foreground dark:text-slate-400
              hover:text-foreground dark:hover:text-white
              hover:bg-slate-100 dark:hover:bg-white/10 transition-colors
              ${
                isCollapsed
                  ? "absolute -right-3 top-5 bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 shadow-lg z-10"
                  : ""
              }
            `}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={16} className="transition-transform duration-300" />
            ) : (
              <ChevronLeft size={16} className="transition-transform duration-300" />
            )}
          </button>
        </div>

        <SidebarBody collapsed={isCollapsed} pathname={pathname} />

        {/* Desktop footer */}
        <div className="px-2.5 pb-3 border-t border-slate-200 dark:border-white/10 pt-3 space-y-0.5">
          {/* Back to App */}
          <Link href="/dashboard">
            <div
              className={`
                group relative flex items-center gap-3 rounded-xl
                text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]
                hover:text-slate-900 dark:hover:text-white transition-colors
                ${isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}
              `}
            >
              <Sparkles size={19} className="shrink-0 group-hover:text-primary transition-colors" />
              {!isCollapsed && (
                <span className="text-[13px] font-medium">Back to App</span>
              )}
              {isCollapsed && (
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-slate-800 dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl border border-border dark:border-white/10 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-[60]">
                  Back to App
                </span>
              )}
            </div>
          </Link>

          {/* Admin avatar + logout */}
          <div
            className={`flex items-center rounded-xl ${
              isCollapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              A
            </div>
            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground dark:text-white truncate">
                    Admin
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    admin@studybuddy.com
                  </p>
                </div>
                <button
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar flex flex-col">
        {/* Sticky top header */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-white/10 px-4 md:px-6 flex items-center justify-between bg-white/80 dark:bg-[#0f0a16]/80 backdrop-blur-md">
          {/* Left: hamburger (mobile) + search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Global admin search */}
            <div className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users, reports..."
                className="w-64 lg:w-80 pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button
              className="relative p-2.5 rounded-full text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0f0a16]" />
            </button>

            {/* Theme switcher */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-full text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle theme"
            >
              {/* 👇 The Hydration Fix is right here 👇 */}
              {mounted ? (
                theme === "dark" ? <Sun size={19} /> : <Moon size={19} />
              ) : (
                <div className="w-[19px] h-[19px]" /> 
              )}
            </button>

            {/* Separator */}
            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

            {/* Admin profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  AD
                </div>
                <span className="hidden md:block text-sm font-medium text-foreground dark:text-white">
                  Admin
                </span>
                <ChevronDown
                  size={15}
                  className={`hidden md:block text-muted-foreground transition-transform duration-200 ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-xl z-50 py-1.5 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/[0.06]">
                      <p className="text-sm font-semibold text-foreground dark:text-white">
                        Admin User
                      </p>
                      <p className="text-xs text-muted-foreground">
                        admin@studybuddy.com
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/admin/settings"
                        onClick={() => setProfileOpen(false)}
                      >
                        <div className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                          <Settings size={15} />
                          Platform Settings
                        </div>
                      </Link>
                      <Link
                        href="/admin/notifications"
                        onClick={() => setProfileOpen(false)}
                      >
                        <div className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                          <Bell size={15} />
                          Notifications
                        </div>
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 dark:border-white/[0.06] pt-1">
                      <button className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <LogOut size={15} />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
```

## File: `app/admin/leaderboard/page.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    Trophy,
    RefreshCw,
    Medal,
    ShieldAlert,
    Search,
    Filter,
    ArrowUp,
    ArrowDown,
    UserX,
    X,
    Flame,
    Zap,
    Pencil,
    ChevronDown,
    AlertTriangle,
    Minus,
    Plus,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type Trend = "up" | "down";
type Timeframe = "weekly" | "monthly" | "all-time";
type Role = "students" | "mentors";

interface LeaderboardUser {
    id: string;
    rank: number;
    name: string;
    avatar: string;
    totalXP: number;
    streak: number;
    trend: Trend;
    trendDelta: number;
    flagged: boolean;
}

type ModalType =
    | { kind: "edit"; user: LeaderboardUser }
    | { kind: "remove"; user: LeaderboardUser }
    | null;

// ─── Rank Config ────────────────────────────────────────────────────────────────
const RANK_MEDALS: Record<number, { emoji: string; row: string; badge: string }> = {
    1: {
        emoji: "🥇",
        row: "bg-amber-50/70 dark:bg-amber-500/[0.06] border-l-4 border-l-amber-400",
        badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
    },
    2: {
        emoji: "🥈",
        row: "bg-slate-50/70 dark:bg-slate-400/[0.04] border-l-4 border-l-slate-400",
        badge: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/25",
    },
    3: {
        emoji: "🥉",
        row: "bg-orange-50/40 dark:bg-orange-500/[0.04] border-l-4 border-l-orange-400",
        badge: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25",
    },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_USERS: LeaderboardUser[] = [
    {
        id: "u1",
        rank: 1,
        name: "Sophia Zhang",
        avatar: "SZ",
        totalXP: 12450,
        streak: 28,
        trend: "up",
        trendDelta: 3,
        flagged: false,
    },
    {
        id: "u2",
        rank: 2,
        name: "Alex Nguyen",
        avatar: "AN",
        totalXP: 11200,
        streak: 21,
        trend: "up",
        trendDelta: 1,
        flagged: false,
    },
    {
        id: "u3",
        rank: 3,
        name: "Priya Sharma",
        avatar: "PS",
        totalXP: 9870,
        streak: 14,
        trend: "down",
        trendDelta: 2,
        flagged: false,
    },
    {
        id: "u4",
        rank: 4,
        name: "Jordan Williams",
        avatar: "JW",
        totalXP: 8340,
        streak: 7,
        trend: "up",
        trendDelta: 5,
        flagged: true,
    },
    {
        id: "u5",
        rank: 5,
        name: "Liam O'Brien",
        avatar: "LO",
        totalXP: 7120,
        streak: 11,
        trend: "down",
        trendDelta: 1,
        flagged: false,
    },
];

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function LeaderboardControlPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [timeframe, setTimeframe] = useState<Timeframe>("weekly");
    const [role, setRole] = useState<Role>("students");
    const [searchQuery, setSearchQuery] = useState("");
    const [modal, setModal] = useState<ModalType>(null);
    const [xpAdjust, setXpAdjust] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    const filteredUsers = MOCK_USERS.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatXP = (xp: number) => xp.toLocaleString();

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-amber-100 border border-amber-200 text-amber-600 dark:bg-amber-500/15 dark:border-amber-500/25 dark:text-amber-400">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Leaderboard Control
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage rankings, adjust XP multipliers, and moderate leaderboard integrity.
                        </p>
                    </div>
                </div>

                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all shrink-0">
                    <RefreshCw size={15} /> Reset Weekly Leaderboard
                </button>
            </div>

            {/* ════════ STAT CARDS ════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total XP Earned Today */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-purple-50/60 border-purple-200 dark:bg-purple-500/[0.08] dark:border-purple-500/20">
                    <div className="text-purple-500 dark:text-purple-400 shrink-0">
                        <Zap size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            Total XP Earned Today
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            4,820
                        </div>
                    </div>
                </div>

                {/* Active Streaks */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-orange-50/60 border-orange-200 dark:bg-orange-500/[0.08] dark:border-orange-500/20">
                    <div className="text-orange-500 dark:text-orange-400 shrink-0">
                        <Flame size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            Active Streaks
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            38
                        </div>
                    </div>
                </div>

                {/* Flagged for Boosting */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-red-50/60 border-red-200 dark:bg-red-500/[0.08] dark:border-red-500/20">
                    <div className="text-red-500 dark:text-red-400 shrink-0">
                        <ShieldAlert size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                            Flagged for Boosting
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            1
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ FILTERS + SEARCH ════════ */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Dropdowns */}
                <div className="flex items-center gap-2">
                    {/* Timeframe */}
                    <div className="relative">
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors font-medium"
                        >
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="all-time">All-Time</option>
                        </select>
                        <ChevronDown
                            size={13}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                        />
                    </div>

                    {/* Role */}
                    <div className="relative">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as Role)}
                            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors font-medium"
                        >
                            <option value="students">Students</option>
                            <option value="mentors">Mentors</option>
                        </select>
                        <ChevronDown
                            size={13}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                        />
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    />
                </div>
            </div>

            {/* ════════ LEADERBOARD TABLE ════════ */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px]">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                                <th className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-4 py-3 w-16">
                                    Rank
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    User
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Total XP
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Current Streak
                                </th>
                                <th className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-4 py-3">
                                    Trend
                                </th>
                                <th className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16">
                                        <Trophy
                                            size={36}
                                            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                                        />
                                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                            No users found.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const medal = RANK_MEDALS[user.rank];
                                    const isTopThree = user.rank <= 3;

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`border-b last:border-b-0 transition-colors ${user.flagged
                                                    ? "bg-red-50/50 dark:bg-red-950/15 border-l-4 border-l-red-500 border-b-slate-100 dark:border-b-white/[0.04]"
                                                    : medal
                                                        ? `${medal.row} border-b-slate-100 dark:border-b-white/[0.04]`
                                                        : "border-l-4 border-l-transparent border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                                }`}
                                        >
                                            {/* Rank */}
                                            <td className="px-4 py-4 text-center">
                                                {medal ? (
                                                    <span className="text-xl">{medal.emoji}</span>
                                                ) : (
                                                    <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                                                        #{user.rank}
                                                    </span>
                                                )}
                                            </td>

                                            {/* User */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${user.rank === 1
                                                                ? "bg-gradient-to-br from-amber-400 to-yellow-600"
                                                                : user.rank === 2
                                                                    ? "bg-gradient-to-br from-slate-300 to-slate-500"
                                                                    : user.rank === 3
                                                                        ? "bg-gradient-to-br from-orange-400 to-amber-600"
                                                                        : "bg-gradient-to-br from-purple-500 to-pink-500"
                                                            }`}
                                                    >
                                                        {user.avatar}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                                {user.name}
                                                            </p>
                                                            {user.flagged && (
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
                                                                    Flagged
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isTopThree && (
                                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                                Top performer
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Total XP */}
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {formatXP(user.totalXP)}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                                                    XP
                                                </span>
                                            </td>

                                            {/* Current Streak */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Flame size={13} className="text-orange-500" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {user.streak} Days
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Trend */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    {user.trend === "up" ? (
                                                        <>
                                                            <ArrowUp size={14} className="text-emerald-500" />
                                                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                                +{user.trendDelta}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ArrowDown size={14} className="text-red-500" />
                                                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                                                -{user.trendDelta}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 justify-end">
                                                    <button
                                                        onClick={() => {
                                                            setXpAdjust(0);
                                                            setModal({ kind: "edit", user });
                                                        }}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all whitespace-nowrap"
                                                    >
                                                        <Pencil size={11} /> Edit XP
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setModal({ kind: "remove", user })
                                                        }
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/30 transition-all whitespace-nowrap"
                                                    >
                                                        <UserX size={11} /> Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                    Showing {filteredUsers.length} of {MOCK_USERS.length} users ·{" "}
                    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} ·{" "}
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
                <span>StudyBuddy Admin · Leaderboard Panel</span>
            </div>

            {/* ════════ EDIT XP MODAL ════════ */}
            {modal?.kind === "edit" && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setModal(null)}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {modal.user.avatar}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Edit XP — {modal.user.name}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                        Current: {formatXP(modal.user.totalXP)} XP
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setModal(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    XP Adjustment
                                </label>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                                    Use positive values to add XP (reward) or negative values to
                                    deduct XP (penalty).
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setXpAdjust((v) => v - 100)}
                                        className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <input
                                        type="number"
                                        value={xpAdjust}
                                        onChange={(e) => setXpAdjust(Number(e.target.value))}
                                        className="flex-1 text-center text-lg font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                        onClick={() => setXpAdjust((v) => v + 100)}
                                        className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 border border-slate-200 dark:border-white/[0.06]">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">
                                        New Total
                                    </span>
                                    <span
                                        className={`font-bold ${xpAdjust >= 0
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-red-600 dark:text-red-400"
                                            }`}
                                    >
                                        {formatXP(modal.user.totalXP + xpAdjust)} XP
                                        <span className="text-xs ml-1 font-medium">
                                            ({xpAdjust >= 0 ? "+" : ""}
                                            {formatXP(xpAdjust)})
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10">
                            <button
                                onClick={() => setModal(null)}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setModal(null)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/30 hover:bg-purple-700 transition-all"
                            >
                                <Pencil size={13} /> Apply XP Change
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ REMOVE CONFIRMATION MODAL ════════ */}
            {modal?.kind === "remove" && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setModal(null)}
                >
                    <div
                        className="relative w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle size={22} className="text-red-500 dark:text-red-400" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Remove from Leaderboard
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                                Are you sure you want to remove <strong className="text-slate-700 dark:text-slate-300">{modal.user.name}</strong> from
                                the leaderboard? This action is typically used for users caught
                                cheating or XP boosting.
                            </p>
                        </div>

                        {/* User Preview */}
                        <div className="mx-6 mb-4 rounded-xl bg-red-50/50 dark:bg-red-500/[0.05] p-3 border border-red-100 dark:border-red-500/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {modal.user.avatar}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                        {modal.user.name}
                                    </p>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                        Rank #{modal.user.rank} · {formatXP(modal.user.totalXP)} XP
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 px-6 pb-6">
                            <button
                                onClick={() => setModal(null)}
                                className="flex-1 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setModal(null)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white shadow-md shadow-red-500/30 hover:bg-red-700 transition-all"
                            >
                                <UserX size={13} /> Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

```

## File: `app/admin/mentors/page.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    GraduationCap,
    Star,
    CheckCircle,
    XCircle,
    FileText,
    Search,
    UserCheck,
    X,
    Users,
    Clock,
    Award,
    ShieldCheck,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface ActiveMentor {
    id: string;
    name: string;
    avatar: string;
    subjects: string[];
    rating: number;
    studentsGuided: number;
    joinedDate: string;
}

interface PendingApplication {
    id: string;
    name: string;
    email: string;
    avatar: string;
    requestedSubjects: string[];
    experience: string;
    motivation: string;
    credentials: string;
    applicationDate: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const ACTIVE_MENTORS: ActiveMentor[] = [
    {
        id: "m1",
        name: "Dr. Sarah Chen",
        avatar: "SC",
        subjects: ["Machine Learning", "Data Science"],
        rating: 4.9,
        studentsGuided: 142,
        joinedDate: "Sep 2024",
    },
    {
        id: "m2",
        name: "Prof. James Miller",
        avatar: "JM",
        subjects: ["Web Development", "React", "Node.js"],
        rating: 4.7,
        studentsGuided: 98,
        joinedDate: "Nov 2024",
    },
    {
        id: "m3",
        name: "Aisha Patel",
        avatar: "AP",
        subjects: ["Mathematics", "Linear Algebra"],
        rating: 4.8,
        studentsGuided: 67,
        joinedDate: "Jan 2025",
    },
];

const PENDING_APPLICATIONS: PendingApplication[] = [
    {
        id: "p1",
        name: "Carlos Rivera",
        email: "carlos.r@university.edu",
        avatar: "CR",
        requestedSubjects: ["HCI", "UX Research"],
        experience:
            "5 years as a UX researcher at Google, published 3 papers on human-computer interaction methodologies. Previously taught as an adjunct professor for 2 semesters at UC Berkeley.",
        motivation:
            "I'm passionate about mentoring the next generation of UX practitioners. Having transitioned from academia to industry, I understand the challenges students face and want to bridge that gap. I believe in hands-on, project-based learning and would love to guide students through real-world design challenges.",
        credentials: "PhD_HCI_Thesis_Rivera.pdf",
        applicationDate: "2 days ago",
    },
    {
        id: "p2",
        name: "Maria Gonzalez",
        email: "maria.g@techmail.com",
        avatar: "MG",
        requestedSubjects: ["Physics", "Quantum Computing"],
        experience:
            "Research scientist at CERN for 3 years, Master's in Theoretical Physics from MIT. Mentored 12 undergraduate students through thesis projects and lab rotations.",
        motivation:
            "Physics can be intimidating for many students, but I believe the right mentor can make complex topics accessible and exciting. I want to share my research experience and help students develop critical thinking skills that extend beyond the classroom.",
        credentials: "Research_Portfolio_Gonzalez.pdf",
        applicationDate: "4 days ago",
    },
    {
        id: "p3",
        name: "David Kim",
        email: "d.kim@devstudio.io",
        avatar: "DK",
        requestedSubjects: ["Web Development", "TypeScript"],
        experience:
            "Senior full-stack developer with 8 years at Shopify and Stripe. Open-source contributor to Next.js and TypeScript compiler. Conducted 20+ workshops at tech conferences.",
        motivation:
            "I've benefited enormously from mentors throughout my career and want to pay it forward. I specialize in making complex architectural concepts understandable and love helping developers level up from intermediate to senior. My teaching style is collaborative — I prefer pairing sessions over lectures.",
        credentials: "Workshop_Speaker_Portfolio_Kim.pdf",
        applicationDate: "1 week ago",
    },
];

// ─── Rating Stars Component ────────────────────────────────────────────────────
function RatingDisplay({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1.5">
            <Star size={13} className="text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {rating.toFixed(1)}
            </span>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function MentorManagementPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"active" | "pending">("active");
    const [searchQuery, setSearchQuery] = useState("");
    const [reviewModal, setReviewModal] = useState<PendingApplication | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    const filteredMentors = ACTIVE_MENTORS.filter(
        (m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.subjects.some((s) =>
                s.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

    const filteredApplications = PENDING_APPLICATIONS.filter(
        (a) =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.requestedSubjects.some((s) =>
                s.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-purple-100 border border-purple-200 text-purple-600 dark:bg-purple-500/15 dark:border-purple-500/25 dark:text-purple-400">
                        <GraduationCap size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Mentor Management
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Review mentor applications and manage active platform educators.
                        </p>
                    </div>
                </div>
            </div>

            {/* ════════ STAT CARDS ════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Active Mentors */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-purple-50/60 border-purple-200 dark:bg-purple-500/[0.08] dark:border-purple-500/20">
                    <div className="text-purple-500 dark:text-purple-400 shrink-0">
                        <UserCheck size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            Active Mentors
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {ACTIVE_MENTORS.length}
                        </div>
                    </div>
                </div>

                {/* Pending Applications */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-orange-50/60 border-orange-200 dark:bg-orange-500/[0.08] dark:border-orange-500/20">
                    <div className="text-orange-500 dark:text-orange-400 shrink-0">
                        <Clock size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            Pending Applications
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {PENDING_APPLICATIONS.length}
                        </div>
                    </div>
                </div>

                {/* Average Rating */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-yellow-50/60 border-yellow-200 dark:bg-yellow-500/[0.08] dark:border-yellow-500/20">
                    <div className="text-yellow-500 dark:text-yellow-400 shrink-0">
                        <Star size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                            Average Rating
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                            {(
                                ACTIVE_MENTORS.reduce((sum, m) => sum + m.rating, 0) /
                                ACTIVE_MENTORS.length
                            ).toFixed(1)}
                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ TABS + SEARCH ════════ */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Tabs */}
                <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 w-fit">
                    {(
                        [
                            { key: "active", label: "Active Mentors", count: ACTIVE_MENTORS.length },
                            {
                                key: "pending",
                                label: "Pending Applications",
                                count: PENDING_APPLICATIONS.length,
                            },
                        ] as const
                    ).map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${isActive
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                            >
                                {tab.label}
                                <span
                                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${isActive
                                        ? "bg-white/20 text-white"
                                        : "bg-slate-200 text-slate-500 dark:bg-white/[0.06] dark:text-slate-500"
                                        }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    />
                    <input
                        type="text"
                        placeholder="Search mentors or subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    />
                </div>
            </div>

            {/* ════════ DATA TABLE ════════ */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === "active" ? (
                        /* ──── Active Mentors Table ──── */
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Mentor
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Subject Expertise
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Rating
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Students Guided
                                    </th>
                                    <th className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMentors.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-16">
                                            <GraduationCap
                                                size={36}
                                                className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                                            />
                                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                                No mentors found.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMentors.map((mentor) => (
                                        <tr
                                            key={mentor.id}
                                            className="border-b last:border-b-0 border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            {/* Mentor Info */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {mentor.avatar}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {mentor.name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                            Since {mentor.joinedDate}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Subjects */}
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {mentor.subjects.map((s) => (
                                                        <span
                                                            key={s}
                                                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/25"
                                                        >
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Rating */}
                                            <td className="px-5 py-4">
                                                <RatingDisplay rating={mentor.rating} />
                                            </td>

                                            {/* Students */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Users size={13} className="text-slate-400 dark:text-slate-500" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {mentor.studentsGuided}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/30 transition-all whitespace-nowrap">
                                                        <XCircle size={12} /> Revoke Status
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        /* ──── Pending Applications Table ──── */
                        <table className="w-full min-w-[750px]">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Applicant
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Requested Subjects
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Experience
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Applied
                                    </th>
                                    <th className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApplications.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-16">
                                            <FileText
                                                size={36}
                                                className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                                            />
                                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                                No pending applications.
                                            </p>
                                            <p className="text-xs text-slate-400/60 dark:text-slate-500/60 mt-1">
                                                All caught up! No applications awaiting review.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApplications.map((app) => (
                                        <tr
                                            key={app.id}
                                            className="border-b last:border-b-0 border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            {/* Applicant */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {app.avatar}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {app.name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                                            {app.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Requested Subjects */}
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {app.requestedSubjects.map((s) => (
                                                        <span
                                                            key={s}
                                                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/25"
                                                        >
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Experience (truncated) */}
                                            <td className="px-5 py-4">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px] truncate">
                                                    {app.experience}
                                                </p>
                                            </td>

                                            {/* Application Date */}
                                            <td className="px-5 py-4">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {app.applicationDate}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button
                                                        onClick={() => setReviewModal(app)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all whitespace-nowrap"
                                                    >
                                                        <FileText size={12} /> Review
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                    {activeTab === "active"
                        ? `${filteredMentors.length} active mentors`
                        : `${filteredApplications.length} pending applications`}
                </span>
                <span>StudyBuddy Admin · Mentor Panel</span>
            </div>

            {/* ════════ APPLICATION REVIEW MODAL ════════ */}
            {reviewModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setReviewModal(null)}
                >
                    <div
                        className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {reviewModal.avatar}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Application from {reviewModal.name}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                        {reviewModal.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setReviewModal(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                            {/* Applicant Details */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400">
                                        <GraduationCap size={14} />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Applicant Details
                                    </h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 border border-slate-200 dark:border-white/[0.06]">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                                            Requested Subjects
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {reviewModal.requestedSubjects.map((s) => (
                                                <span
                                                    key={s}
                                                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/25"
                                                >
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 border border-slate-200 dark:border-white/[0.06]">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                                            Applied
                                        </label>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Clock size={13} className="text-slate-400" />
                                            {reviewModal.applicationDate}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Experience */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                                    Professional Experience
                                </label>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3 border border-slate-200 dark:border-white/[0.06]">
                                    {reviewModal.experience}
                                </p>
                            </div>

                            {/* Motivation */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                                        <Award size={14} />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Why I Want to Be a Mentor
                                    </h4>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-emerald-50/50 dark:bg-emerald-500/[0.04] rounded-xl p-3 border border-emerald-100 dark:border-emerald-500/10">
                                    {reviewModal.motivation}
                                </p>
                            </div>

                            {/* Credentials */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                                        <FileText size={14} />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Attached Credentials
                                    </h4>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 border border-slate-200 dark:border-white/[0.06]">
                                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
                                        <FileText size={18} className="text-red-500 dark:text-red-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {reviewModal.credentials}
                                        </p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                            PDF Document · 2.4 MB
                                        </p>
                                    </div>
                                    <button className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline whitespace-nowrap">
                                        View File
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer: Action Buttons */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 shrink-0">
                            <button
                                onClick={() => setReviewModal(null)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                                <XCircle size={14} /> Reject
                            </button>

                            <button
                                onClick={() => setReviewModal(null)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-700 transition-all"
                            >
                                <UserCheck size={14} /> Approve Mentor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

```

## File: `app/admin/moderation/appeals/page.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    Scale,
    CheckCircle,
    XCircle,
    MessageSquare,
    History,
    UserCheck,
    ShieldAlert,
    X,
    ChevronDown,
    Clock,
    FileText,
    AlertTriangle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type AppealStatus = "pending" | "approved" | "rejected";
type PenaltyType = "permanent_ban" | "strike2" | "strike1" | "suspension";

interface Appeal {
    id: string;
    userName: string;
    username: string;
    email: string;
    avatar: string;
    penalty: PenaltyType;
    originalReason: string;
    originalContent: string;
    appealMessage: string;
    dateSubmitted: string;
    status: AppealStatus;
}

// ─── Penalty Config ─────────────────────────────────────────────────────────────
const PENALTY_CONFIG: Record<
    PenaltyType,
    { label: string; badge: string }
> = {
    permanent_ban: {
        label: "Permanent Ban",
        badge:
            "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
    },
    strike2: {
        label: "Strike 2",
        badge:
            "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25",
    },
    strike1: {
        label: "Strike 1",
        badge:
            "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/25",
    },
    suspension: {
        label: "Temp Suspension",
        badge:
            "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
    },
};

const STATUS_CONFIG: Record<
    AppealStatus,
    { label: string; badge: string; Icon: React.ElementType }
> = {
    pending: {
        label: "Pending",
        badge:
            "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25",
        Icon: Clock,
    },
    approved: {
        label: "Approved",
        badge:
            "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25",
        Icon: CheckCircle,
    },
    rejected: {
        label: "Rejected",
        badge:
            "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
        Icon: XCircle,
    },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_APPEALS: Appeal[] = [
    {
        id: "a1",
        userName: "Jake Thompson",
        username: "@jake_cheater",
        email: "jake.t@email.com",
        avatar: "JT",
        penalty: "permanent_ban",
        originalReason:
            "Sharing copyrighted exam answers and encouraging academic dishonesty across multiple resource threads.",
        originalContent:
            "User uploaded 12 copyrighted exam papers from MIT OCW and Stanford's restricted materials portal. Also posted direct solutions to ongoing assignments in 3 active study groups.",
        appealMessage:
            "I sincerely apologize for my actions. I now understand that sharing copyrighted materials is harmful to the academic community. I was under immense pressure during finals and made a terrible decision. I have since deleted all my local copies and want to contribute positively to the platform. I promise to follow all community guidelines if given a second chance. I've been a member for 2 years and this was my first major offense until the escalation.",
        dateSubmitted: "2 hours ago",
        status: "pending",
    },
    {
        id: "a2",
        userName: "Elena Rodriguez",
        username: "@elena_spam",
        email: "elena.r@email.com",
        avatar: "ER",
        penalty: "strike2",
        originalReason:
            "Posting promotional spam links across multiple resource threads and study groups.",
        originalContent:
            "User posted identical promotional links to an external tutoring site in 8 different study group channels within a 2-hour window. Links redirected to a paid service unaffiliated with StudyBuddy.",
        appealMessage:
            "My account was compromised by someone who used it to post spam. I've since changed my password and enabled 2FA. I can provide proof that I was logged in from an IP address in a different country during the time the spam was posted. I've been a legitimate user for 6 months and have contributed 15 helpful resources. Please review my account activity before the incident to see my genuine contributions.",
        dateSubmitted: "5 hours ago",
        status: "pending",
    },
    {
        id: "a3",
        userName: "Marcus Cole",
        username: "@darkphoenix99",
        email: "marcus.c@email.com",
        avatar: "MC",
        penalty: "strike2",
        originalReason:
            "Repeated harassment in study group channels and targeted bullying of new members.",
        originalContent:
            "User made derogatory comments toward 3 new members in the Chemistry study group, including personal attacks on their academic ability. Also sent unsolicited DMs to 2 members with threatening language.",
        appealMessage:
            "I was going through a really rough patch personally and took it out on others in the community. That's not who I am. I've started seeing a counselor and I'm working on managing my anger. I want to apologize publicly to the members I hurt and would be willing to have restricted messaging privileges if that helps rebuild trust. I genuinely love this platform and the study communities here.",
        dateSubmitted: "1 day ago",
        status: "pending",
    },
    {
        id: "a4",
        userName: "David Park",
        username: "@david_park",
        email: "david.p@email.com",
        avatar: "DP",
        penalty: "suspension",
        originalReason: "Multiple off-topic posts and disruption of study sessions.",
        originalContent:
            "User repeatedly posted memes and off-topic content in active study sessions, despite 2 prior warnings from moderators. Disrupted a live calculus tutoring session by spamming the chat.",
        appealMessage:
            "I understand I was being disruptive. I didn't realize how seriously it affected other students' learning. I'll keep all my posts on-topic going forward and I won't interrupt live sessions again.",
        dateSubmitted: "3 days ago",
        status: "rejected",
    },
];

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function AppealsManagementPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");
    const [reviewModal, setReviewModal] = useState<Appeal | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const pendingAppeals = MOCK_APPEALS.filter((a) => a.status === "pending");
    const resolvedAppeals = MOCK_APPEALS.filter((a) => a.status !== "pending");

    const displayedAppeals =
        activeTab === "pending" ? pendingAppeals : resolvedAppeals;

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-indigo-100 border border-indigo-200 text-indigo-600 dark:bg-indigo-500/15 dark:border-indigo-500/25 dark:text-indigo-400">
                        <Scale size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Ban &amp; Strike Appeals
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Review appeals from users requesting to lift their penalties.
                        </p>
                    </div>
                </div>
            </div>

            {/* ════════ STAT CARDS ════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Pending Appeals */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-orange-50/60 border-orange-200 dark:bg-orange-500/[0.08] dark:border-orange-500/20">
                    <div className="text-orange-500 dark:text-orange-400 shrink-0">
                        <Scale size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            Pending Appeals
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {pendingAppeals.length}
                        </div>
                    </div>
                </div>

                {/* Approved / Lifted */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-emerald-50/60 border-emerald-200 dark:bg-emerald-500/[0.08] dark:border-emerald-500/20">
                    <div className="text-emerald-500 dark:text-emerald-400 shrink-0">
                        <UserCheck size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Approved / Lifted
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            7
                        </div>
                    </div>
                </div>

                {/* Rejected */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-red-50/60 border-red-200 dark:bg-red-500/[0.08] dark:border-red-500/20">
                    <div className="text-red-500 dark:text-red-400 shrink-0">
                        <XCircle size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                            Rejected
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {resolvedAppeals.filter((a) => a.status === "rejected").length}
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ TABS ════════ */}
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 w-fit">
                {(
                    [
                        { key: "pending", label: "Pending Review", count: pendingAppeals.length },
                        { key: "resolved", label: "Resolved Appeals", count: resolvedAppeals.length },
                    ] as const
                ).map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${isActive
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            {tab.label}
                            <span
                                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${isActive
                                        ? "bg-white/20 text-white"
                                        : "bg-slate-200 text-slate-500 dark:bg-white/[0.06] dark:text-slate-500"
                                    }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ════════ DATA TABLE ════════ */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px]">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    User
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Original Penalty
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Appeal Message
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Submitted
                                </th>
                                {activeTab === "resolved" && (
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Outcome
                                    </th>
                                )}
                                <th className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedAppeals.length === 0 ? (
                                <tr>
                                    <td colSpan={activeTab === "resolved" ? 6 : 5} className="text-center py-16">
                                        <Scale
                                            size={36}
                                            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                                        />
                                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                            No {activeTab === "pending" ? "pending" : "resolved"} appeals.
                                        </p>
                                        <p className="text-xs text-slate-400/60 dark:text-slate-500/60 mt-1">
                                            {activeTab === "pending"
                                                ? "All caught up! No appeals awaiting review."
                                                : "Resolved appeals will appear here."}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                displayedAppeals.map((appeal) => {
                                    const penaltyCfg = PENALTY_CONFIG[appeal.penalty];
                                    const statusCfg = STATUS_CONFIG[appeal.status];
                                    const isBan = appeal.penalty === "permanent_ban";

                                    return (
                                        <tr
                                            key={appeal.id}
                                            className={`border-b last:border-b-0 transition-colors ${isBan
                                                    ? "bg-red-50/50 dark:bg-red-950/15 border-l-4 border-l-red-500 border-b-slate-100 dark:border-b-white/[0.04]"
                                                    : "border-l-4 border-l-transparent border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                                }`}
                                        >
                                            {/* User Info */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {appeal.avatar}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {appeal.userName}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                                            {appeal.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Original Penalty */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${penaltyCfg.badge}`}
                                                >
                                                    {penaltyCfg.label}
                                                </span>
                                            </td>

                                            {/* Appeal Message (truncated) */}
                                            <td className="px-5 py-4">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] truncate">
                                                    {appeal.appealMessage}
                                                </p>
                                            </td>

                                            {/* Date Submitted */}
                                            <td className="px-5 py-4">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {appeal.dateSubmitted}
                                                </span>
                                            </td>

                                            {/* Outcome (resolved tab only) */}
                                            {activeTab === "resolved" && (
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${statusCfg.badge}`}
                                                    >
                                                        <statusCfg.Icon size={11} />
                                                        {statusCfg.label}
                                                    </span>
                                                </td>
                                            )}

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button
                                                        onClick={() => setReviewModal(appeal)}
                                                        title="Review Appeal"
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all whitespace-nowrap"
                                                    >
                                                        <MessageSquare size={12} /> Review
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                    Showing {displayedAppeals.length} of {MOCK_APPEALS.length} appeals
                </span>
                <span>StudyBuddy Admin · Appeals Panel</span>
            </div>

            {/* ════════ REVIEW MODAL ════════ */}
            {reviewModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setReviewModal(null)}
                >
                    <div
                        className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {reviewModal.avatar}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Appeal from {reviewModal.userName}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                        {reviewModal.username} · {reviewModal.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${PENALTY_CONFIG[reviewModal.penalty].badge}`}
                                >
                                    {PENALTY_CONFIG[reviewModal.penalty].label}
                                </span>
                                <button
                                    onClick={() => setReviewModal(null)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body: Two Columns */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/10">
                                {/* Left Column: Original Offense */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                                            <ShieldAlert size={14} />
                                        </div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            Original Offense
                                        </h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                                                Reason
                                            </label>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3 border border-slate-200 dark:border-white/[0.06]">
                                                {reviewModal.originalReason}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                                                Reported Content / Details
                                            </label>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3 border border-slate-200 dark:border-white/[0.06]">
                                                {reviewModal.originalContent}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: User's Appeal */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                                            <MessageSquare size={14} />
                                        </div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            User&apos;s Appeal
                                        </h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                                                Appeal Message
                                            </label>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-indigo-50/50 dark:bg-indigo-500/[0.04] rounded-xl p-3 border border-indigo-100 dark:border-indigo-500/10">
                                                {reviewModal.appealMessage}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                                                Submitted
                                            </label>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <Clock size={13} /> {reviewModal.dateSubmitted}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer: Action Buttons */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 shrink-0">
                            <button
                                onClick={() => setReviewModal(null)}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                                Close
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setReviewModal(null)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white shadow-md shadow-red-500/30 hover:bg-red-700 transition-all"
                                >
                                    <XCircle size={14} /> Reject Appeal
                                </button>
                                <button
                                    onClick={() => setReviewModal(null)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-700 transition-all"
                                >
                                    <CheckCircle size={14} /> Approve &amp; Lift Penalty
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

```

## File: `app/admin/moderation/reports/page.tsx`

```tsx
"use client";

import { useState, useMemo } from "react";
import {
  Flag,
  AlertOctagon,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Trash2,
  UserX,
  MessageSquare,
  FileText,
  User,
  Search,
  ChevronDown,
  SlidersHorizontal,
  X,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type Priority = "high" | "med" | "low";
type ContentType = "post" | "comment" | "resource" | "user";
type Status = "pending" | "resolved";

interface Report {
  id: string;
  priority: Priority;
  count: number;
  type: ContentType;
  snippet: string;
  reason: string;
  reporter: string;
  others: number;
  time: string;
  status: Status;
  username: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const REPORTS: Report[] = [
  {
    id: "r1",
    priority: "high",
    count: 12,
    type: "post",
    snippet: "Need help hacking into accounts and bypassing 2FA...",
    reason: "Harassment",
    reporter: "Alex K.",
    others: 11,
    time: "2 hours ago",
    status: "pending",
    username: "@darkphoenix99",
  },
  {
    id: "r2",
    priority: "high",
    count: 8,
    type: "resource",
    snippet: "Sharing copyrighted exam papers and premium course material...",
    reason: "Copyright",
    reporter: "Priya S.",
    others: 7,
    time: "4 hours ago",
    status: "pending",
    username: "@resource_king",
  },
  {
    id: "r3",
    priority: "med",
    count: 4,
    type: "post",
    snippet: "Political propaganda inside a chemistry study thread...",
    reason: "Off-Topic",
    reporter: "Sam R.",
    others: 3,
    time: "6 hours ago",
    status: "pending",
    username: "@politicalbot",
  },
  {
    id: "r4",
    priority: "med",
    count: 3,
    type: "comment",
    snippet: "Spam and self-promotional content for an external scam site...",
    reason: "Spam",
    reporter: "Jordan L.",
    others: 2,
    time: "1 day ago",
    status: "pending",
    username: "@spambot_42",
  },
  {
    id: "r5",
    priority: "low",
    count: 1,
    type: "user",
    snippet: "Display name contains explicit profanity and offensive slurs...",
    reason: "Profile Violation",
    reporter: "Taylor M.",
    others: 0,
    time: "3 days ago",
    status: "resolved",
    username: "@offensive_usr",
  },
  {
    id: "r6",
    priority: "low",
    count: 2,
    type: "comment",
    snippet: "Personal attacks on a mentor's teaching across sessions...",
    reason: "Harassment",
    reporter: "Jamie O.",
    others: 1,
    time: "2 days ago",
    status: "resolved",
    username: "@angry_student",
  },
];

// ─── Priority Config ────────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<
  Priority,
  {
    label: string;
    dot: string;
    badge: string;
    glow?: string;
  }
> = {
  high: {
    label: "High",
    dot: "bg-red-500",
    badge:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
    glow: "shadow-[0_0_5px_rgba(239,68,68,0.5)]",
  },
  med: {
    label: "Med",
    dot: "bg-amber-500",
    badge:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
  },
  low: {
    label: "Low",
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25",
  },
};

// ─── Content Type Config ────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  ContentType,
  { label: string; classes: string; Icon: React.ElementType }
> = {
  post: {
    label: "Post",
    classes:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
    Icon: MessageSquare,
  },
  comment: {
    label: "Comment",
    classes:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    Icon: MessageSquare,
  },
  resource: {
    label: "Resource",
    classes:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400",
    Icon: FileText,
  },
  user: {
    label: "User",
    classes:
      "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400",
    Icon: User,
  },
};

// ─── Sub-components ─────────────────────────────────────────────────────────────

function PriorityBadge({
  priority,
  count,
}: {
  priority: Priority;
  count: number;
}) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${cfg.badge}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot} ${cfg.glow || ""}`}
      />
      {cfg.label}
      <span className="opacity-60">· {count}</span>
    </span>
  );
}

function TypeChip({ type }: { type: ContentType }) {
  const { label, classes, Icon } = TYPE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap shrink-0 ${classes}`}
    >
      <Icon size={11} /> {label}
    </span>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function ReportsQueuePage() {
  const [activeTab, setActiveTab] = useState<Status>("pending");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [sort, setSort] = useState("priority");
  const [search, setSearch] = useState("");

  // ── Filter / Sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = REPORTS.filter((r) => r.status === activeTab);

    if (filterType !== "all") {
      const map: Record<string, ContentType> = {
        posts: "post",
        comments: "comment",
        resources: "resource",
        users: "user",
      };
      list = list.filter((r) => r.type === map[filterType]);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.snippet.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.reporter.toLowerCase().includes(q) ||
          r.username.toLowerCase().includes(q)
      );
    }

    if (sort === "priority") {
      const w = (p: Priority) => (p === "high" ? 3 : p === "med" ? 2 : 1);
      list = [...list].sort(
        (a, b) => w(b.priority) - w(a.priority) || b.count - a.count
      );
    }

    return list;
  }, [activeTab, filterType, sort, search]);

  const pendingCount = REPORTS.filter((r) => r.status === "pending").length;
  const allSelected =
    filtered.length > 0 && selectedReports.length === filtered.length;
  const toggleAll = () =>
    allSelected
      ? setSelectedReports([])
      : setSelectedReports(filtered.map((r) => r.id));
  const toggleOne = (id: string) =>
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="space-y-6">
      {/* ════════ HEADER ════════ */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-purple-100 border border-purple-200 text-purple-600 dark:bg-purple-500/15 dark:border-purple-500/25 dark:text-purple-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground dark:text-white tracking-tight">
              Reports Queue
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Triage, review, and resolve user-submitted reports.
            </p>
          </div>
        </div>
      </div>

      {/* ════════ STAT CARDS ════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* High Priority Pending */}
        <div className="flex items-center gap-4 rounded-2xl border p-4 bg-red-50/60 border-red-200 dark:bg-red-500/[0.08] dark:border-red-500/20">
          <div className="text-red-500 dark:text-red-400 shrink-0">
            <AlertOctagon size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              High Priority Pending
            </div>
            <div className="text-2xl font-bold text-foreground dark:text-white mt-0.5">
              5
            </div>
          </div>
        </div>

        {/* Total Pending */}
        <div className="flex items-center gap-4 rounded-2xl border p-4 bg-orange-50/60 border-orange-200 dark:bg-orange-500/[0.08] dark:border-orange-500/20">
          <div className="text-orange-500 dark:text-orange-400 shrink-0">
            <Flag size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Total Pending
            </div>
            <div className="text-2xl font-bold text-foreground dark:text-white mt-0.5">
              24
            </div>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="flex items-center gap-4 rounded-2xl border p-4 bg-emerald-50/60 border-emerald-200 dark:bg-emerald-500/[0.08] dark:border-emerald-500/20">
          <div className="text-emerald-500 dark:text-emerald-400 shrink-0">
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Resolved Today
            </div>
            <div className="text-2xl font-bold text-foreground dark:text-white mt-0.5">
              18
            </div>
          </div>
        </div>
      </div>

      {/* ════════ CONTROLS & FILTERS ════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Tabs + Bulk */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab group */}
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-border dark:border-white/10">
            {(["pending", "resolved"] as Status[]).map((t) => {
              const active = activeTab === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    setActiveTab(t);
                    setSelectedReports([]);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                      : "text-muted-foreground hover:text-foreground dark:hover:text-white"
                  }`}
                >
                  {t === "pending" ? "Pending Action" : "Resolved"}
                  {t === "pending" && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-500 dark:bg-white/[0.06] dark:text-slate-500"
                      }`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bulk actions */}
          {selectedReports.length > 0 && (
            <>
              <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-700 transition-colors">
                <CheckCircle size={14} /> Bulk Resolve ({selectedReports.length})
              </button>
              <button
                onClick={() => setSelectedReports([])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground border border-border dark:border-white/10 hover:text-foreground dark:hover:text-white transition-colors"
              >
                <X size={13} /> Clear
              </button>
            </>
          )}
        </div>

        {/* Right: Search + Filters */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-48 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
            />
          </div>

          {/* Filter by Type */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none pr-8 pl-3 py-2 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            >
              <option value="all">All Types</option>
              <option value="posts">Posts</option>
              <option value="comments">Comments</option>
              <option value="resources">Resources</option>
              <option value="users">Users</option>
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>

          {/* Sort by */}
          <div className="relative">
            <SlidersHorizontal
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            >
              <option value="priority">Priority: High → Low</option>
              <option value="newest">Newest First</option>
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* ════════ TABLE ════════ */}
      <div className="rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Table Header */}
            <div className="grid grid-cols-[36px_120px_1fr_120px_150px_80px_auto] gap-3 items-center px-5 py-3 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
              <div>
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 cursor-pointer accent-purple-600"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </div>
              {["PRIORITY", "CONTENT", "REASON", "REPORTER", "TIME", "ACTIONS"].map(
                (h, i) => (
                  <div
                    key={h}
                    className={`text-[10px] font-bold uppercase tracking-wider text-muted-foreground ${
                      i === 5 ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </div>
                )
              )}
            </div>

            {/* Table Rows */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckCircle
                  size={36}
                  className="mb-3 text-slate-300 dark:text-slate-600"
                />
                <p className="text-sm font-medium">No reports found.</p>
              </div>
            ) : (
              filtered.map((r) => {
                const isDanger = r.count > 5;
                const isSel = selectedReports.includes(r.id);

                return (
                  <div
                    key={r.id}
                    className={`group grid grid-cols-[36px_120px_1fr_120px_150px_80px_auto] gap-3 items-center px-5 py-3.5 border-b last:border-b-0 transition-colors ${
                      isDanger
                        ? "bg-red-50/50 dark:bg-red-950/20 border-l-4 border-l-red-500 border-b-slate-100 dark:border-b-white/[0.04]"
                        : isSel
                          ? "bg-purple-50/50 dark:bg-purple-950/10 border-l-4 border-l-purple-500 border-b-slate-100 dark:border-b-white/[0.04]"
                          : "border-l-4 border-l-transparent border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Checkbox */}
                    <div>
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 cursor-pointer accent-purple-600"
                        checked={isSel}
                        onChange={() => toggleOne(r.id)}
                        aria-label="Select report"
                      />
                    </div>

                    {/* Priority */}
                    <div>
                      <PriorityBadge priority={r.priority} count={r.count} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 mb-1">
                        <TypeChip type={r.type} />
                        <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[100px]">
                          {r.username}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed truncate m-0">
                        {r.snippet}
                      </p>
                    </div>

                    {/* Reason */}
                    <div>
                      <span className="inline-block px-2.5 py-1 rounded-lg whitespace-nowrap text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/[0.06] dark:text-slate-400 dark:border-white/10">
                        {r.reason}
                      </span>
                    </div>

                    {/* Reporter */}
                    <div>
                      <div className="text-sm font-semibold text-foreground dark:text-white truncate">
                        {r.reporter}
                      </div>
                      {r.others > 0 && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          +{r.others} others
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {r.time}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 justify-end">
                      {/* Dismiss */}
                      <button
                        title="Dismiss report"
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 border border-transparent hover:border-green-200 dark:hover:border-green-500/20 transition-all whitespace-nowrap"
                      >
                        <CheckCircle size={12} /> Dismiss
                      </button>

                      {/* Warn User */}
                      <button
                        title="Warn user"
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 border border-transparent hover:border-orange-200 dark:hover:border-orange-500/20 transition-all whitespace-nowrap"
                      >
                        <AlertTriangle size={12} /> Warn
                      </button>

                      {/* Remove Content */}
                      <button
                        title="Remove content"
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all whitespace-nowrap"
                      >
                        <Trash2 size={12} /> Remove
                      </button>

                      {/* Ban User */}
                      <button
                        title="Ban user"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-600 text-white shadow-md shadow-red-500/30 hover:bg-red-700 transition-all whitespace-nowrap"
                      >
                        <UserX size={12} /> Ban
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ════════ FOOTER ════════ */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {filtered.length} of{" "}
          {REPORTS.filter((r) => r.status === activeTab).length} reports
        </span>
        <span>StudyBuddy Admin · Last synced just now</span>
      </div>
    </div>
  );
}
```

## File: `app/admin/moderation/settings/page.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    ShieldCheck,
    AlertOctagon,
    Type,
    Bot,
    Save,
    Zap,
    Filter,
    Shield,
} from "lucide-react";

// ─── Custom Toggle Component ────────────────────────────────────────────────────
function Toggle({
    enabled,
    onToggle,
}: {
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1a0f26] ${enabled
                    ? "bg-purple-600"
                    : "bg-slate-200 dark:bg-white/10"
                }`}
            aria-pressed={enabled}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0"
                    }`}
            />
        </button>
    );
}

// ─── Settings Card Wrapper ──────────────────────────────────────────────────────
function SettingsCard({
    icon: Icon,
    iconColor,
    title,
    description,
    children,
}: {
    icon: React.ElementType;
    iconColor: string;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-white/[0.04]">
                <div
                    className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${iconColor}`}
                >
                    <Icon size={17} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {title}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {description}
                    </p>
                </div>
            </div>
            {/* Card Body */}
            <div className="px-6 py-5 space-y-5">{children}</div>
        </div>
    );
}

// ─── Toggle Row ─────────────────────────────────────────────────────────────────
function ToggleRow({
    label,
    description,
    enabled,
    onToggle,
    tag,
}: {
    label: string;
    description?: string;
    enabled: boolean;
    onToggle: () => void;
    tag?: { text: string; color: string };
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-1">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {label}
                    </p>
                    {tag && (
                        <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${tag.color}`}
                        >
                            {tag.text}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            <Toggle enabled={enabled} onToggle={onToggle} />
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function AutoModSettingsPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Strike Automation
    const [autoBanAfter3, setAutoBanAfter3] = useState(true);
    const [strikeExpiry, setStrikeExpiry] = useState("30");

    // AI Content Scanner
    const [flagLowConfidence, setFlagLowConfidence] = useState(true);
    const [haltBlacklisted, setHaltBlacklisted] = useState(false);

    // Keyword & Spam Filter
    const [keywords, setKeywords] = useState(
        "hack, cheat, promo, buy-followers, free-coins, exploit, crack, keygen"
    );
    const [spamSensitivity, setSpamSensitivity] = useState(70);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    const sensitivityLabel =
        spamSensitivity >= 80
            ? "Very High"
            : spamSensitivity >= 60
                ? "High"
                : spamSensitivity >= 40
                    ? "Medium"
                    : spamSensitivity >= 20
                        ? "Low"
                        : "Very Low";

    const sensitivityColor =
        spamSensitivity >= 80
            ? "text-red-500 dark:text-red-400"
            : spamSensitivity >= 60
                ? "text-orange-500 dark:text-orange-400"
                : spamSensitivity >= 40
                    ? "text-yellow-500 dark:text-yellow-400"
                    : "text-emerald-500 dark:text-emerald-400";

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-emerald-100 border border-emerald-200 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-500/25 dark:text-emerald-400">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Automated Moderation Settings
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Configure rules for auto-flagging and automated penalties.
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white shadow-md shadow-purple-500/30 hover:bg-purple-700 transition-all shrink-0">
                    <Save size={15} /> Save Changes
                </button>
            </div>

            {/* ════════ CARD 1: STRIKE AUTOMATION ════════ */}
            <SettingsCard
                icon={Zap}
                iconColor="bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
                title="Strike Automation"
                description="Configure automatic escalation and expiry rules for user strikes."
            >
                <ToggleRow
                    label="Automatically ban users after 3 strikes"
                    description="When enabled, users who accumulate 3 strikes will be permanently banned without manual intervention."
                    enabled={autoBanAfter3}
                    onToggle={() => setAutoBanAfter3(!autoBanAfter3)}
                    tag={{
                        text: "Recommended",
                        color:
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
                    }}
                />

                <div className="border-t border-slate-100 dark:border-white/[0.04] pt-5">
                    <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                        Strike expiry duration
                    </label>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                        How long a strike remains active on a user&apos;s record before it
                        automatically expires.
                    </p>
                    <div className="relative w-full sm:w-64">
                        <select
                            value={strikeExpiry}
                            onChange={(e) => setStrikeExpiry(e.target.value)}
                            className="w-full appearance-none pl-3 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                        >
                            <option value="30">30 Days</option>
                            <option value="60">60 Days</option>
                            <option value="90">90 Days</option>
                            <option value="never">Never (Permanent)</option>
                        </select>
                        <svg
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </div>
                </div>
            </SettingsCard>

            {/* ════════ CARD 2: AI CONTENT SCANNER ════════ */}
            <SettingsCard
                icon={Bot}
                iconColor="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
                title="AI Content Scanner"
                description="Control how AI-generated content is analyzed and moderated."
            >
                <ToggleRow
                    label="Auto-flag AI outputs with < 50% confidence score"
                    description="Generated content that scores below the confidence threshold will be flagged for manual review before publishing."
                    enabled={flagLowConfidence}
                    onToggle={() => setFlagLowConfidence(!flagLowConfidence)}
                    tag={{
                        text: "AI Guard",
                        color:
                            "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
                    }}
                />

                <div className="border-t border-slate-100 dark:border-white/[0.04] pt-5">
                    <ToggleRow
                        label="Halt generation for blacklisted keywords"
                        description="Immediately stop AI content generation if any restricted keyword from the blocklist is detected in the prompt or output."
                        enabled={haltBlacklisted}
                        onToggle={() => setHaltBlacklisted(!haltBlacklisted)}
                        tag={{
                            text: "Strict",
                            color:
                                "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
                        }}
                    />
                </div>
            </SettingsCard>

            {/* ════════ CARD 3: KEYWORD & SPAM FILTER ════════ */}
            <SettingsCard
                icon={Filter}
                iconColor="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
                title="Keyword & Spam Filter"
                description="Manage the global blocklist and spam detection sensitivity."
            >
                {/* Restricted Keywords */}
                <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                        Restricted Keywords
                    </label>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                        Comma-separated list of words that will be automatically flagged
                        across all posts, comments, and resources.
                    </p>
                    <textarea
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors resize-none font-mono leading-relaxed"
                        placeholder="Enter restricted keywords, separated by commas..."
                    />
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {keywords
                                .split(",")
                                .filter((k) => k.trim()).length}{" "}
                            keywords active
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            Applied globally
                        </span>
                    </div>
                </div>

                {/* Spam Detection Threshold */}
                <div className="border-t border-slate-100 dark:border-white/[0.04] pt-5">
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                            Spam Detection Threshold
                        </label>
                        <span
                            className={`text-xs font-bold ${sensitivityColor}`}
                        >
                            {sensitivityLabel} ({spamSensitivity}%)
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                        Higher sensitivity catches more spam but may produce false
                        positives. Lower sensitivity reduces noise but may miss subtle spam.
                    </p>

                    {/* Range Slider */}
                    <div className="space-y-3">
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={spamSensitivity}
                            onChange={(e) => setSpamSensitivity(Number(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-white/10 accent-purple-600"
                        />
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            <span>Low Sensitivity</span>
                            <span>High Sensitivity</span>
                        </div>
                    </div>
                </div>
            </SettingsCard>

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pb-4">
                <span>Changes are saved immediately when you click Save.</span>
                <span>StudyBuddy Admin · Auto-Mod Configuration</span>
            </div>
        </div>
    );
}

```

## File: `app/admin/moderation/strikes/page.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    AlertTriangle,
    ShieldAlert,
    UserX,
    History,
    Search,
    Filter,
    Shield,
    Ban,
    X,
    ChevronDown,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type PenaltyLevel = "warning" | "strike1" | "strike2" | "banned";

interface StrikeEvent {
    date: string;
    action: string;
    reason: string;
    moderator: string;
}

interface StrikeUser {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar: string;
    level: PenaltyLevel;
    reason: string;
    expiry: string;
    permanent: boolean;
    history: StrikeEvent[];
}

// ─── Penalty Level Config ───────────────────────────────────────────────────────
const PENALTY_CONFIG: Record<
    PenaltyLevel,
    { label: string; emoji: string; badge: string }
> = {
    warning: {
        label: "Warning",
        emoji: "🟡",
        badge:
            "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/25",
    },
    strike1: {
        label: "Strike 1",
        emoji: "🟠",
        badge:
            "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25",
    },
    strike2: {
        label: "Strike 2",
        emoji: "🔴",
        badge:
            "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
    },
    banned: {
        label: "Banned",
        emoji: "❌",
        badge:
            "bg-red-200 text-red-800 border-red-300 dark:bg-red-500/25 dark:text-red-300 dark:border-red-500/35",
    },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_USERS: StrikeUser[] = [
    {
        id: "u1",
        name: "Marcus Cole",
        username: "@darkphoenix99",
        email: "marcus.c@email.com",
        avatar: "MC",
        level: "strike2",
        reason: "Repeated harassment in study group channels and targeted bullying of new members.",
        expiry: "Expires in 3 days",
        permanent: false,
        history: [
            { date: "Feb 22, 2026", action: "Escalated to Strike 2", reason: "Continued harassment after first warning", moderator: "Admin Sarah" },
            { date: "Feb 18, 2026", action: "Strike 1 Issued", reason: "Harassment in study group chat", moderator: "Admin Alex" },
            { date: "Feb 10, 2026", action: "Warning Issued", reason: "Inappropriate language in comments", moderator: "Admin Priya" },
        ],
    },
    {
        id: "u2",
        name: "Elena Rodriguez",
        username: "@elena_spam",
        email: "elena.r@email.com",
        avatar: "ER",
        level: "strike1",
        reason: "Posting promotional spam links across multiple resource threads.",
        expiry: "Expires in 12 days",
        permanent: false,
        history: [
            { date: "Feb 20, 2026", action: "Strike 1 Issued", reason: "Spam content in resource threads", moderator: "Admin Alex" },
            { date: "Feb 14, 2026", action: "Warning Issued", reason: "Self-promotional comment flagged", moderator: "AutoMod" },
        ],
    },
    {
        id: "u3",
        name: "Jake Thompson",
        username: "@jake_cheater",
        email: "jake.t@email.com",
        avatar: "JT",
        level: "banned",
        reason: "Sharing copyrighted exam answers and encouraging academic dishonesty.",
        expiry: "Permanent",
        permanent: true,
        history: [
            { date: "Feb 21, 2026", action: "Permanently Banned", reason: "Sharing copyrighted exam papers", moderator: "Admin Sarah" },
            { date: "Feb 19, 2026", action: "Strike 2 Issued", reason: "Continued copyright violations", moderator: "Admin Alex" },
            { date: "Feb 15, 2026", action: "Strike 1 Issued", reason: "Sharing exam answers", moderator: "Admin Priya" },
            { date: "Feb 12, 2026", action: "Warning Issued", reason: "Suspicious resource uploads", moderator: "AutoMod" },
        ],
    },
    {
        id: "u4",
        name: "Aisha Patel",
        username: "@aisha_p",
        email: "aisha.p@email.com",
        avatar: "AP",
        level: "warning",
        reason: "Off-topic political discussions in science study groups.",
        expiry: "Expires in 25 days",
        permanent: false,
        history: [
            { date: "Feb 23, 2026", action: "Warning Issued", reason: "Off-topic posts in study group", moderator: "Admin Alex" },
        ],
    },
    {
        id: "u5",
        name: "Ryan Kim",
        username: "@ryan_toxic",
        email: "ryan.k@email.com",
        avatar: "RK",
        level: "strike2",
        reason: "Toxic behavior toward mentors and persistent derailing of live sessions.",
        expiry: "Expires in 1 day",
        permanent: false,
        history: [
            { date: "Feb 23, 2026", action: "Escalated to Strike 2", reason: "Disrupting live mentoring sessions", moderator: "Admin Sarah" },
            { date: "Feb 17, 2026", action: "Strike 1 Issued", reason: "Toxic comments toward a mentor", moderator: "Admin Alex" },
            { date: "Feb 11, 2026", action: "Warning Issued", reason: "Rude language in session chat", moderator: "AutoMod" },
        ],
    },
];

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function StrikesWarningsPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [historyModal, setHistoryModal] = useState<StrikeUser | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Filter users
    const filteredUsers = MOCK_USERS.filter((u) => {
        const matchesSearch =
            !search.trim() ||
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filterStatus === "all" || u.level === filterStatus;

        return matchesSearch && matchesFilter;
    });

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    const isDark = resolvedTheme === "dark";

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-orange-100 border border-orange-200 text-orange-600 dark:bg-orange-500/15 dark:border-orange-500/25 dark:text-orange-400">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Strikes &amp; Warnings
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Track user penalties, active strikes, and automated suspensions.
                        </p>
                    </div>
                </div>
            </div>

            {/* ════════ STAT CARDS ════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Active Warnings */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-yellow-50/60 border-yellow-200 dark:bg-yellow-500/[0.08] dark:border-yellow-500/20">
                    <div className="text-yellow-500 dark:text-yellow-400 shrink-0">
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                            Active Warnings
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            12
                        </div>
                    </div>
                </div>

                {/* Users on Strike 2 */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-orange-50/60 border-orange-200 dark:bg-orange-500/[0.08] dark:border-orange-500/20">
                    <div className="text-orange-500 dark:text-orange-400 shrink-0">
                        <ShieldAlert size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            Users on Strike 2
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            3
                        </div>
                    </div>
                </div>

                {/* Recent Suspensions */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-red-50/60 border-red-200 dark:bg-red-500/[0.08] dark:border-red-500/20">
                    <div className="text-red-500 dark:text-red-400 shrink-0">
                        <UserX size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                            Recent Suspensions
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            5
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ CONTROLS BAR ════════ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-auto">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    />
                    <input
                        type="text"
                        placeholder="Search by username or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-72 pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    />
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                    <Filter
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="appearance-none pl-9 pr-9 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    >
                        <option value="all">All Statuses</option>
                        <option value="warning">Warning</option>
                        <option value="strike1">Strike 1</option>
                        <option value="strike2">Strike 2</option>
                        <option value="banned">Suspended / Banned</option>
                    </select>
                    <ChevronDown
                        size={13}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                    />
                </div>
            </div>

            {/* ════════ DATA TABLE ════════ */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    User
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Status
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Last Reason
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Expiry
                                </th>
                                <th className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16">
                                        <Shield
                                            size={36}
                                            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                                        />
                                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                            No users match your filters.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const cfg = PENALTY_CONFIG[user.level];
                                    const isDanger =
                                        user.level === "strike2" || user.level === "banned";

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`border-b last:border-b-0 transition-colors ${isDanger
                                                    ? "bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500 border-b-slate-100 dark:border-b-white/[0.04]"
                                                    : "border-l-4 border-l-transparent border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                                }`}
                                        >
                                            {/* User Info */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {user.avatar}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                                            {user.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Penalty Level Badge */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${cfg.badge}`}
                                                >
                                                    {cfg.emoji} {cfg.label}
                                                </span>
                                            </td>

                                            {/* Reason */}
                                            <td className="px-5 py-4">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[260px] truncate">
                                                    {user.reason}
                                                </p>
                                            </td>

                                            {/* Expiry */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`text-xs font-medium whitespace-nowrap ${user.permanent
                                                            ? "text-red-500 dark:text-red-400"
                                                            : "text-slate-500 dark:text-slate-400"
                                                        }`}
                                                >
                                                    {user.expiry}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 justify-end">
                                                    {/* View History */}
                                                    <button
                                                        onClick={() => setHistoryModal(user)}
                                                        title="View History"
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all whitespace-nowrap"
                                                    >
                                                        <History size={12} /> History
                                                    </button>

                                                    {/* Revoke Strike */}
                                                    <button
                                                        title="Revoke Strike"
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 border border-transparent hover:border-green-200 dark:hover:border-green-500/20 transition-all whitespace-nowrap"
                                                    >
                                                        <Shield size={12} /> Revoke
                                                    </button>

                                                    {/* Escalate / Ban */}
                                                    <button
                                                        title="Escalate / Ban"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-600 text-white shadow-md shadow-red-500/30 hover:bg-red-700 transition-all whitespace-nowrap"
                                                    >
                                                        <Ban size={12} /> Ban
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                    Showing {filteredUsers.length} of {MOCK_USERS.length} users
                </span>
                <span>StudyBuddy Admin · Moderation Panel</span>
            </div>

            {/* ════════ STRIKE HISTORY MODAL ════════ */}
            {historyModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setHistoryModal(null)}
                >
                    <div
                        className="relative w-full max-w-lg mx-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {historyModal.avatar}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        {historyModal.name}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                        {historyModal.username} · {historyModal.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setHistoryModal(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Body: Timeline */}
                        <div className="px-6 py-5 max-h-[400px] overflow-y-auto">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                                Offense Timeline
                            </h4>
                            <div className="relative pl-6">
                                {/* Timeline line */}
                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200 dark:bg-white/10" />

                                {historyModal.history.map((event, i) => (
                                    <div key={i} className="relative mb-5 last:mb-0">
                                        {/* Timeline dot */}
                                        <div
                                            className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#1a0f26] ${event.action.includes("Ban")
                                                    ? "bg-red-500"
                                                    : event.action.includes("Strike 2")
                                                        ? "bg-red-400"
                                                        : event.action.includes("Strike 1")
                                                            ? "bg-orange-400"
                                                            : "bg-yellow-400"
                                                }`}
                                        />

                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {event.action}
                                                </span>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                    {event.date}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {event.reason}
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                                By {event.moderator}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-white/10">
                            <button
                                onClick={() => setHistoryModal(null)}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

```

## File: `app/admin/monetization/page.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    CreditCard,
    TrendingUp,
    Users,
    DollarSign,
    Edit,
    Check,
    Settings,
    ArrowRight,
    X,
    Sparkles,
    Crown,
    Zap,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type PlanTier = "free" | "pro" | "elite";
type TxStatus = "success" | "refunded" | "failed";

interface PricingPlan {
    tier: PlanTier;
    title: string;
    price: string;
    period: string;
    activeUsers: number;
    features: string[];
    highlight?: boolean;
}

interface Transaction {
    id: string;
    user: string;
    email: string;
    avatar: string;
    plan: string;
    amount: string;
    date: string;
    status: TxStatus;
}

// ─── Status Config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
    TxStatus,
    { label: string; emoji: string; badge: string }
> = {
    success: {
        label: "Success",
        emoji: "✅",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25",
    },
    refunded: {
        label: "Refunded",
        emoji: "↩️",
        badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
    },
    failed: {
        label: "Failed",
        emoji: "❌",
        badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
    },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const PLANS: PricingPlan[] = [
    {
        tier: "free",
        title: "Free",
        price: "$0",
        period: "forever",
        activeUsers: 8420,
        features: [
            "Access to public study groups",
            "Basic flashcard creation (up to 50)",
            "Community Q&A participation",
        ],
    },
    {
        tier: "pro",
        title: "Pro Member 🌟",
        price: "$9.99",
        period: "/month",
        activeUsers: 1340,
        features: [
            "Unlimited flashcards & quizzes",
            "AI-powered study recommendations",
            "Priority mentor matching",
        ],
    },
    {
        tier: "elite",
        title: "Elite 👑",
        price: "$24.99",
        period: "/month",
        activeUsers: 287,
        features: [
            "Everything in Pro",
            "1-on-1 live mentor sessions",
            "Custom learning paths & analytics",
        ],
        highlight: true,
    },
];

const TRANSACTIONS: Transaction[] = [
    {
        id: "TXN-4829",
        user: "Sophia Zhang",
        email: "sophia.z@uni.edu",
        avatar: "SZ",
        plan: "Elite",
        amount: "$24.99",
        date: "Feb 23, 2026",
        status: "success",
    },
    {
        id: "TXN-4828",
        user: "Alex Nguyen",
        email: "alex.n@gmail.com",
        avatar: "AN",
        plan: "Pro",
        amount: "$9.99",
        date: "Feb 23, 2026",
        status: "success",
    },
    {
        id: "TXN-4827",
        user: "Jordan Williams",
        email: "j.williams@mail.com",
        avatar: "JW",
        plan: "Pro",
        amount: "$9.99",
        date: "Feb 22, 2026",
        status: "refunded",
    },
    {
        id: "TXN-4826",
        user: "Priya Sharma",
        email: "priya.s@outlook.com",
        avatar: "PS",
        plan: "Elite",
        amount: "$24.99",
        date: "Feb 22, 2026",
        status: "success",
    },
    {
        id: "TXN-4825",
        user: "Liam O'Brien",
        email: "liam.ob@techmail.io",
        avatar: "LO",
        plan: "Pro",
        amount: "$9.99",
        date: "Feb 21, 2026",
        status: "failed",
    },
];

// ─── Plan Card Styles ───────────────────────────────────────────────────────────
const TIER_STYLES: Record<
    PlanTier,
    { border: string; icon: React.ElementType; iconColor: string; gradient: string }
> = {
    free: {
        border: "border-slate-200 dark:border-white/[0.06]",
        icon: Users,
        iconColor: "text-slate-500 dark:text-slate-400",
        gradient: "from-slate-400 to-slate-500",
    },
    pro: {
        border: "border-purple-300/60 dark:border-purple-500/30",
        icon: Sparkles,
        iconColor: "text-purple-500 dark:text-purple-400",
        gradient: "from-purple-500 to-indigo-500",
    },
    elite: {
        border: "border-amber-400/50 dark:border-amber-500/30",
        icon: Crown,
        iconColor: "text-amber-500 dark:text-amber-400",
        gradient: "from-amber-400 to-yellow-600",
    },
};

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function MonetizationPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [editModal, setEditModal] = useState<PricingPlan | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-emerald-100 border border-emerald-200 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-500/25 dark:text-emerald-400">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Monetization &amp; Plans
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage subscription tiers, track revenue, and view transactions.
                        </p>
                    </div>
                </div>
            </div>

            {/* ════════ STAT CARDS ════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* MRR */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-emerald-50/60 border-emerald-200 dark:bg-emerald-500/[0.08] dark:border-emerald-500/20">
                    <div className="text-emerald-500 dark:text-emerald-400 shrink-0">
                        <DollarSign size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Monthly Recurring Revenue
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            $12,450
                        </div>
                    </div>
                </div>

                {/* Active Pro/Elite Subs */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-sky-50/60 border-sky-200 dark:bg-sky-500/[0.08] dark:border-sky-500/20">
                    <div className="text-sky-500 dark:text-sky-400 shrink-0">
                        <Users size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                            Active Pro / Elite Subs
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            1,627
                        </div>
                    </div>
                </div>

                {/* Total Transactions */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-purple-50/60 border-purple-200 dark:bg-purple-500/[0.08] dark:border-purple-500/20">
                    <div className="text-purple-500 dark:text-purple-400 shrink-0">
                        <TrendingUp size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            Total Transactions
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            4,829
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ SUBSCRIPTION TIERS ════════ */}
            <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Settings size={14} className="text-slate-400 dark:text-slate-500" />
                    Subscription Tiers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PLANS.map((plan) => {
                        const style = TIER_STYLES[plan.tier];
                        const TierIcon = style.icon;

                        return (
                            <div
                                key={plan.tier}
                                className={`relative group rounded-2xl border bg-white dark:bg-white/[0.02] flex flex-col transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/5 ${plan.highlight
                                        ? `${style.border} shadow-md shadow-amber-500/10 dark:bg-amber-950/10`
                                        : style.border
                                    }`}
                            >
                                {/* Highlight banner */}
                                {plan.highlight && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-500/30">
                                        Most Popular
                                    </div>
                                )}

                                <div className="px-5 pt-6 pb-4">
                                    {/* Tier Icon & Title */}
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${style.gradient} text-white shrink-0`}
                                        >
                                            <TierIcon size={16} />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {plan.title}
                                        </h3>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-4">
                                        <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                            {plan.price}
                                        </span>
                                        <span className="text-sm text-slate-400 dark:text-slate-500 ml-1">
                                            {plan.period}
                                        </span>
                                    </div>

                                    {/* Active Users */}
                                    <div className="flex items-center gap-1.5 mb-4">
                                        <Users
                                            size={12}
                                            className="text-slate-400 dark:text-slate-500"
                                        />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            <strong className="text-slate-700 dark:text-slate-300">
                                                {plan.activeUsers.toLocaleString()}
                                            </strong>{" "}
                                            active users
                                        </span>
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-2">
                                        {plan.features.map((feature, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
                                            >
                                                <Check
                                                    size={13}
                                                    className={`mt-0.5 shrink-0 ${plan.tier === "elite"
                                                            ? "text-amber-500"
                                                            : plan.tier === "pro"
                                                                ? "text-purple-500"
                                                                : "text-emerald-500"
                                                        }`}
                                                />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Edit Button */}
                                <div className="mt-auto px-5 py-3 border-t border-slate-100 dark:border-white/[0.06]">
                                    <button
                                        onClick={() => setEditModal(plan)}
                                        className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${plan.highlight
                                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-500/20"
                                                : "bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                                            }`}
                                    >
                                        <Edit size={12} /> Edit Plan
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ════════ RECENT TRANSACTIONS ════════ */}
            <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <CreditCard size={14} className="text-slate-400 dark:text-slate-500" />
                    Recent Transactions
                </h2>
                <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Transaction ID
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        User
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Plan
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Amount
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Date
                                    </th>
                                    <th className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {TRANSACTIONS.map((tx) => {
                                    const status = STATUS_CONFIG[tx.status];

                                    return (
                                        <tr
                                            key={tx.id}
                                            className="border-b last:border-b-0 border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            {/* Transaction ID */}
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                                                    {tx.id}
                                                </span>
                                            </td>

                                            {/* User */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                                        {tx.avatar}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {tx.user}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                                            {tx.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Plan */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tx.plan === "Elite"
                                                            ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25"
                                                            : "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/25"
                                                        }`}
                                                >
                                                    {tx.plan}
                                                </span>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {tx.amount}
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-4">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {tx.date}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <div className="flex justify-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.badge}`}
                                                    >
                                                        {status.emoji} {status.label}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                    {PLANS.length} plans · {TRANSACTIONS.length} recent transactions
                </span>
                <span>StudyBuddy Admin · Monetization Panel</span>
            </div>

            {/* ════════ EDIT PLAN MODAL ════════ */}
            {editModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setEditModal(null)}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${TIER_STYLES[editModal.tier].gradient
                                        } text-white shrink-0`}
                                >
                                    <Edit size={15} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Edit Plan — {editModal.title}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                        {editModal.activeUsers.toLocaleString()} active subscribers
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditModal(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4">
                            {/* Plan Name */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    Plan Name
                                </label>
                                <input
                                    type="text"
                                    defaultValue={editModal.title}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    <span className="inline-flex items-center gap-1">
                                        <DollarSign size={13} className="text-emerald-500" />
                                        Monthly Price
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    defaultValue={editModal.price}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                                />
                            </div>

                            {/* Features */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    Top Features
                                </label>
                                <div className="space-y-2">
                                    {editModal.features.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600 w-4 shrink-0">
                                                {i + 1}.
                                            </span>
                                            <input
                                                type="text"
                                                defaultValue={f}
                                                className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Info Notice */}
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/[0.06] p-3 border border-amber-100 dark:border-amber-500/10">
                                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed flex items-start gap-2">
                                    <Zap size={13} className="shrink-0 mt-0.5" />
                                    Changes go live immediately. Existing subscribers keep their
                                    current price until their next billing cycle.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10">
                            <button
                                onClick={() => setEditModal(null)}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setEditModal(null)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/30 hover:bg-purple-700 transition-all"
                            >
                                <Check size={14} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

```

## File: `app/admin/notifications/page.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Megaphone,
  Send,
  Mail,
  Bell,
  Users,
  Trash2,
  X,
  CheckSquare,
  Square,
  ChevronDown,
  BarChart3,
  Clock,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type DeliveryMethod = "in-app" | "email";
type Audience = "all" | "free" | "pro-elite" | "mentors";

interface SentNotification {
  id: string;
  title: string;
  methods: DeliveryMethod[];
  audience: string;
  sentDate: string;
  openRate: number;
}

// ─── Delivery Badge Config ──────────────────────────────────────────────────────
const METHOD_CONFIG: Record<DeliveryMethod, { label: string; badge: string; Icon: React.ElementType }> = {
  "in-app": {
    label: "In-App",
    badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25",
    Icon: Bell,
  },
  email: {
    label: "Email",
    badge: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/25",
    Icon: Mail,
  },
};

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "free", label: "Free Users Only" },
  { value: "pro-elite", label: "Pro / Elite Users Only" },
  { value: "mentors", label: "Mentors Only" },
];

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const SENT_NOTIFICATIONS: SentNotification[] = [
  {
    id: "n1",
    title: "Welcome to StudyBuddy 2.0!",
    methods: ["in-app", "email"],
    audience: "All Users",
    sentDate: "Feb 20, 2026",
    openRate: 72,
  },
  {
    id: "n2",
    title: "Scheduled Maintenance Alert",
    methods: ["in-app"],
    audience: "All Users",
    sentDate: "Feb 18, 2026",
    openRate: 45,
  },
  {
    id: "n3",
    title: "New Mentor Matching Available",
    methods: ["email"],
    audience: "Pro / Elite Users",
    sentDate: "Feb 15, 2026",
    openRate: 61,
  },
  {
    id: "n4",
    title: "Weekly Challenge Reminder",
    methods: ["in-app", "email"],
    audience: "Free Users",
    sentDate: "Feb 12, 2026",
    openRate: 38,
  },
];

// ─── Checkbox Component ─────────────────────────────────────────────────────────
function Checkbox({
  checked,
  onChange,
  label,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all w-full text-left ${checked
          ? "bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/30 text-purple-700 dark:text-purple-400"
          : "bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.06]"
        }`}
    >
      {checked ? (
        <CheckSquare size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
      ) : (
        <Square size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
      )}
      <Icon size={14} className="shrink-0" />
      {label}
    </button>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function NotificationsManagerPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  // Compose form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [inApp, setInApp] = useState(true);
  const [emailBlast, setEmailBlast] = useState(false);
  const [audience, setAudience] = useState<Audience>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-[60vh]" />;
  }

  const openCompose = () => {
    setTitle("");
    setBody("");
    setInApp(true);
    setEmailBlast(false);
    setAudience("all");
    setComposeOpen(true);
  };

  const totalSent = SENT_NOTIFICATIONS.length;
  const avgOpenRate = Math.round(
    SENT_NOTIFICATIONS.reduce((sum, n) => sum + n.openRate, 0) / totalSent
  );

  return (
    <div className="space-y-6">
      {/* ════════ HEADER ════════ */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-rose-100 border border-rose-200 text-rose-600 dark:bg-rose-500/15 dark:border-rose-500/25 dark:text-rose-400">
            <Megaphone size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Global Notifications
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Send push notifications and emails to your users.
            </p>
          </div>
        </div>

        <button
          onClick={openCompose}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white shadow-md shadow-purple-500/30 hover:bg-purple-700 transition-all shrink-0"
        >
          <Send size={15} /> Compose New Message
        </button>
      </div>

      {/* ════════ STAT CARDS ════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Sent */}
        <div className="flex items-center gap-4 rounded-xl border p-4 bg-rose-50/60 border-rose-200 dark:bg-rose-500/[0.08] dark:border-rose-500/20">
          <div className="text-rose-500 dark:text-rose-400 shrink-0">
            <Send size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Total Sent
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {totalSent}
            </div>
          </div>
        </div>

        {/* Avg Open Rate */}
        <div className="flex items-center gap-4 rounded-xl border p-4 bg-emerald-50/60 border-emerald-200 dark:bg-emerald-500/[0.08] dark:border-emerald-500/20">
          <div className="text-emerald-500 dark:text-emerald-400 shrink-0">
            <BarChart3 size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Avg Open Rate
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {avgOpenRate}%
            </div>
          </div>
        </div>

        {/* Audience Reach */}
        <div className="flex items-center gap-4 rounded-xl border p-4 bg-sky-50/60 border-sky-200 dark:bg-sky-500/[0.08] dark:border-sky-500/20">
          <div className="text-sky-500 dark:text-sky-400 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Audience Reach
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              10,047
            </div>
          </div>
        </div>
      </div>

      {/* ════════ SENT NOTIFICATIONS TABLE ════════ */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Clock size={14} className="text-slate-400 dark:text-slate-500" />
          Notification History
        </h2>
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                    Campaign Title
                  </th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                    Delivery Method
                  </th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                    Audience
                  </th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                    Sent Date
                  </th>
                  <th className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                    Open Rate
                  </th>
                  <th className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {SENT_NOTIFICATIONS.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <Megaphone
                        size={36}
                        className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                      />
                      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                        No notifications sent yet.
                      </p>
                    </td>
                  </tr>
                ) : (
                  SENT_NOTIFICATIONS.map((notif) => (
                    <tr
                      key={notif.id}
                      className="border-b last:border-b-0 border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Title */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 shrink-0">
                            <Megaphone size={14} />
                          </div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {notif.title}
                          </span>
                        </div>
                      </td>

                      {/* Delivery Method */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {notif.methods.map((m) => {
                            const cfg = METHOD_CONFIG[m];
                            return (
                              <span
                                key={m}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badge}`}
                              >
                                <cfg.Icon size={10} /> {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Audience */}
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {notif.audience}
                        </span>
                      </td>

                      {/* Sent Date */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {notif.sentDate}
                        </span>
                      </td>

                      {/* Open Rate */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`text-sm font-bold ${notif.openRate >= 60
                                ? "text-emerald-600 dark:text-emerald-400"
                                : notif.openRate >= 40
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                          >
                            {notif.openRate}%
                          </span>
                          <div className="w-16 h-1 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${notif.openRate >= 60
                                  ? "bg-emerald-500"
                                  : notif.openRate >= 40
                                    ? "bg-amber-500"
                                    : "bg-slate-300 dark:bg-slate-600"
                                }`}
                              style={{ width: `${notif.openRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 justify-end">
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ════════ FOOTER ════════ */}
      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>
          {SENT_NOTIFICATIONS.length} campaigns sent · {avgOpenRate}% avg engagement
        </span>
        <span>StudyBuddy Admin · Notifications Panel</span>
      </div>

      {/* ════════ COMPOSE MODAL ════════ */}
      {composeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setComposeOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                  <Send size={15} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Compose New Message
                </h3>
              </div>
              <button
                onClick={() => setComposeOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Welcome to StudyBuddy 2.0!"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                  Message Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message here..."
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors resize-none"
                />
              </div>

              {/* Delivery Method */}
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                  Delivery Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Checkbox
                    checked={inApp}
                    onChange={setInApp}
                    label="In-App Notification"
                    icon={Bell}
                  />
                  <Checkbox
                    checked={emailBlast}
                    onChange={setEmailBlast}
                    label="Email Blast"
                    icon={Mail}
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                  Target Audience
                </label>
                <div className="relative">
                  <select
                    value={audience}
                    onChange={(e) =>
                      setAudience(e.target.value as Audience)
                    }
                    className="w-full appearance-none px-3 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors font-medium"
                  >
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 border border-slate-200 dark:border-white/[0.06]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Message Preview
                </p>
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 shrink-0 mt-0.5">
                    <Megaphone size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {title || "Untitled notification"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {body || "Message body will appear here..."}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {inApp && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400">
                          <Bell size={8} /> In-App
                        </span>
                      )}
                      {emailBlast && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
                          <Mail size={8} /> Email
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400 dark:text-slate-500">
                        →{" "}
                        {
                          AUDIENCE_OPTIONS.find(
                            (o) => o.value === audience
                          )?.label
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 shrink-0">
              <button
                onClick={() => setComposeOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setComposeOpen(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-700 transition-all"
              >
                <Send size={13} /> Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

```

## File: `app/admin/page.tsx`

```tsx
"use client";

import {
  Users,
  UserCheck,
  DollarSign,
  Radio,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Metric card data                                                   */
/* ------------------------------------------------------------------ */
interface MetricCard {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
  highlight?: boolean;
  highlightColor?: string;
}

const metrics: MetricCard[] = [
  {
    label: "Total Active Users",
    value: "1,245",
    change: "+12.5%",
    trend: "up",
    icon: Users,
  },
  {
    label: "Pending Mentors",
    value: "12",
    change: "+3 this week",
    trend: "up",
    icon: UserCheck,
    highlight: true,
    highlightColor: "orange",
  },
  {
    label: "Total Revenue",
    value: "$4,500",
    change: "+8.2%",
    trend: "up",
    icon: DollarSign,
  },
  {
    label: "Active Sessions",
    value: "84",
    change: "-2.1%",
    trend: "down",
    icon: Radio,
  },
];

/* ------------------------------------------------------------------ */
/* Admin Overview Page                                                */
/* ------------------------------------------------------------------ */
export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
          Admin Command Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform overview and key metrics
        </p>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {metrics.map((m) => {
          const isOrange = m.highlight && m.highlightColor === "orange";

          return (
            <div
              key={m.label}
              className={`
                relative rounded-2xl border p-5 transition-all duration-200
                ${
                  isOrange
                    ? "border-orange-300 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/[0.06]"
                    : "border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.03]"
                }
                hover:shadow-lg dark:hover:shadow-purple-500/5
              `}
            >
              {/* Icon */}
              <div
                className={`
                  inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4
                  ${
                    isOrange
                      ? "bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400"
                      : "bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400"
                  }
                `}
              >
                <m.icon size={20} />
              </div>

              {/* Value */}
              <p className="text-2xl font-bold text-foreground dark:text-white">
                {m.value}
              </p>

              {/* Label */}
              <p className="text-sm text-muted-foreground mt-0.5">{m.label}</p>

              {/* Trend */}
              <div className="flex items-center gap-1 mt-3">
                {m.trend === "up" ? (
                  <ArrowUpRight size={14} className="text-emerald-500" />
                ) : (
                  <ArrowDownRight size={14} className="text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    m.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {m.change}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  vs last month
                </span>
              </div>

              {/* Pending badge for highlighted card */}
              {isOrange && (
                <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-500 text-white">
                  Action Needed
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Charts Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Revenue Growth (large) */}
        <div className="lg:col-span-2 rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp
                size={18}
                className="text-purple-600 dark:text-purple-400"
              />
              <h2 className="text-lg font-semibold text-foreground dark:text-white">
                Revenue Growth
              </h2>
            </div>
            <select className="text-xs px-3 py-1.5 rounded-lg border border-border dark:border-white/10 bg-transparent text-muted-foreground dark:text-slate-400 focus:outline-none">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>This year</option>
            </select>
          </div>

          {/* Placeholder chart area */}
          <div className="flex items-center justify-center h-64 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/[0.06]">
            <div className="text-center">
              <TrendingUp
                size={40}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
              />
              <p className="text-sm font-medium text-muted-foreground">
                Revenue chart will render here
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Integrate with your preferred charting library
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity (smaller) */}
        <div className="rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity
              size={18}
              className="text-purple-600 dark:text-purple-400"
            />
            <h2 className="text-lg font-semibold text-foreground dark:text-white">
              Recent Activity
            </h2>
          </div>

          {/* Placeholder activity feed */}
          <div className="space-y-4">
            {[
              {
                text: "New mentor application received",
                time: "2 min ago",
                dot: "bg-orange-500",
              },
              {
                text: "User report flagged for review",
                time: "15 min ago",
                dot: "bg-red-500",
              },
              {
                text: "Pro subscription purchased",
                time: "1 hr ago",
                dot: "bg-emerald-500",
              },
              {
                text: "New study room created",
                time: "2 hrs ago",
                dot: "bg-blue-500",
              },
              {
                text: "Mentor approved: Jane D.",
                time: "3 hrs ago",
                dot: "bg-purple-500",
              },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-3 group"
              >
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${activity.dot}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground dark:text-slate-200 truncate">
                    {activity.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* View all link */}
          <button className="mt-5 w-full text-center text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
            View all activity →
          </button>
        </div>
      </div>
    </div>
  );
}

```

## File: `app/admin/settings/page.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    Settings,
    Shield,
    Database,
    Globe,
    Save,
    Server,
    Key,
    AlertTriangle,
    Eye,
    EyeOff,
    RefreshCw,
    Mail,
    UserPlus,
    Lock,
} from "lucide-react";

// ─── Toggle Component ───────────────────────────────────────────────────────────
function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 ${checked ? "bg-purple-600" : "bg-slate-300 dark:bg-white/10"
                }`}
        >
            <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
            />
        </button>
    );
}

// ─── Setting Row ────────────────────────────────────────────────────────────────
function SettingRow({
    label,
    description,
    children,
}: {
    label: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-8 py-4 border-b last:border-b-0 border-slate-100 dark:border-white/[0.04]">
            <div className="min-w-0 sm:max-w-[55%]">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {label}
                </p>
                {description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            <div className="sm:ml-auto shrink-0">{children}</div>
        </div>
    );
}

// ─── Section Card ───────────────────────────────────────────────────────────────
function SectionCard({
    icon: Icon,
    iconColor,
    title,
    children,
}: {
    icon: React.ElementType;
    iconColor: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor}`}
                >
                    <Icon size={14} />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {title}
                </h2>
            </div>
            <div className="px-5">{children}</div>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function PlatformSettingsPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // General
    const [platformName, setPlatformName] = useState("StudyBuddy");
    const [supportEmail, setSupportEmail] = useState("support@studybuddy.io");
    const [allowSignups, setAllowSignups] = useState(true);

    // Security & Maintenance
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceMsg, setMaintenanceMsg] = useState(
        "We're currently performing scheduled maintenance. We'll be back shortly!"
    );
    const [emailVerification, setEmailVerification] = useState(true);

    // API
    const [showOpenAI, setShowOpenAI] = useState(false);
    const [showStripe, setShowStripe] = useState(false);
    const [openAIKey, setOpenAIKey] = useState("sk-...........");
    const [stripeKey, setStripeKey] = useState("sk_live_4eR7y...........nL2x");

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-slate-100 border border-slate-200 text-slate-600 dark:bg-white/[0.06] dark:border-white/10 dark:text-slate-400">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Platform Settings
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Global configurations, API keys, and maintenance mode.
                        </p>
                    </div>
                </div>

                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white shadow-md shadow-purple-500/30 hover:bg-purple-700 transition-all shrink-0">
                    <Save size={15} /> Save All Changes
                </button>
            </div>

            {/* ════════ SECTION 1: GENERAL PREFERENCES ════════ */}
            <SectionCard
                icon={Globe}
                iconColor="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
                title="General Preferences"
            >
                {/* Platform Name */}
                <SettingRow
                    label="Platform Name"
                    description="The public-facing name of your application."
                >
                    <input
                        type="text"
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        className="w-full sm:w-64 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    />
                </SettingRow>

                {/* Platform Logo */}
                <SettingRow
                    label="Platform Logo"
                    description="Upload the logo that appears on your marketing site and in the app header."
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-semibold text-white shadow-sm shadow-purple-500/30 dark:shadow-purple-500/20">
                            SB
                        </div>
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
                                >
                                    Upload Logo
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.04] transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                PNG or SVG, at least 256×256px. This logo will be used across the website.
                            </p>
                        </div>
                    </div>
                </SettingRow>

                {/* Support Email */}
                <SettingRow
                    label="Support Email"
                    description="Users will see this email for help and contact requests."
                >
                    <div className="relative w-full sm:w-64">
                        <Mail
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        />
                        <input
                            type="email"
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                        />
                    </div>
                </SettingRow>

                {/* Allow New Signups */}
                <SettingRow
                    label="Allow New Signups"
                    description="When disabled, no new users can register on the platform."
                >
                    <div className="flex items-center gap-2">
                        <Toggle checked={allowSignups} onChange={setAllowSignups} />
                        <span
                            className={`text-[11px] font-semibold ${allowSignups
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-slate-400 dark:text-slate-500"
                                }`}
                        >
                            {allowSignups ? "Enabled" : "Disabled"}
                        </span>
                    </div>
                </SettingRow>
            </SectionCard>

            {/* ════════ SECTION 2: SECURITY & MAINTENANCE ════════ */}
            <SectionCard
                icon={Shield}
                iconColor="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
                title="Security & Maintenance"
            >
                {/* Maintenance Mode */}
                <div className="py-4 border-b border-slate-100 dark:border-white/[0.04]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-8">
                        <div className="min-w-0 sm:max-w-[55%]">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                Maintenance Mode
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                                Puts the app offline for all users. Only admins can access the
                                dashboard.
                            </p>
                        </div>
                        <div className="sm:ml-auto shrink-0 flex items-center gap-2">
                            <Toggle
                                checked={maintenanceMode}
                                onChange={setMaintenanceMode}
                            />
                            <span
                                className={`text-[11px] font-semibold ${maintenanceMode
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-slate-400 dark:text-slate-500"
                                    }`}
                            >
                                {maintenanceMode ? "Active" : "Off"}
                            </span>
                        </div>
                    </div>

                    {/* Conditional Maintenance Message */}
                    {maintenanceMode && (
                        <div className="mt-3 space-y-2">
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/[0.06] p-3 border border-amber-100 dark:border-amber-500/10">
                                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed flex items-start gap-2">
                                    <AlertTriangle
                                        size={13}
                                        className="shrink-0 mt-0.5"
                                    />
                                    Your application is currently in maintenance mode. Users will
                                    see the message below instead of the app.
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                                    Maintenance Message
                                </label>
                                <textarea
                                    value={maintenanceMsg}
                                    onChange={(e) =>
                                        setMaintenanceMsg(e.target.value)
                                    }
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 dark:focus:border-amber-400 transition-colors resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Email Verification */}
                <SettingRow
                    label="Require Email Verification"
                    description="New users must verify their email before accessing the platform."
                >
                    <div className="flex items-center gap-2">
                        <Toggle
                            checked={emailVerification}
                            onChange={setEmailVerification}
                        />
                        <span
                            className={`text-[11px] font-semibold ${emailVerification
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-slate-400 dark:text-slate-500"
                                }`}
                        >
                            {emailVerification ? "Required" : "Optional"}
                        </span>
                    </div>
                </SettingRow>
            </SectionCard>

            {/* ════════ SECTION 3: API & INTEGRATIONS ════════ */}
            <SectionCard
                icon={Key}
                iconColor="bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400"
                title="API & Integrations"
            >
                {/* OpenAI Key */}
                <SettingRow
                    label="OpenAI API Key"
                    description="Used for AI-powered study recommendations and content generation."
                >
                    <div className="relative w-full sm:w-72">
                        <Lock
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        />
                        <input
                            type={showOpenAI ? "text" : "password"}
                            value={openAIKey}
                            onChange={(e) => setOpenAIKey(e.target.value)}
                            className="w-full pl-9 pr-10 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowOpenAI((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            {showOpenAI ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </SettingRow>

                {/* Stripe Key */}
                <SettingRow
                    label="Stripe Secret Key"
                    description="Payment processing for Pro and Elite subscriptions."
                >
                    <div className="relative w-full sm:w-72">
                        <Lock
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        />
                        <input
                            type={showStripe ? "text" : "password"}
                            value={stripeKey}
                            onChange={(e) => setStripeKey(e.target.value)}
                            className="w-full pl-9 pr-10 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowStripe((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            {showStripe ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </SettingRow>

                {/* Rotate Keys */}
                <div className="py-4">
                    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                        <RefreshCw size={14} /> Rotate Keys
                    </button>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                        Invalidate existing API keys and generate new ones. This will
                        disrupt active integrations.
                    </p>
                </div>
            </SectionCard>

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>Last updated: Feb 24, 2026 · 5:58 AM</span>
                <span>StudyBuddy Admin · Platform Settings</span>
            </div>
        </div>
    );
}

```

## File: `app/admin/users/page.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Users,
  Search,
  Filter,
  ShieldBan,
  Mail,
  Key,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  MoreVertical,
} from "lucide-react";

// 👇 1. TypeScript ko bataya ke User object kaisa dikhta hai
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: string;
  joined: string;
  lastLogin: string;
}

// 👇 2. Mock users ko bataya ke yeh "User" type ke objects hain
const MOCK_USERS: User[] = [
  {
    id: "u1",
    name: "Alex Kim",
    email: "alex.kim@email.com",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    role: "elite",
    status: "active",
    joined: "2025-11-12",
    lastLogin: "2026-02-24 09:12",
  },
  {
    id: "u2",
    name: "Priya Singh",
    email: "priya.singh@email.com",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    role: "free",
    status: "active",
    joined: "2025-12-01",
    lastLogin: "2026-02-24 08:55",
  },
  {
    id: "u3",
    name: "Sam Rodriguez",
    email: "sam.rod@email.com",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    role: "pro",
    status: "suspended",
    joined: "2026-01-10",
    lastLogin: "2026-02-23 21:10",
  },
  {
    id: "u4",
    name: "Taylor Morgan",
    email: "taylor.morgan@email.com",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    role: "free",
    status: "active",
    joined: "2025-10-22",
    lastLogin: "2026-02-24 07:30",
  },
  {
    id: "u5",
    name: "Jordan Lee",
    email: "jordan.lee@email.com",
    avatar: "https://randomuser.me/api/portraits/men/23.jpg",
    role: "elite",
    status: "active",
    joined: "2026-02-01",
    lastLogin: "2026-02-24 10:01",
  },
];

export default function UserManagementPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // 👇 3. Yahan useState ko bataya ke isme User aaye ga ya phir null
  const [modalUser, setModalUser] = useState<User | null>(null);
  const [modalAction, setModalAction] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="min-h-screen" />;

  const filtered = MOCK_USERS.filter(u => {
    if (search && !(u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    return true;
  });

  const totalUsers = MOCK_USERS.length;
  const activeToday = MOCK_USERS.filter(u => u.status === "active").length;
  const suspended = MOCK_USERS.filter(u => u.status === "suspended").length;

  // 👇 4. Function ke parameters mein types daal diye
  const openModal = (user: User, action: string) => {
    setModalUser(user);
    setModalAction(action);
    setSuspendReason("");
  };
  
  const closeModal = () => {
    setModalUser(null);
    setModalAction("");
    setSuspendReason("");
  };

  return (
    <div className="p-6 bg-white dark:bg-[#0f0a16] min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-500" /> User Management
        </h1>
        <p className="text-sm text-muted-foreground">Manage StudyBuddy student accounts, permissions, and security.</p>
      </header>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-md flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20">
          <Users className="w-6 h-6 text-blue-500" />
          <div>
            <div className="text-xs text-blue-500">Total Users</div>
            <div className="font-bold text-lg">{totalUsers}</div>
          </div>
        </div>
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-md flex items-center gap-3 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <div className="text-xs text-green-500">Active Today</div>
            <div className="font-bold text-lg">{activeToday}</div>
          </div>
        </div>
        <div className="p-4 border border-slate-200 dark:border-white/10 rounded-md flex items-center gap-3 bg-red-50 dark:bg-red-950/20">
          <ShieldBan className="w-6 h-6 text-red-500" />
          <div>
            <div className="text-xs text-red-500">Suspended</div>
            <div className="font-bold text-lg">{suspended}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="pl-9 pr-3 py-2 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="pl-9 pr-3 py-2 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-transparent text-sm"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="pl-9 pr-3 py-2 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-transparent text-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
      </div>
      <div className="border border-slate-200 dark:border-white/10 rounded-md overflow-x-auto bg-white dark:bg-[#0f0a16]">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/[0.02]">
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-left text-slate-500 dark:text-slate-300">User</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-left text-slate-500 dark:text-slate-300">Plan / Role</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-left text-slate-500 dark:text-slate-300">Status</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-left text-slate-500 dark:text-slate-300">Joined</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-left text-slate-500 dark:text-slate-300">Last Login</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-right text-slate-500 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <XCircle className="mx-auto mb-2 w-8 h-8 opacity-60" />
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map(user => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition"
                >
                  <td className="px-4 py-3 flex items-center gap-3">
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1">
                        <Mail className="w-3 h-3 inline-block" /> {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.role === "elite" ? (
                      <span className="inline-block px-2 py-1 rounded bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800/50 shadow-sm">Elite 👑</span>
                    ) : user.role === "pro" ? (
                      <span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-xs font-semibold">Pro Member 🌟</span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 text-xs font-semibold">Free</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.status === "active" ? (
                      <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-300 text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Active</span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-1 w-fit"><ShieldBan className="w-3 h-3" /> Suspended</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">{user.joined}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">{user.lastLogin}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04]" onClick={() => openModal(user, "edit")}><Edit className="w-4 h-4 text-blue-500" /></button>
                      <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04]" onClick={() => openModal(user, "reset") }><Key className="w-4 h-4 text-green-500" /></button>
                      <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04]" onClick={() => openModal(user, "suspend") }><ShieldBan className="w-4 h-4 text-red-500" /></button>
                      <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04]" onClick={() => openModal(user, "delete") }><Trash2 className="w-4 h-4 text-slate-500" /></button>
                      <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04]" onClick={() => openModal(user, "more") }><MoreVertical className="w-4 h-4 text-slate-400" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {modalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f0a16] rounded-xl shadow-xl p-6 w-full max-w-md border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
              {modalAction === "edit" && <Edit className="w-5 h-5 text-blue-500" />}
              {modalAction === "reset" && <Key className="w-5 h-5 text-green-500" />}
              {modalAction === "suspend" && <ShieldBan className="w-5 h-5 text-red-500" />}
              {modalAction === "delete" && <Trash2 className="w-5 h-5 text-slate-500" />}
              {modalAction === "more" && <MoreVertical className="w-5 h-5 text-slate-400" />}
              <span className="font-semibold text-lg">{modalAction.charAt(0).toUpperCase() + modalAction.slice(1)} User</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <img src={modalUser.avatar} alt={modalUser.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10" />
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{modalUser.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1">
                  <Mail className="w-3 h-3 inline-block" /> {modalUser.email}
                </div>
              </div>
            </div>
            
            {modalAction === "suspend" && (
              <>
                <div className="mb-2 text-sm text-red-600 font-semibold">Are you sure you want to suspend {modalUser.name}?</div>
                <select
                  className="w-full mb-4 px-3 py-2 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-transparent text-sm"
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                >
                  <option value="">Select reason...</option>
                  <option value="spam">Spam</option>
                  <option value="policy">Policy Violation</option>
                </select>
                <button
                  className="w-full bg-red-600 text-white py-2 rounded-md font-semibold text-sm disabled:opacity-60"
                  disabled={!suspendReason}
                  onClick={closeModal}
                >
                  Confirm Suspension
                </button>
              </>
            )}
            
            {modalAction === "edit" && (
              <div className="mb-2 text-sm">Edit user details (mock only).</div>
            )}
            
            {modalAction === "reset" && (
              <>
                <div className="mb-2 text-sm">Reset password for this user (mock only).</div>
                <button className="w-full bg-green-600 hover:bg-green-700 transition-colors text-white py-2 rounded-md font-semibold text-sm mt-2" onClick={closeModal}>
                  Send Reset Link
                </button>
              </>
            )}
            
            {modalAction === "delete" && (
              <>
                <div className="mb-2 text-sm text-red-600 font-semibold">Are you sure you want to delete {modalUser.name}?</div>
                <button className="w-full bg-red-600 hover:bg-red-700 transition-colors text-white py-2 rounded-md font-semibold text-sm mt-2" onClick={closeModal}>
                  Confirm Delete
                </button>
              </>
            )}
            
            <button className="w-full mt-4 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 transition-colors text-slate-700 dark:text-white py-2 rounded-md font-semibold text-sm" onClick={closeModal}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

