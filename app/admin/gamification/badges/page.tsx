"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  CheckCircle2,
  Coins,
  Edit,
  Loader2,
  Plus,
  Star,
  Target,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type BadgeRarity = "common" | "rare" | "legendary";

type AdminBadge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  metricLabel: string;
  targetValue: number;
  xpBonus: number;
  coinBonus: number;
  isActive: boolean;
  earnedCount: number;
};

type BadgeStats = {
  totalBadges: number;
  activeBadges: number;
  totalEarned: number;
};

type BadgeForm = {
  title: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  metricLabel: string;
  targetValue: number;
  xpBonus: number;
  coinBonus: number;
  isActive: boolean;
};

const EMPTY_FORM: BadgeForm = {
  title: "",
  description: "",
  icon: "Award",
  rarity: "common",
  metricLabel: "focus_room",
  targetValue: 1,
  xpBonus: 50,
  coinBonus: 10,
  isActive: true,
};

const RARITY_CLASS: Record<BadgeRarity, string> = {
  common:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
  rare:
    "border-[#7C3AED]/20 bg-[#7C3AED]/10 text-[#7C3AED] dark:border-[#7C3AED]/30",
  legendary:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
};

function formFromBadge(badge: AdminBadge): BadgeForm {
  return {
    title: badge.title,
    description: badge.description,
    icon: badge.icon,
    rarity: badge.rarity,
    metricLabel: badge.metricLabel,
    targetValue: badge.targetValue,
    xpBonus: badge.xpBonus,
    coinBonus: badge.coinBonus,
    isActive: badge.isActive,
  };
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-[#7C3AED]" : "bg-slate-300 dark:bg-white/10"
      }`}
    >
      <span
        className={`h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<AdminBadge[]>([]);
  const [stats, setStats] = useState<BadgeStats>({
    totalBadges: 0,
    activeBadges: 0,
    totalEarned: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingBadge, setEditingBadge] = useState<AdminBadge | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBadge | null>(null);
  const [form, setForm] = useState<BadgeForm>(EMPTY_FORM);

  const fetchBadges = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/badges", { cache: "no-store" });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load badges.");
      }

      setBadges(Array.isArray(data?.badges) ? data.badges : []);
      setStats({
        totalBadges: Number(data?.stats?.totalBadges || 0),
        activeBadges: Number(data?.stats?.activeBadges || 0),
        totalEarned: Number(data?.stats?.totalEarned || 0),
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load badges."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBadges();
  }, [fetchBadges]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingBadge(null);
    setModalMode("create");
  }

  function openEdit(badge: AdminBadge) {
    setForm(formFromBadge(badge));
    setEditingBadge(badge);
    setModalMode("edit");
  }

  function closeModal() {
    if (isSaving) return;
    setModalMode(null);
    setEditingBadge(null);
  }

  async function saveBadge() {
    try {
      setIsSaving(true);
      const isEditing = modalMode === "edit" && editingBadge;
      const response = await fetch(
        isEditing ? `/api/admin/badges/${editingBadge.id}` : "/api/admin/badges",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save badge.");
      }

      toast.success(data?.message || "Badge saved.");
      closeModal();
      await fetchBadges();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save badge."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleBadge(badge: AdminBadge, isActive: boolean) {
    try {
      setTogglingId(badge.id);
      const response = await fetch(`/api/admin/badges/${badge.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update badge.");
      }

      toast.success(isActive ? "Badge activated." : "Badge deactivated.");
      await fetchBadges();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update badge."
      );
    } finally {
      setTogglingId("");
    }
  }

  async function deleteBadge() {
    if (!deleteTarget) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/badges/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete badge.");
      }

      toast.success(data?.message || "Badge deleted.");
      setDeleteTarget(null);
      await fetchBadges();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete badge."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/10 text-[#7C3AED]">
            <Award size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Badge Management
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Define automated achievements and reward milestones.
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/25 transition-colors hover:bg-purple-700"
        >
          <Plus size={15} /> Create Badge
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/10 p-4">
          <div className="flex items-center gap-3 text-[#7C3AED]">
            <Award size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Badges
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">
            {stats.totalBadges}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Active
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">
            {stats.activeBadges}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/[0.08]">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <Star size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Earned Globally
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">
            {stats.totalEarned.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-4 font-bold">Badge</th>
                <th className="px-5 py-4 font-bold">Rarity</th>
                <th className="px-5 py-4 font-bold">Metric</th>
                <th className="px-5 py-4 font-bold">Rewards</th>
                <th className="px-5 py-4 font-bold">Earned</th>
                <th className="px-5 py-4 font-bold">Active</th>
                <th className="px-5 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#7C3AED]" />
                  </td>
                </tr>
              ) : badges.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    No badges have been created yet.
                  </td>
                </tr>
              ) : (
                badges.map((badge) => (
                  <tr key={badge.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
                          <Award size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{badge.title}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {badge.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${RARITY_CLASS[badge.rarity]}`}
                      >
                        {badge.rarity}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-foreground">
                        {badge.targetValue.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {badge.metricLabel}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-2 py-1 text-xs font-bold text-[#7C3AED]">
                          <Zap size={12} /> {badge.xpBonus}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                          <Coins size={12} /> {badge.coinBonus}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {badge.earnedCount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <Toggle
                        checked={badge.isActive}
                        disabled={togglingId === badge.id}
                        onChange={(value) => void toggleBadge(badge, value)}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(badge)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]"
                          title="Edit badge"
                        >
                          <Edit size={17} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(badge)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                          title="Delete badge"
                        >
                          <Trash2 size={17} />
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

      {modalMode ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black text-foreground">
                {modalMode === "create" ? "Create Badge" : "Edit Badge"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold">Title</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold">Icon Name</span>
                <input
                  value={form.icon}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, icon: event.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold">Rarity</span>
                <select
                  value={form.rarity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      rarity: event.target.value as BadgeRarity,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                >
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="legendary">Legendary</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold">Metric Label</span>
                <input
                  value={form.metricLabel}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      metricLabel: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold">Target Value</span>
                <input
                  type="number"
                  min={1}
                  value={form.targetValue}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      targetValue: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold">XP Bonus</span>
                <input
                  type="number"
                  min={0}
                  value={form.xpBonus}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      xpBonus: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold">Coin Bonus</span>
                <input
                  type="number"
                  min={0}
                  value={form.coinBonus}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      coinBonus: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
              <span className="text-sm font-semibold">Active</span>
              <Toggle
                checked={form.isActive}
                onChange={(value) =>
                  setForm((current) => ({ ...current, isActive: value }))
                }
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void saveBadge()}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : null}
                Save Badge
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
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-black text-foreground">Delete badge?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This removes "{deleteTarget.title}" and all earned records for it.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isSaving}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void deleteBadge()}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
