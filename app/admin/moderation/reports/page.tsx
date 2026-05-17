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
