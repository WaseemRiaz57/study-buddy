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
