"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Flame,
  Loader2,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trophy,
  UserX,
  X,
  Zap,
} from "lucide-react";

type Trend = "up" | "down";
type Timeframe = "weekly" | "monthly" | "all-time";
type Role = "students" | "teachers";

interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  initials: string;
  totalXP: number;
  timeframeXP: number;
  weeklyXP: number;
  monthlyXP: number;
  streak: number;
  trend: Trend;
  trendDelta: number;
  flagged: boolean;
}

interface LeaderboardStats {
  totalXP: number;
  activeStreaks: number;
  flagged: number;
}

type ModalType =
  | { kind: "edit"; user: LeaderboardUser }
  | { kind: "remove"; user: LeaderboardUser }
  | null;

const EMPTY_STATS: LeaderboardStats = {
  totalXP: 0,
  activeStreaks: 0,
  flagged: 0,
};

const RANK_MEDALS: Record<number, { label: string; row: string; badge: string }> = {
  1: {
    label: "1",
    row: "bg-amber-50/70 dark:bg-amber-500/[0.06] border-l-4 border-l-amber-400",
    badge:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
  },
  2: {
    label: "2",
    row: "bg-slate-50/70 dark:bg-slate-400/[0.04] border-l-4 border-l-slate-400",
    badge:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/25",
  },
  3: {
    label: "3",
    row: "bg-orange-50/40 dark:bg-orange-500/[0.04] border-l-4 border-l-orange-400",
    badge:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25",
  },
};

function formatXP(xp: number) {
  return Number(xp || 0).toLocaleString();
}

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function UserAvatar({ user }: { user: LeaderboardUser }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] text-xs font-bold text-white">
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        user.initials || user.name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}

