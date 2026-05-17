"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
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
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type DeliveryMethod = "in-app" | "email";
type Audience = "all" | "free" | "pro";

interface SentNotification {
  id: string;
  title: string;
  methods: DeliveryMethod[];
  audience: string;
  sentDate: string;
  openRate: number;
  targetCount: number;
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
  { value: "pro", label: "Pro / Elite Users Only" },
];

// ─── History Helpers ────────────────────────────────────────────────────────────
function formatSentDate(value?: string) {
  if (!value) return "Unknown";

  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeMethods(value: unknown): DeliveryMethod[] {
  const rawMethods = Array.isArray(value) ? value : [];
  const methods = new Set<DeliveryMethod>();

  for (const method of rawMethods) {
    const normalized = String(method || "").trim().toLowerCase();

    if (normalized === "email") {
      methods.add("email");
    }

    if (normalized === "in-app" || normalized === "inapp") {
      methods.add("in-app");
    }
  }

  return methods.size > 0 ? Array.from(methods) : ["in-app"];
}

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
  const [mounted, setMounted] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Compose form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [inApp, setInApp] = useState(true);
  const [emailBlast, setEmailBlast] = useState(false);
  const [audience, setAudience] = useState<Audience>("all");

  useEffect(() => {
    setMounted(true);
    let active = true;

    async function fetchHistory() {
      try {
        setIsLoadingHistory(true);
        const response = await fetch("/api/admin/notifications/history", {
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load notification history.");
        }

        if (!active) return;

        const history = Array.isArray(data?.history) ? data.history : [];
        setSentNotifications(
          history.map((item: any) => ({
            id: String(item.id),
            title: item.title || "Untitled broadcast",
            methods: normalizeMethods(item.deliveryMethods),
            audience: item.audience || "All Users",
            sentDate: formatSentDate(item.createdAt),
            openRate: 0,
            targetCount: Number(item.targetCount || 0),
          }))
        );
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load notification history."
          );
        }
      } finally {
        if (active) {
          setIsLoadingHistory(false);
        }
      }
    }

    void fetchHistory();

    return () => {
      active = false;
    };
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

  const handleSendBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required.");
      return;
    }

    try {
      setIsSending(true);
      const methods = [
        inApp ? "in-app" : null,
        emailBlast ? "email" : null,
      ].filter(Boolean) as DeliveryMethod[];
      const deliveryMethods: DeliveryMethod[] =
        methods.length > 0 ? methods : ["in-app"];
      const response = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: body.trim(),
          audience,
          deliveryMethods,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to send notification.");
      }

      const audienceLabel =
        AUDIENCE_OPTIONS.find((option) => option.value === audience)?.label ||
        "All Users";

      setSentNotifications((current) => [
        {
          id: `broadcast-${Date.now()}`,
          title: title.trim(),
          methods: deliveryMethods,
          audience: audienceLabel,
          sentDate: new Date().toLocaleDateString("en", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          openRate: 0,
          targetCount: Number(data?.sentCount || 0),
        },
        ...current,
      ]);
      const emailFailures = Number(data?.emailFailureCount || 0);
      toast.success(
        emailFailures > 0
          ? `${data?.sentCount ?? 0} users notified. ${emailFailures} email sends failed.`
          : `${data?.sentCount ?? 0} users notified.`
      );
      setComposeOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send notification."
      );
    } finally {
      setIsSending(false);
    }
  };

  const totalCampaigns = sentNotifications.length;
  const audienceReach = sentNotifications.reduce(
    (sum, notification) => sum + notification.targetCount,
    0
  );
  const avgOpenRate =
    totalCampaigns > 0
      ? Math.round(
        sentNotifications.reduce((sum, n) => sum + n.openRate, 0) / totalCampaigns
      )
      : 0;

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
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#7C3AED] text-white shadow-md shadow-purple-500/30 hover:opacity-90 transition-all shrink-0"
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
              {isLoadingHistory ? "..." : totalCampaigns.toLocaleString()}
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
              {isLoadingHistory ? "..." : audienceReach.toLocaleString()}
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
                {isLoadingHistory ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-16 text-sm text-slate-400 dark:text-slate-500"
                    >
                      Loading notification history...
                    </td>
                  </tr>
                ) : sentNotifications.length === 0 ? (
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
                  sentNotifications.map((notif) => (
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
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {notif.targetCount.toLocaleString()} targeted
                        </div>
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
          {totalCampaigns} campaigns sent · {avgOpenRate}% avg engagement
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
                onClick={() => void handleSendBroadcast()}
                disabled={isSending || !title.trim() || !body.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-[#7C3AED] text-white shadow-md shadow-purple-500/30 hover:opacity-90 transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {isSending ? "Sending..." : "Send Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

