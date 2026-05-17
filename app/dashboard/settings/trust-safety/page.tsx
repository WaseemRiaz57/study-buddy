"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Loader2, Scale, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import AppealModal from "@/components/modals/AppealModal";

interface ModerationLog {
  id: string;
  actionType: "warning" | "strike" | "ban";
  reason: string;
  expiresAt: string | null;
  createdAt: string;
}

function formatDate(value?: string | null) {
  if (!value) return "Permanent";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TrustSafetyPage() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [status, setStatus] = useState({ accountStatus: "active", activeStrikes: 0 });
  const [loading, setLoading] = useState(true);
  const [appealLog, setAppealLog] = useState<ModerationLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/user/moderation-logs", { cache: "no-store" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      toast.error(data?.message || "Failed to load account status.");
      setLoading(false);
      return;
    }

    setStatus({
      accountStatus: data?.status?.accountStatus || "active",
      activeStrikes: Number(data?.status?.activeStrikes || 0),
    });
    setLogs(Array.isArray(data?.logs) ? data.logs : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const accountLabel = useMemo(() => {
    if (status.accountStatus === "banned") return "Banned";
    if (status.accountStatus === "suspended") return "Suspended";
    if (logs.some((log) => log.actionType === "strike")) return "Active with Strikes";
    if (logs.some((log) => log.actionType === "warning")) return "Active with Warning";
    return "Active";
  }, [logs, status.accountStatus]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Trust &amp; Safety
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Review your current account standing, active penalties, and appeals.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[#7C3AED]" size={28} />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  status.accountStatus === "active"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-red-500/10 text-red-500"
                }`}>
                  {status.accountStatus === "active" ? <CheckCircle size={22} /> : <ShieldAlert size={22} />}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Account Status
                  </p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    {accountLabel}
                  </h3>
                </div>
              </div>
              <div className="rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-3 text-sm font-bold text-[#7C3AED]">
                {status.activeStrikes} active strike{status.activeStrikes === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {logs.length === 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  No active warnings or strikes. Your account is in good standing.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <AlertTriangle className={log.actionType === "warning" ? "text-yellow-500" : "text-red-500"} size={18} />
                        <div>
                          <p className="text-sm font-bold capitalize text-slate-900 dark:text-white">
                            {log.actionType}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {log.reason}
                          </p>
                          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                            Issued {formatDate(log.createdAt)} · Expires {formatDate(log.expiresAt)}
                          </p>
                        </div>
                      </div>
                      {log.actionType !== "warning" && (
                        <button
                          type="button"
                          onClick={() => setAppealLog(log)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-purple-700"
                        >
                          <Scale size={15} />
                          Appeal this Strike
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <AppealModal
        isOpen={Boolean(appealLog)}
        logId={appealLog?.id}
        title="Appeal Penalty"
        onClose={() => setAppealLog(null)}
        onSubmitted={() => void fetchLogs()}
      />
    </div>
  );
}