export default function LeaderboardControlPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");
  const [role, setRole] = useState<Role>("students");
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [xpAdjust, setXpAdjust] = useState(0);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/leaderboard?role=${role}&timeframe=${timeframe}`,
        { cache: "no-store" }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load leaderboard data.");
      }

      setLeaderboardData(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
      setStats({ ...EMPTY_STATS, ...(data?.stats || {}) });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load leaderboard data."
      );
      setLeaderboardData([]);
      setStats(EMPTY_STATS);
    } finally {
      setIsLoading(false);
    }
  }, [role, timeframe]);

  useEffect(() => {
    void fetchLeaderboard();
  }, [fetchLeaderboard]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return leaderboardData;

    return leaderboardData.filter((user) =>
      user.name.toLowerCase().includes(query)
    );
  }, [leaderboardData, searchQuery]);

  const applyXpChange = async () => {
    if (modal?.kind !== "edit") return;

    try {
      setIsActionLoading(true);
      const response = await fetch("/api/admin/leaderboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust-xp",
          userId: modal.user.id,
          newXP: Math.max(0, modal.user.totalXP + xpAdjust),
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update XP.");
      }

      toast.success(data?.message || "XP updated successfully.");
      setModal(null);
      setXpAdjust(0);
      await fetchLeaderboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update XP.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const removeFromLeaderboard = async () => {
    if (modal?.kind !== "remove") return;

    try {
      setIsActionLoading(true);
      const response = await fetch("/api/admin/leaderboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          userId: modal.user.id,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to remove user.");
      }

      toast.success(data?.message || "User removed from leaderboard.");
      setModal(null);
      await fetchLeaderboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove user.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const resetWeekly = async () => {
    if (!window.confirm("Reset weekly XP for all leaderboard users?")) return;

    try {
      setIsActionLoading(true);
      const response = await fetch("/api/admin/leaderboard/reset-weekly", {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to reset weekly leaderboard.");
      }

      toast.success(data?.message || "Weekly leaderboard reset.");
      await fetchLeaderboard();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reset weekly leaderboard."
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-100 text-amber-600 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-400">
            <Trophy size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Leaderboard Control
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Manage rankings, adjust XP multipliers, and moderate leaderboard integrity.
            </p>
          </div>
        </div>

        <button
          onClick={() => void resetWeekly()}
          disabled={isActionLoading}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/5 hover:text-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.04]"
        >
          <RefreshCw size={15} className={isActionLoading ? "animate-spin" : ""} />
          Reset Weekly Leaderboard
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-4">
          <div className="shrink-0 text-[#7C3AED]">
            <Zap size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7C3AED]">
              Total XP
            </div>
            <div className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">
              {formatXP(stats.totalXP)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-500/20 dark:bg-orange-500/[0.08]">
          <div className="shrink-0 text-orange-500 dark:text-orange-400">
            <Flame size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Active Streaks
            </div>
            <div className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">
              {formatXP(stats.activeStreaks)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-500/20 dark:bg-red-500/[0.08]">
          <div className="shrink-0 text-red-500 dark:text-red-400">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Flagged for Boosting
            </div>
            <div className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">
              {formatXP(stats.flagged)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={timeframe}
              onChange={(event) => setTimeframe(event.target.value as Timeframe)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-900 transition-colors focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="all-time">All Time</option>
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
          </div>

          <div className="relative">
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-900 transition-colors focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              <option value="students">Students</option>
              <option value="teachers">Mentors</option>
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <th className="w-16 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Rank
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  User
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Weekly XP
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Monthly XP
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Total XP
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Current Streak
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Trend
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Loader2
                      size={34}
                      className="mx-auto mb-3 animate-spin text-[#7C3AED]"
                    />
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                      Loading leaderboard...
                    </p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
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
                      className={`border-b last:border-b-0 transition-colors ${
                        user.flagged
                          ? "border-l-4 border-l-red-500 border-b-slate-100 bg-red-50/50 dark:border-b-white/[0.04] dark:bg-red-950/15"
                          : medal
                            ? `${medal.row} border-b-slate-100 dark:border-b-white/[0.04]`
                            : "border-l-4 border-l-transparent border-b-slate-100 hover:bg-[#7C3AED]/5 dark:border-b-white/[0.04]"
                      }`}
                    >
                      <td className="px-4 py-4 text-center">
                        {medal ? (
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-black ${medal.badge}`}
                          >
                            {medal.label}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                            #{user.rank}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {user.name}
                              </p>
                              {user.flagged && (
                                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-700 dark:bg-red-500/15 dark:text-red-400">
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

                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-[#7C3AED]">
                          {formatXP(user.weeklyXP)}
                        </span>
                        <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                          XP
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-[#7C3AED]">
                          {formatXP(user.monthlyXP)}
                        </span>
                        <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                          XP
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatXP(user.totalXP)}
                        </span>
                        <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                          XP
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Flame size={13} className="text-orange-500" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {user.streak} Days
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {user.trend === "up" ? (
                            <>
                              <ArrowUp size={14} className="text-emerald-500" />
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                +{formatXP(user.trendDelta)}
                              </span>
                            </>
                          ) : (
                            <>
                              <ArrowDown size={14} className="text-red-500" />
                              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                -{formatXP(user.trendDelta)}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setXpAdjust(0);
                              setModal({ kind: "edit", user });
                            }}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[#7C3AED]/20 px-2.5 py-1.5 text-[11px] font-semibold text-[#7C3AED] transition-all hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/10"
                          >
                            <Pencil size={11} /> Edit XP
                          </button>
                          <button
                            onClick={() => setModal({ kind: "remove", user })}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
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

      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>
          Showing {filteredUsers.length} of {leaderboardData.length} users ·{" "}
          {titleCase(timeframe)} · {titleCase(role)}
        </span>
        <span>StudyBuddy Admin · Leaderboard Panel</span>
      </div>

      {modal?.kind === "edit" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            className="relative flex w-full max-w-md flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1a0f26]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <UserAvatar user={modal.user} />
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
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-white/[0.06]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">
                  XP Adjustment
                </label>
                <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
                  Use positive values to add XP or negative values to deduct XP.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setXpAdjust((value) => value - 100)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.04]"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={xpAdjust}
                    onChange={(event) => setXpAdjust(Number(event.target.value))}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-lg font-bold text-slate-900 transition-colors [appearance:textfield] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => setXpAdjust((value) => value + 100)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.04]"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">New Total</span>
                  <span
                    className={`font-bold ${
                      xpAdjust >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatXP(Math.max(0, modal.user.totalXP + xpAdjust))} XP
                    <span className="ml-1 text-xs font-medium">
                      ({xpAdjust >= 0 ? "+" : ""}
                      {formatXP(xpAdjust)})
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-white/10">
              <button
                onClick={() => setModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={() => void applyXpChange()}
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-purple-500/30 transition-all hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isActionLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Pencil size={13} />
                )}
                Apply XP Change
              </button>
            </div>
          </div>
        </div>
      )}

      {modal?.kind === "remove" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            className="relative flex w-full max-w-sm flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1a0f26]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-6 pb-4 pt-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
                <AlertTriangle size={22} className="text-red-500 dark:text-red-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Remove from Leaderboard
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                Are you sure you want to remove{" "}
                <strong className="text-slate-700 dark:text-slate-300">
                  {modal.user.name}
                </strong>{" "}
                from the leaderboard?
              </p>
            </div>

            <div className="mx-6 mb-4 rounded-xl border border-red-100 bg-red-50/50 p-3 dark:border-red-500/10 dark:bg-red-500/[0.05]">
              <div className="flex items-center gap-3">
                <UserAvatar user={modal.user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {modal.user.name}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Rank #{modal.user.rank} · {formatXP(modal.user.totalXP)} XP
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-6 pb-6">
              <button
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={() => void removeFromLeaderboard()}
                disabled={isActionLoading}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/30 transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isActionLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <UserX size={13} />
                )}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

