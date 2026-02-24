"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    Trophy,
    RefreshCw,
    Medal,
    ShieldAlert,
    Search,
    Filter,
    ArrowUp,
    ArrowDown,
    UserX,
    X,
    Flame,
    Zap,
    Pencil,
    ChevronDown,
    AlertTriangle,
    Minus,
    Plus,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type Trend = "up" | "down";
type Timeframe = "weekly" | "monthly" | "all-time";
type Role = "students" | "mentors";

interface LeaderboardUser {
    id: string;
    rank: number;
    name: string;
    avatar: string;
    totalXP: number;
    streak: number;
    trend: Trend;
    trendDelta: number;
    flagged: boolean;
}

type ModalType =
    | { kind: "edit"; user: LeaderboardUser }
    | { kind: "remove"; user: LeaderboardUser }
    | null;

// ─── Rank Config ────────────────────────────────────────────────────────────────
const RANK_MEDALS: Record<number, { emoji: string; row: string; badge: string }> = {
    1: {
        emoji: "🥇",
        row: "bg-amber-50/70 dark:bg-amber-500/[0.06] border-l-4 border-l-amber-400",
        badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
    },
    2: {
        emoji: "🥈",
        row: "bg-slate-50/70 dark:bg-slate-400/[0.04] border-l-4 border-l-slate-400",
        badge: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/25",
    },
    3: {
        emoji: "🥉",
        row: "bg-orange-50/40 dark:bg-orange-500/[0.04] border-l-4 border-l-orange-400",
        badge: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25",
    },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_USERS: LeaderboardUser[] = [
    {
        id: "u1",
        rank: 1,
        name: "Sophia Zhang",
        avatar: "SZ",
        totalXP: 12450,
        streak: 28,
        trend: "up",
        trendDelta: 3,
        flagged: false,
    },
    {
        id: "u2",
        rank: 2,
        name: "Alex Nguyen",
        avatar: "AN",
        totalXP: 11200,
        streak: 21,
        trend: "up",
        trendDelta: 1,
        flagged: false,
    },
    {
        id: "u3",
        rank: 3,
        name: "Priya Sharma",
        avatar: "PS",
        totalXP: 9870,
        streak: 14,
        trend: "down",
        trendDelta: 2,
        flagged: false,
    },
    {
        id: "u4",
        rank: 4,
        name: "Jordan Williams",
        avatar: "JW",
        totalXP: 8340,
        streak: 7,
        trend: "up",
        trendDelta: 5,
        flagged: true,
    },
    {
        id: "u5",
        rank: 5,
        name: "Liam O'Brien",
        avatar: "LO",
        totalXP: 7120,
        streak: 11,
        trend: "down",
        trendDelta: 1,
        flagged: false,
    },
];

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function LeaderboardControlPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [timeframe, setTimeframe] = useState<Timeframe>("weekly");
    const [role, setRole] = useState<Role>("students");
    const [searchQuery, setSearchQuery] = useState("");
    const [modal, setModal] = useState<ModalType>(null);
    const [xpAdjust, setXpAdjust] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    const filteredUsers = MOCK_USERS.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatXP = (xp: number) => xp.toLocaleString();

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-amber-100 border border-amber-200 text-amber-600 dark:bg-amber-500/15 dark:border-amber-500/25 dark:text-amber-400">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Leaderboard Control
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage rankings, adjust XP multipliers, and moderate leaderboard integrity.
                        </p>
                    </div>
                </div>

                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all shrink-0">
                    <RefreshCw size={15} /> Reset Weekly Leaderboard
                </button>
            </div>

            {/* ════════ STAT CARDS ════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total XP Earned Today */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-purple-50/60 border-purple-200 dark:bg-purple-500/[0.08] dark:border-purple-500/20">
                    <div className="text-purple-500 dark:text-purple-400 shrink-0">
                        <Zap size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            Total XP Earned Today
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            4,820
                        </div>
                    </div>
                </div>

                {/* Active Streaks */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-orange-50/60 border-orange-200 dark:bg-orange-500/[0.08] dark:border-orange-500/20">
                    <div className="text-orange-500 dark:text-orange-400 shrink-0">
                        <Flame size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            Active Streaks
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            38
                        </div>
                    </div>
                </div>

                {/* Flagged for Boosting */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-red-50/60 border-red-200 dark:bg-red-500/[0.08] dark:border-red-500/20">
                    <div className="text-red-500 dark:text-red-400 shrink-0">
                        <ShieldAlert size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                            Flagged for Boosting
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            1
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ FILTERS + SEARCH ════════ */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Dropdowns */}
                <div className="flex items-center gap-2">
                    {/* Timeframe */}
                    <div className="relative">
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors font-medium"
                        >
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="all-time">All-Time</option>
                        </select>
                        <ChevronDown
                            size={13}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                        />
                    </div>

                    {/* Role */}
                    <div className="relative">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as Role)}
                            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors font-medium"
                        >
                            <option value="students">Students</option>
                            <option value="mentors">Mentors</option>
                        </select>
                        <ChevronDown
                            size={13}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                        />
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    />
                </div>
            </div>

            {/* ════════ LEADERBOARD TABLE ════════ */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px]">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                                <th className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-4 py-3 w-16">
                                    Rank
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    User
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Total XP
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Current Streak
                                </th>
                                <th className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-4 py-3">
                                    Trend
                                </th>
                                <th className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16">
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
                                            className={`border-b last:border-b-0 transition-colors ${user.flagged
                                                    ? "bg-red-50/50 dark:bg-red-950/15 border-l-4 border-l-red-500 border-b-slate-100 dark:border-b-white/[0.04]"
                                                    : medal
                                                        ? `${medal.row} border-b-slate-100 dark:border-b-white/[0.04]`
                                                        : "border-l-4 border-l-transparent border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                                }`}
                                        >
                                            {/* Rank */}
                                            <td className="px-4 py-4 text-center">
                                                {medal ? (
                                                    <span className="text-xl">{medal.emoji}</span>
                                                ) : (
                                                    <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                                                        #{user.rank}
                                                    </span>
                                                )}
                                            </td>

                                            {/* User */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${user.rank === 1
                                                                ? "bg-gradient-to-br from-amber-400 to-yellow-600"
                                                                : user.rank === 2
                                                                    ? "bg-gradient-to-br from-slate-300 to-slate-500"
                                                                    : user.rank === 3
                                                                        ? "bg-gradient-to-br from-orange-400 to-amber-600"
                                                                        : "bg-gradient-to-br from-purple-500 to-pink-500"
                                                            }`}
                                                    >
                                                        {user.avatar}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                                {user.name}
                                                            </p>
                                                            {user.flagged && (
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
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

                                            {/* Total XP */}
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {formatXP(user.totalXP)}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                                                    XP
                                                </span>
                                            </td>

                                            {/* Current Streak */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Flame size={13} className="text-orange-500" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {user.streak} Days
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Trend */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    {user.trend === "up" ? (
                                                        <>
                                                            <ArrowUp size={14} className="text-emerald-500" />
                                                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                                +{user.trendDelta}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ArrowDown size={14} className="text-red-500" />
                                                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                                                -{user.trendDelta}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 justify-end">
                                                    <button
                                                        onClick={() => {
                                                            setXpAdjust(0);
                                                            setModal({ kind: "edit", user });
                                                        }}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all whitespace-nowrap"
                                                    >
                                                        <Pencil size={11} /> Edit XP
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setModal({ kind: "remove", user })
                                                        }
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/30 transition-all whitespace-nowrap"
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

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                    Showing {filteredUsers.length} of {MOCK_USERS.length} users ·{" "}
                    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} ·{" "}
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
                <span>StudyBuddy Admin · Leaderboard Panel</span>
            </div>

            {/* ════════ EDIT XP MODAL ════════ */}
            {modal?.kind === "edit" && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setModal(null)}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {modal.user.avatar}
                                </div>
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
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    XP Adjustment
                                </label>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                                    Use positive values to add XP (reward) or negative values to
                                    deduct XP (penalty).
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setXpAdjust((v) => v - 100)}
                                        className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <input
                                        type="number"
                                        value={xpAdjust}
                                        onChange={(e) => setXpAdjust(Number(e.target.value))}
                                        className="flex-1 text-center text-lg font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                        onClick={() => setXpAdjust((v) => v + 100)}
                                        className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 border border-slate-200 dark:border-white/[0.06]">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">
                                        New Total
                                    </span>
                                    <span
                                        className={`font-bold ${xpAdjust >= 0
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-red-600 dark:text-red-400"
                                            }`}
                                    >
                                        {formatXP(modal.user.totalXP + xpAdjust)} XP
                                        <span className="text-xs ml-1 font-medium">
                                            ({xpAdjust >= 0 ? "+" : ""}
                                            {formatXP(xpAdjust)})
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10">
                            <button
                                onClick={() => setModal(null)}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setModal(null)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/30 hover:bg-purple-700 transition-all"
                            >
                                <Pencil size={13} /> Apply XP Change
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ REMOVE CONFIRMATION MODAL ════════ */}
            {modal?.kind === "remove" && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setModal(null)}
                >
                    <div
                        className="relative w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle size={22} className="text-red-500 dark:text-red-400" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Remove from Leaderboard
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                                Are you sure you want to remove <strong className="text-slate-700 dark:text-slate-300">{modal.user.name}</strong> from
                                the leaderboard? This action is typically used for users caught
                                cheating or XP boosting.
                            </p>
                        </div>

                        {/* User Preview */}
                        <div className="mx-6 mb-4 rounded-xl bg-red-50/50 dark:bg-red-500/[0.05] p-3 border border-red-100 dark:border-red-500/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {modal.user.avatar}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                        {modal.user.name}
                                    </p>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                        Rank #{modal.user.rank} · {formatXP(modal.user.totalXP)} XP
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 px-6 pb-6">
                            <button
                                onClick={() => setModal(null)}
                                className="flex-1 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setModal(null)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white shadow-md shadow-red-500/30 hover:bg-red-700 transition-all"
                            >
                                <UserX size={13} /> Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
