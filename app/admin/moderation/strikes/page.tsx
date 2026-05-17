"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Ban,
  ChevronDown,
  History,
  Search,
  Shield,
  ShieldAlert,
  UserX,
  X,
} from "lucide-react";

type ActionType = "warning" | "strike" | "ban";

interface ModerationLog {
  id: string;
  actionType: ActionType;
  reason: string;
  expiresAt: string | null;
  createdAt: string;
  user: {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
    accountStatus?: string;
    activeStrikes?: number;
  };
}

const BADGE_CONFIG: Record<ActionType, string> = {
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/25",
  strike: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25",
  ban: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
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

function formatDate(value?: string | null) {
  if (!value) return "Permanent";
  return new Date(value).toISOString().slice(0, 10);
}

export default function StrikesWarningsPage() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [stats, setStats] = useState({ activeWarnings: 0, activeStrikes: 0, activeBans: 0 });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [historyModal, setHistoryModal] = useState<ModerationLog | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ModerationLog | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/moderation/logs", { cache: "no-store" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      toast.error(data?.message || "Failed to load moderation logs.");
      setLoading(false);
      return;
    }

    setLogs(Array.isArray(data?.logs) ? data.logs : []);
    setStats({
      activeWarnings: Number(data?.stats?.activeWarnings || 0),
      activeStrikes: Number(data?.stats?.activeStrikes || 0),
      activeBans: Number(data?.stats?.activeBans || 0),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        !q ||
        [log.user?.name, log.user?.email, log.reason]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesFilter = filterStatus === "all" || log.actionType === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [filterStatus, logs, search]);

  async function revokeLog(log: ModerationLog) {
    const response = await fetch(`/api/admin/moderation/logs/${log.id}/revoke`, {
      method: "PATCH",
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      toast.error(data?.message || "Failed to revoke penalty.");
      return;
    }

    toast.success(data?.message || "Penalty revoked.");
    setRevokeTarget(null);
    void fetchLogs();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-200 bg-orange-100 text-orange-600 dark:border-orange-500/25 dark:bg-orange-500/15 dark:text-orange-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Strikes &amp; Warnings</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Track user penalties, active strikes, and automated bans.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-yellow-200 bg-yellow-50/60 p-4 dark:border-yellow-500/20 dark:bg-yellow-500/[0.08]">
          <AlertTriangle className="text-yellow-500" size={22} />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">Active Warnings</div>
            <div className="mt-0.5 text-2xl font-bold text-foreground">{stats.activeWarnings}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-500/20 dark:bg-orange-500/[0.08]">
          <ShieldAlert className="text-orange-500" size={22} />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">Active Strikes</div>
            <div className="mt-0.5 text-2xl font-bold text-foreground">{stats.activeStrikes}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-500/20 dark:bg-red-500/[0.08]">
          <UserX className="text-red-500" size={22} />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Active Bans</div>
            <div className="mt-0.5 text-2xl font-bold text-foreground">{stats.activeBans}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or reason..."
            className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:bg-white/[0.04] sm:w-80"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="appearance-none rounded-xl border border-border bg-white py-2 pl-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]/20 dark:bg-white/[0.04]"
          >
            <option value="all">All Penalties</option>
            <option value="warning">Warnings</option>
            <option value="strike">Strikes</option>
            <option value="ban">Bans</option>
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-slate-50 dark:bg-white/[0.02]">
                {["User", "Penalty", "Reason", "Expiry", "Actions"].map((heading) => (
                  <th key={heading} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground last:text-right">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center text-sm text-muted-foreground">Loading moderation logs...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Shield size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-muted-foreground">No active penalties match your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">
                          {initials(log.user?.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{log.user?.name || "Unknown user"}</p>
                          <p className="truncate font-mono text-[11px] text-muted-foreground">{log.user?.email || log.user?._id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${BADGE_CONFIG[log.actionType]}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-[320px] truncate text-xs text-muted-foreground">{log.reason}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(log.expiresAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setHistoryModal(log)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/[0.06]">
                          <History size={12} /> Details
                        </button>
                        <button onClick={() => setRevokeTarget(log)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                          <Shield size={12} /> Revoke
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

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filteredLogs.length} active penalties</span>
        <span>StudyBuddy Admin · Moderation Panel</span>
      </div>

      {(historyModal || revokeTarget) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-5 shadow-2xl dark:bg-[#1a0f26]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {revokeTarget ? "Revoke penalty?" : "Penalty details"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {(revokeTarget || historyModal)?.reason}
                </p>
              </div>
              <button onClick={() => { setHistoryModal(null); setRevokeTarget(null); }} className="rounded-lg p-2 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10">
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-border bg-slate-50 p-3 text-xs text-muted-foreground dark:bg-white/[0.04]">
              <p>User: {(revokeTarget || historyModal)?.user?.name || "Unknown"}</p>
              <p>Email: {(revokeTarget || historyModal)?.user?.email || "Unknown"}</p>
              <p>Issued: {formatDate((revokeTarget || historyModal)?.createdAt)}</p>
              <p>Expires: {formatDate((revokeTarget || historyModal)?.expiresAt)}</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setHistoryModal(null); setRevokeTarget(null); }} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/10">
                Close
              </button>
              {revokeTarget && (
                <button onClick={() => void revokeLog(revokeTarget)} className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-bold text-white hover:bg-purple-700">
                  <Ban size={14} /> Confirm Revoke
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
