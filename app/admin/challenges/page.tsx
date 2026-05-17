"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Coins,
  Edit,
  Gift,
  Loader2,
  Plus,
  Sparkles,
  Swords,
  Target,
  Trash2,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

type ChallengeType = "daily" | "weekly" | "global" | "elite";

type Challenge = {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  xpReward: number;
  coinsReward: number;
  targetMetric: number;
  metricLabel: string;
  completions: number;
  totalEligible: number;
  completionPercentage: number;
  xpDistributed: number;
  isActive: boolean;
};

type Stats = {
  activeChallenges: number;
  totalCompletions: number;
  xpDistributed: number;
  totalEligible: number;
};

type FormState = {
  title: string;
  description: string;
  type: ChallengeType;
  xpReward: number;
  coinsReward: number;
  targetMetric: number;
  metricLabel: string;
  isActive: boolean;
};

const TYPE_CONFIG: Record<
  ChallengeType,
  { label: string; badge: string; Icon: LucideIcon }
> = {
  daily: {
    label: "Daily",
    badge:
      "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25",
    Icon: Calendar,
  },
  weekly: {
    label: "Weekly",
    badge:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/25",
    Icon: Target,
  },
  global: {
    label: "Global",
    badge:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25",
    Icon: Users,
  },
  elite: {
    label: "Elite",
    badge:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
    Icon: Sparkles,
  },
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  type: "daily",
  xpReward: 100,
  coinsReward: 0,
  targetMetric: 1,
  metricLabel: "items",
  isActive: true,
};

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/50 disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-[#7C3AED]" : "bg-slate-300 dark:bg-white/10"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

function formFromChallenge(challenge: Challenge): FormState {
  return {
    title: challenge.title,
    description: challenge.description,
    type: challenge.type,
    xpReward: challenge.xpReward,
    coinsReward: challenge.coinsReward,
    targetMetric: challenge.targetMetric,
    metricLabel: challenge.metricLabel,
    isActive: challenge.isActive,
  };
}

export default function ChallengesManagementPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState<Stats>({
    activeChallenges: 0,
    totalCompletions: 0,
    xpDistributed: 0,
    totalEligible: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const fetchChallenges = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/challenges", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load challenges.");
      }

      setChallenges(Array.isArray(data.challenges) ? data.challenges : []);
      setStats({
        activeChallenges: Number(data.stats?.activeChallenges || 0),
        totalCompletions: Number(data.stats?.totalCompletions || 0),
        xpDistributed: Number(data.stats?.xpDistributed || 0),
        totalEligible: Number(data.stats?.totalEligible || 0),
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load challenges."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchChallenges();
  }, [fetchChallenges]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingChallenge(null);
    setModalMode("create");
  }

  function openEdit(challenge: Challenge) {
    setForm(formFromChallenge(challenge));
    setEditingChallenge(challenge);
    setModalMode("edit");
  }

  function closeModal() {
    if (isSaving) return;
    setModalMode(null);
    setEditingChallenge(null);
  }

  async function handleSubmit() {
    setIsSaving(true);

    try {
      const isEditing = modalMode === "edit" && editingChallenge;
      const res = await fetch(
        isEditing
          ? `/api/admin/challenges/${editingChallenge.id}`
          : "/api/admin/challenges",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to save challenge.");
      }

      toast.success(
        isEditing ? "Challenge updated." : "Challenge created."
      );
      closeModal();
      await fetchChallenges();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save challenge."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggle(challenge: Challenge, isActive: boolean) {
    setTogglingId(challenge.id);

    try {
      const res = await fetch(`/api/admin/challenges/${challenge.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update challenge.");
      }

      toast.success(isActive ? "Challenge activated." : "Challenge deactivated.");
      await fetchChallenges();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update challenge."
      );
    } finally {
      setTogglingId("");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/challenges/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete challenge.");
      }

      toast.success("Challenge deleted.");
      setDeleteTarget(null);
      await fetchChallenges();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete challenge."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/10 text-[#7C3AED]">
            <Swords size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Challenges Management
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Create and manage daily, weekly, global, and elite quests.
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/25 transition-all hover:bg-[#6D28D9]"
        >
          <Plus size={15} /> Create New Challenge
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/10 p-4">
          <div className="shrink-0 text-[#7C3AED]">
            <Target size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7C3AED]">
              Active Challenges
            </div>
            <div className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">
              {stats.activeChallenges}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]">
          <div className="shrink-0 text-emerald-500 dark:text-emerald-400">
            <Users size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Total Completions
            </div>
            <div className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalCompletions.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/[0.08]">
          <div className="shrink-0 text-amber-500 dark:text-amber-400">
            <Gift size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              XP Distributed
            </div>
            <div className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">
              {stats.xpDistributed.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#7C3AED]" />
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Loading challenges...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {challenges.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <Swords
                size={42}
                className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
              />
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                No challenges yet.
              </p>
              <p className="mt-1 text-xs text-slate-400/60 dark:text-slate-500/60">
                Create your first challenge to get started.
              </p>
            </div>
          ) : (
            challenges.map((challenge) => {
              const config = TYPE_CONFIG[challenge.type] || TYPE_CONFIG.daily;
              const Icon = config.Icon;
              const progress = Math.min(
                100,
                Math.max(0, challenge.completionPercentage)
              );

              return (
                <div
                  key={challenge.id}
                  className={`group flex flex-col rounded-2xl border bg-white transition-all hover:shadow-lg hover:shadow-[#7C3AED]/5 dark:bg-white/[0.02] ${
                    challenge.isActive
                      ? "border-[#7C3AED]/40 shadow-sm"
                      : "border-slate-200 opacity-75 dark:border-white/[0.06]"
                  }`}
                >
                  <div className="px-5 pb-3 pt-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {challenge.title}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.badge}`}
                      >
                        <Icon size={10} />
                        {config.label}
                      </span>
                    </div>

                    <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {challenge.description}
                    </p>
                  </div>

                  <div className="px-5 pb-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        Completed by{" "}
                        <strong className="text-slate-600 dark:text-slate-300">
                          {challenge.completions.toLocaleString()}
                        </strong>{" "}
                        users
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          challenge.isActive
                            ? "bg-[#7C3AED]"
                            : "bg-slate-300 dark:bg-white/10"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="px-5 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-[#7C3AED]/15 bg-[#7C3AED]/10 px-2 py-1 text-[11px] font-bold text-[#7C3AED]">
                        <Zap size={11} className="shrink-0" />+
                        {challenge.xpReward.toLocaleString()} XP
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg border border-amber-100 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 dark:border-amber-500/15 dark:bg-amber-500/10 dark:text-amber-400">
                        <Coins size={11} className="shrink-0" />+
                        {challenge.coinsReward.toLocaleString()} Coins
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400">
                        <Target size={10} className="shrink-0" />
                        {challenge.targetMetric.toLocaleString()}{" "}
                        {challenge.metricLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={challenge.isActive}
                        disabled={togglingId === challenge.id}
                        onChange={(value) => void handleToggle(challenge, value)}
                      />
                      <span
                        className={`text-[11px] font-semibold ${
                          challenge.isActive
                            ? "text-[#7C3AED]"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {challenge.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(challenge)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#7C3AED] dark:text-slate-500 dark:hover:bg-white/[0.06]"
                        aria-label={`Edit ${challenge.title}`}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(challenge)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        aria-label={`Delete ${challenge.title}`}
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
      )}

      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>
          {challenges.length} challenges · {stats.activeChallenges} active
        </span>
        <span>StudyBuddy Admin · Challenges Panel</span>
      </div>

      {modalMode !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1a0f26]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED]">
                  {modalMode === "create" ? <Plus size={16} /> : <Edit size={16} />}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {modalMode === "create"
                    ? "Create New Challenge"
                    : "Edit Challenge"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:text-slate-500 dark:hover:bg-white/[0.06]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">
                  Challenge Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="e.g. Weekend Warrior"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="What should the student do?"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      type: event.target.value as ChallengeType,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-[#241333] dark:text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="global">Global</option>
                  <option value="elite">Elite</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">
                    <span className="inline-flex items-center gap-1">
                      <Zap size={13} className="text-[#7C3AED]" /> XP
                    </span>
                  </label>
                  <input
                    type="number"
                    value={form.xpReward}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        xpReward: Number(event.target.value),
                      }))
                    }
                    min={0}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">
                    <span className="inline-flex items-center gap-1">
                      <Coins size={13} className="text-amber-500" /> Coins
                    </span>
                  </label>
                  <input
                    type="number"
                    value={form.coinsReward}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        coinsReward: Number(event.target.value),
                      }))
                    }
                    min={0}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">
                    Metric Number
                  </label>
                  <input
                    type="number"
                    value={form.targetMetric}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        targetMetric: Number(event.target.value),
                      }))
                    }
                    min={1}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">
                    Metric Label
                  </label>
                  <input
                    type="text"
                    value={form.metricLabel}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        metricLabel: event.target.value,
                      }))
                    }
                    placeholder="hours"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 dark:border-white/10">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Active
                </span>
                <Toggle
                  checked={form.isActive}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, isActive: value }))
                  }
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-white/10">
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSubmit()}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/25 transition-all hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : modalMode === "create" ? (
                  <Plus size={14} />
                ) : (
                  <Edit size={14} />
                )}
                {modalMode === "create" ? "Create Challenge" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!isSaving) setDeleteTarget(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1a0f26]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete challenge?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              This will delete "{deleteTarget.title}" and all associated user
              progress records. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

