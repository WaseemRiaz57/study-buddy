"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  MessageSquare,
  Scale,
  ShieldAlert,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";

type AppealStatus = "pending" | "approved" | "rejected";

interface Appeal {
  id: string;
  message: string;
  status: AppealStatus;
  createdAt: string;
  user: {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  };
  log: {
    _id: string;
    actionType?: string;
    reason?: string;
    expiresAt?: string | null;
    createdAt?: string;
    isActive?: boolean;
  };
}

const STATUS_CONFIG: Record<AppealStatus, { label: string; badge: string; Icon: React.ElementType }> = {
  pending: { label: "Pending", badge: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25", Icon: Clock },
  approved: { label: "Approved", badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25", Icon: CheckCircle },
  rejected: { label: "Rejected", badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25", Icon: XCircle },
};

function initials(name?: string) {
  return (
    String(name || "User")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Date(value).toISOString().slice(0, 10);
}

export default function AppealsManagementPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");
  const [reviewModal, setReviewModal] = useState<Appeal | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppeals = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/moderation/appeals", { cache: "no-store" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      toast.error(data?.message || "Failed to load appeals.");
      setLoading(false);
      return;
    }

    setAppeals(Array.isArray(data?.appeals) ? data.appeals : []);
    setStats({
      pending: Number(data?.stats?.pending || 0),
      approved: Number(data?.stats?.approved || 0),
      rejected: Number(data?.stats?.rejected || 0),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchAppeals();
  }, [fetchAppeals]);

  const displayedAppeals = useMemo(
    () =>
      activeTab === "pending"
        ? appeals.filter((appeal) => appeal.status === "pending")
        : appeals.filter((appeal) => appeal.status !== "pending"),
    [activeTab, appeals]
  );

  async function updateAppeal(appeal: Appeal, action: "approve" | "reject") {
    const response = await fetch(`/api/admin/moderation/appeals/${appeal.id}/${action}`, {
      method: "PATCH",
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      toast.error(data?.message || "Failed to update appeal.");
      return;
    }

    toast.success(data?.message || "Appeal updated.");
    setReviewModal(null);
    void fetchAppeals();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-200 bg-[#7C3AED]/10 text-[#7C3AED] dark:border-purple-500/25">
            <Scale size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Ban &amp; Strike Appeals</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Review appeals from users requesting to lift penalties.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-500/20 dark:bg-orange-500/[0.08]">
          <Scale className="text-orange-500" size={22} />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">Pending Appeals</div>
            <div className="mt-0.5 text-2xl font-bold text-foreground">{stats.pending}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]">
          <UserCheck className="text-emerald-500" size={22} />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Approved / Lifted</div>
            <div className="mt-0.5 text-2xl font-bold text-foreground">{stats.approved}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-500/20 dark:bg-red-500/[0.08]">
          <XCircle className="text-red-500" size={22} />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Rejected</div>
            <div className="mt-0.5 text-2xl font-bold text-foreground">{stats.rejected}</div>
          </div>
        </div>
      </div>

      <div className="flex w-fit rounded-xl border border-border bg-slate-100 p-1 dark:bg-white/[0.04]">
        {[
          { key: "pending", label: "Pending Review", count: stats.pending },
          { key: "resolved", label: "Resolved Appeals", count: stats.approved + stats.rejected },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as "pending" | "resolved")}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              activeTab === tab.key ? "bg-[#7C3AED] text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-200 text-muted-foreground dark:bg-white/[0.06]"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-border bg-slate-50 dark:bg-white/[0.02]">
                {["User", "Original Penalty", "Appeal Message", "Submitted", activeTab === "resolved" ? "Outcome" : "Actions"].map((heading) => (
                  <th key={heading} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground last:text-right">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center text-sm text-muted-foreground">Loading appeals...</td></tr>
              ) : displayedAppeals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Scale size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-muted-foreground">No {activeTab === "pending" ? "pending" : "resolved"} appeals.</p>
                  </td>
                </tr>
              ) : (
                displayedAppeals.map((appeal) => {
                  const statusCfg = STATUS_CONFIG[appeal.status];
                  return (
                    <tr key={appeal.id} className="border-b border-border last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">
                            {initials(appeal.user?.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{appeal.user?.name || "Unknown user"}</p>
                            <p className="truncate font-mono text-[11px] text-muted-foreground">{appeal.user?.email || appeal.user?._id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-[11px] font-bold capitalize text-red-700 dark:border-red-500/25 dark:bg-red-500/15 dark:text-red-400">
                          {appeal.log?.actionType || "Penalty"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="max-w-[320px] truncate text-xs text-muted-foreground">{appeal.message}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(appeal.createdAt)}</td>
                      <td className="px-5 py-4 text-right">
                        {activeTab === "resolved" ? (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusCfg.badge}`}>
                            <statusCfg.Icon size={11} /> {statusCfg.label}
                          </span>
                        ) : (
                          <button onClick={() => setReviewModal(appeal)} className="inline-flex items-center gap-1 rounded-lg border border-purple-200 px-3 py-1.5 text-[11px] font-semibold text-[#7C3AED] hover:bg-[#7C3AED]/10 dark:border-purple-500/20">
                            <MessageSquare size={12} /> Review
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {displayedAppeals.length} appeals</span>
        <span>StudyBuddy Admin · Appeals Panel</span>
      </div>

      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-white shadow-2xl dark:bg-[#1a0f26]">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-bold text-white">
                  {initials(reviewModal.user?.name)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Appeal from {reviewModal.user?.name || "Unknown user"}</h3>
                  <p className="font-mono text-[11px] text-muted-foreground">{reviewModal.user?.email}</p>
                </div>
              </div>
              <button onClick={() => setReviewModal(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/[0.06]">
                <X size={16} />
              </button>
            </div>
            <div className="grid flex-1 grid-cols-1 overflow-y-auto divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldAlert className="text-red-500" size={16} />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Original Offense</h4>
                </div>
                <p className="rounded-xl border border-border bg-slate-50 p-3 text-sm leading-relaxed text-muted-foreground dark:bg-white/[0.03]">
                  {reviewModal.log?.reason || "No reason recorded."}
                </p>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="text-[#7C3AED]" size={16} />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">User Appeal</h4>
                </div>
                <p className="rounded-xl border border-purple-100 bg-[#7C3AED]/5 p-3 text-sm leading-relaxed text-muted-foreground dark:border-purple-500/10">
                  {reviewModal.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <button onClick={() => setReviewModal(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                Close
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => void updateAppeal(reviewModal, "reject")} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                  <XCircle size={14} /> Reject Appeal
                </button>
                <button onClick={() => void updateAppeal(reviewModal, "approve")} className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
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
