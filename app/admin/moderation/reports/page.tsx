"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  FileText,
  Flag,
  MessageSquare,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  User,
  UserX,
  X,
} from "lucide-react";

type Priority = "high" | "med" | "low";
type ContentType = "post" | "comment" | "resource" | "user";
type Status = "pending" | "resolved";
type ModerationAction = "dismiss" | "warn" | "strike" | "ban";

interface GroupedReport {
  id: string;
  reportIds: string[];
  targetType: ContentType;
  targetId: string;
  priority: Priority;
  count: number;
  others: number;
  reason: string;
  contentSnippet: string;
  status: Status;
  reporter: { name: string; email: string };
  createdAt: string;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; badge: string; dot: string }> = {
  high: {
    label: "High",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
  },
  med: {
    label: "Med",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
  },
  low: {
    label: "Low",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25",
  },
};

const TYPE_CONFIG: Record<ContentType, { label: string; classes: string; Icon: React.ElementType }> = {
  post: { label: "Post", classes: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400", Icon: MessageSquare },
  comment: { label: "Comment", classes: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400", Icon: MessageSquare },
  resource: { label: "Resource", classes: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400", Icon: FileText },
  user: { label: "User", classes: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400", Icon: User },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PriorityBadge({ priority, count }: { priority: Priority; count: number }) {
  const cfg = PRIORITY_CONFIG[priority];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
      <span className="opacity-60">· {count}</span>
    </span>
  );
}

function TypeChip({ type }: { type: ContentType }) {
  const cfg = TYPE_CONFIG[type];

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${cfg.classes}`}>
      <cfg.Icon size={11} /> {cfg.label}
    </span>
  );
}

export default function ReportsQueuePage() {
  const [activeTab, setActiveTab] = useState<Status>("pending");
  const [reports, setReports] = useState<GroupedReport[]>([]);
  const [stats, setStats] = useState({ pendingCount: 0, highPriorityPending: 0, resolvedCount: 0 });
  const [filterType, setFilterType] = useState("all");
  const [sort, setSort] = useState("priority");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState<{ report: GroupedReport; action: ModerationAction } | null>(null);
  const [actionReason, setActionReason] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: activeTab });
    if (filterType !== "all") params.set("targetType", filterType);

    const response = await fetch(`/api/admin/moderation/reports?${params.toString()}`, { cache: "no-store" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      toast.error(data?.message || "Failed to load reports.");
      setLoading(false);
      return;
    }

    setReports(Array.isArray(data?.reports) ? data.reports : []);
    setStats({
      pendingCount: Number(data?.stats?.pendingCount || 0),
      highPriorityPending: Number(data?.stats?.highPriorityPending || 0),
      resolvedCount: Number(data?.stats?.resolvedCount || 0),
    });
    setLoading(false);
  }, [activeTab, filterType]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? reports.filter((report) =>
          [report.contentSnippet, report.reason, report.reporter.name, report.reporter.email, report.targetId]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : reports;

    if (sort !== "newest") return list;
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, search, sort]);

  async function resolveReport(report: GroupedReport, action: ModerationAction, reason?: string) {
    const response = await fetch("/api/admin/moderation/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportIds: report.reportIds, action, reason }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      toast.error(data?.message || "Failed to resolve report.");
      return;
    }

    toast.success(data?.message || "Report resolved.");
    setActionTarget(null);
    setActionReason("");
    void fetchReports();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-200 bg-[#7C3AED]/10 text-[#7C3AED] dark:border-purple-500/25">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Reports Queue</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Triage, review, and resolve user-submitted reports.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50/60 p-4 dark:border-red-500/20 dark:bg-red-500/[0.08]">
          <AlertOctagon className="text-red-500" size={22} />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">High Priority Pending</div>
            <div className="mt-0.5 text-2xl font-bold text-foreground">{stats.highPriorityPending}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-500/20 dark:bg-orange-500/[0.08]">
          <Flag className="text-orange-500" size={22} />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">Total Pending</div>
            <div className="mt-0.5 text-2xl font-bold text-foreground">{stats.pendingCount}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]">
          <CheckCircle className="text-emerald-500" size={22} />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Resolved</div>
            <div className="mt-0.5 text-2xl font-bold text-foreground">{stats.resolvedCount}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-border bg-slate-100 p-1 dark:bg-white/[0.04]">
          {(["pending", "resolved"] as Status[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                activeTab === tab ? "bg-[#7C3AED] text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "pending" ? "Pending Action" : "Resolved"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reports..."
              className="w-52 rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:bg-white/[0.04]"
            />
          </div>
          <div className="relative">
            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="appearance-none rounded-xl border border-border bg-white py-2 pl-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]/20 dark:bg-white/[0.04]"
            >
              <option value="all">All Types</option>
              <option value="post">Posts</option>
              <option value="comment">Comments</option>
              <option value="resource">Resources</option>
              <option value="user">Users</option>
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="relative">
            <SlidersHorizontal size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="appearance-none rounded-xl border border-border bg-white py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]/20 dark:bg-white/[0.04]"
            >
              <option value="priority">Priority</option>
              <option value="newest">Newest</option>
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-white/[0.02]">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[120px_1fr_120px_150px_90px_300px] items-center gap-3 border-b border-border bg-slate-50 px-5 py-3 dark:bg-white/[0.02]">
              {["Priority", "Content", "Reason", "Reporter", "Date", "Actions"].map((heading) => (
                <div key={heading} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {heading}
                </div>
              ))}
            </div>
            {loading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">Loading reports...</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckCircle size={36} className="mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium">No reports found.</p>
              </div>
            ) : (
              filtered.map((report) => (
                <div key={report.id} className="grid grid-cols-[120px_1fr_120px_150px_90px_300px] items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <PriorityBadge priority={report.priority} count={report.count} />
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <TypeChip type={report.targetType} />
                      <span className="truncate font-mono text-[11px] text-muted-foreground">{report.targetId}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{report.contentSnippet || "No snippet provided."}</p>
                  </div>
                  <span className="w-fit rounded-lg border border-border bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground dark:bg-white/[0.06]">
                    {report.reason}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{report.reporter.name}</p>
                    {report.others > 0 && <p className="text-[11px] text-muted-foreground">+{report.others} others</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(report.createdAt)}</span>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => void resolveReport(report, "dismiss")} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                      <CheckCircle size={12} /> Dismiss
                    </button>
                    <button onClick={() => setActionTarget({ report, action: "warn" })} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10">
                      <AlertTriangle size={12} /> Warn
                    </button>
                    <button onClick={() => setActionTarget({ report, action: "strike" })} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                      <Trash2 size={12} /> Strike
                    </button>
                    <button onClick={() => setActionTarget({ report, action: "ban" })} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-red-700">
                      <UserX size={12} /> Ban
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filtered.length} reports</span>
        <span>StudyBuddy Admin · Last synced live</span>
      </div>

      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-2xl dark:bg-[#1a0f26]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Confirm moderation action</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This will resolve the grouped report and issue a {actionTarget.action === "warn" ? "warning" : actionTarget.action}.
                </p>
              </div>
              <button onClick={() => setActionTarget(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10">
                <X size={16} />
              </button>
            </div>
            <textarea
              value={actionReason}
              onChange={(event) => setActionReason(event.target.value)}
              rows={4}
              placeholder="Reason shown to the user..."
              className="mt-4 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setActionTarget(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/10">
                Cancel
              </button>
              <button
                onClick={() => void resolveReport(actionTarget.report, actionTarget.action, actionReason || actionTarget.report.reason)}
                className="rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
