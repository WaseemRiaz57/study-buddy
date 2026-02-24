"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    AlertTriangle,
    ShieldAlert,
    UserX,
    History,
    Search,
    Filter,
    Shield,
    Ban,
    X,
    ChevronDown,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type PenaltyLevel = "warning" | "strike1" | "strike2" | "banned";

interface StrikeEvent {
    date: string;
    action: string;
    reason: string;
    moderator: string;
}

interface StrikeUser {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar: string;
    level: PenaltyLevel;
    reason: string;
    expiry: string;
    permanent: boolean;
    history: StrikeEvent[];
}

// ─── Penalty Level Config ───────────────────────────────────────────────────────
const PENALTY_CONFIG: Record<
    PenaltyLevel,
    { label: string; emoji: string; badge: string }
> = {
    warning: {
        label: "Warning",
        emoji: "🟡",
        badge:
            "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/25",
    },
    strike1: {
        label: "Strike 1",
        emoji: "🟠",
        badge:
            "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25",
    },
    strike2: {
        label: "Strike 2",
        emoji: "🔴",
        badge:
            "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
    },
    banned: {
        label: "Banned",
        emoji: "❌",
        badge:
            "bg-red-200 text-red-800 border-red-300 dark:bg-red-500/25 dark:text-red-300 dark:border-red-500/35",
    },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_USERS: StrikeUser[] = [
    {
        id: "u1",
        name: "Marcus Cole",
        username: "@darkphoenix99",
        email: "marcus.c@email.com",
        avatar: "MC",
        level: "strike2",
        reason: "Repeated harassment in study group channels and targeted bullying of new members.",
        expiry: "Expires in 3 days",
        permanent: false,
        history: [
            { date: "Feb 22, 2026", action: "Escalated to Strike 2", reason: "Continued harassment after first warning", moderator: "Admin Sarah" },
            { date: "Feb 18, 2026", action: "Strike 1 Issued", reason: "Harassment in study group chat", moderator: "Admin Alex" },
            { date: "Feb 10, 2026", action: "Warning Issued", reason: "Inappropriate language in comments", moderator: "Admin Priya" },
        ],
    },
    {
        id: "u2",
        name: "Elena Rodriguez",
        username: "@elena_spam",
        email: "elena.r@email.com",
        avatar: "ER",
        level: "strike1",
        reason: "Posting promotional spam links across multiple resource threads.",
        expiry: "Expires in 12 days",
        permanent: false,
        history: [
            { date: "Feb 20, 2026", action: "Strike 1 Issued", reason: "Spam content in resource threads", moderator: "Admin Alex" },
            { date: "Feb 14, 2026", action: "Warning Issued", reason: "Self-promotional comment flagged", moderator: "AutoMod" },
        ],
    },
    {
        id: "u3",
        name: "Jake Thompson",
        username: "@jake_cheater",
        email: "jake.t@email.com",
        avatar: "JT",
        level: "banned",
        reason: "Sharing copyrighted exam answers and encouraging academic dishonesty.",
        expiry: "Permanent",
        permanent: true,
        history: [
            { date: "Feb 21, 2026", action: "Permanently Banned", reason: "Sharing copyrighted exam papers", moderator: "Admin Sarah" },
            { date: "Feb 19, 2026", action: "Strike 2 Issued", reason: "Continued copyright violations", moderator: "Admin Alex" },
            { date: "Feb 15, 2026", action: "Strike 1 Issued", reason: "Sharing exam answers", moderator: "Admin Priya" },
            { date: "Feb 12, 2026", action: "Warning Issued", reason: "Suspicious resource uploads", moderator: "AutoMod" },
        ],
    },
    {
        id: "u4",
        name: "Aisha Patel",
        username: "@aisha_p",
        email: "aisha.p@email.com",
        avatar: "AP",
        level: "warning",
        reason: "Off-topic political discussions in science study groups.",
        expiry: "Expires in 25 days",
        permanent: false,
        history: [
            { date: "Feb 23, 2026", action: "Warning Issued", reason: "Off-topic posts in study group", moderator: "Admin Alex" },
        ],
    },
    {
        id: "u5",
        name: "Ryan Kim",
        username: "@ryan_toxic",
        email: "ryan.k@email.com",
        avatar: "RK",
        level: "strike2",
        reason: "Toxic behavior toward mentors and persistent derailing of live sessions.",
        expiry: "Expires in 1 day",
        permanent: false,
        history: [
            { date: "Feb 23, 2026", action: "Escalated to Strike 2", reason: "Disrupting live mentoring sessions", moderator: "Admin Sarah" },
            { date: "Feb 17, 2026", action: "Strike 1 Issued", reason: "Toxic comments toward a mentor", moderator: "Admin Alex" },
            { date: "Feb 11, 2026", action: "Warning Issued", reason: "Rude language in session chat", moderator: "AutoMod" },
        ],
    },
];

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function StrikesWarningsPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [historyModal, setHistoryModal] = useState<StrikeUser | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Filter users
    const filteredUsers = MOCK_USERS.filter((u) => {
        const matchesSearch =
            !search.trim() ||
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filterStatus === "all" || u.level === filterStatus;

        return matchesSearch && matchesFilter;
    });

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    const isDark = resolvedTheme === "dark";

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-orange-100 border border-orange-200 text-orange-600 dark:bg-orange-500/15 dark:border-orange-500/25 dark:text-orange-400">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Strikes &amp; Warnings
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Track user penalties, active strikes, and automated suspensions.
                        </p>
                    </div>
                </div>
            </div>

            {/* ════════ STAT CARDS ════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Active Warnings */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-yellow-50/60 border-yellow-200 dark:bg-yellow-500/[0.08] dark:border-yellow-500/20">
                    <div className="text-yellow-500 dark:text-yellow-400 shrink-0">
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                            Active Warnings
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            12
                        </div>
                    </div>
                </div>

                {/* Users on Strike 2 */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-orange-50/60 border-orange-200 dark:bg-orange-500/[0.08] dark:border-orange-500/20">
                    <div className="text-orange-500 dark:text-orange-400 shrink-0">
                        <ShieldAlert size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            Users on Strike 2
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            3
                        </div>
                    </div>
                </div>

                {/* Recent Suspensions */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-red-50/60 border-red-200 dark:bg-red-500/[0.08] dark:border-red-500/20">
                    <div className="text-red-500 dark:text-red-400 shrink-0">
                        <UserX size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                            Recent Suspensions
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            5
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ CONTROLS BAR ════════ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-auto">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    />
                    <input
                        type="text"
                        placeholder="Search by username or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-72 pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    />
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                    <Filter
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="appearance-none pl-9 pr-9 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    >
                        <option value="all">All Statuses</option>
                        <option value="warning">Warning</option>
                        <option value="strike1">Strike 1</option>
                        <option value="strike2">Strike 2</option>
                        <option value="banned">Suspended / Banned</option>
                    </select>
                    <ChevronDown
                        size={13}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                    />
                </div>
            </div>

            {/* ════════ DATA TABLE ════════ */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    User
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Status
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Last Reason
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Expiry
                                </th>
                                <th className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16">
                                        <Shield
                                            size={36}
                                            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                                        />
                                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                            No users match your filters.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const cfg = PENALTY_CONFIG[user.level];
                                    const isDanger =
                                        user.level === "strike2" || user.level === "banned";

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`border-b last:border-b-0 transition-colors ${isDanger
                                                    ? "bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500 border-b-slate-100 dark:border-b-white/[0.04]"
                                                    : "border-l-4 border-l-transparent border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                                }`}
                                        >
                                            {/* User Info */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {user.avatar}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                                            {user.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Penalty Level Badge */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${cfg.badge}`}
                                                >
                                                    {cfg.emoji} {cfg.label}
                                                </span>
                                            </td>

                                            {/* Reason */}
                                            <td className="px-5 py-4">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[260px] truncate">
                                                    {user.reason}
                                                </p>
                                            </td>

                                            {/* Expiry */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`text-xs font-medium whitespace-nowrap ${user.permanent
                                                            ? "text-red-500 dark:text-red-400"
                                                            : "text-slate-500 dark:text-slate-400"
                                                        }`}
                                                >
                                                    {user.expiry}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 justify-end">
                                                    {/* View History */}
                                                    <button
                                                        onClick={() => setHistoryModal(user)}
                                                        title="View History"
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all whitespace-nowrap"
                                                    >
                                                        <History size={12} /> History
                                                    </button>

                                                    {/* Revoke Strike */}
                                                    <button
                                                        title="Revoke Strike"
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 border border-transparent hover:border-green-200 dark:hover:border-green-500/20 transition-all whitespace-nowrap"
                                                    >
                                                        <Shield size={12} /> Revoke
                                                    </button>

                                                    {/* Escalate / Ban */}
                                                    <button
                                                        title="Escalate / Ban"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-600 text-white shadow-md shadow-red-500/30 hover:bg-red-700 transition-all whitespace-nowrap"
                                                    >
                                                        <Ban size={12} /> Ban
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
                    Showing {filteredUsers.length} of {MOCK_USERS.length} users
                </span>
                <span>StudyBuddy Admin · Moderation Panel</span>
            </div>

            {/* ════════ STRIKE HISTORY MODAL ════════ */}
            {historyModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setHistoryModal(null)}
                >
                    <div
                        className="relative w-full max-w-lg mx-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {historyModal.avatar}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        {historyModal.name}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                        {historyModal.username} · {historyModal.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setHistoryModal(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Body: Timeline */}
                        <div className="px-6 py-5 max-h-[400px] overflow-y-auto">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                                Offense Timeline
                            </h4>
                            <div className="relative pl-6">
                                {/* Timeline line */}
                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200 dark:bg-white/10" />

                                {historyModal.history.map((event, i) => (
                                    <div key={i} className="relative mb-5 last:mb-0">
                                        {/* Timeline dot */}
                                        <div
                                            className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#1a0f26] ${event.action.includes("Ban")
                                                    ? "bg-red-500"
                                                    : event.action.includes("Strike 2")
                                                        ? "bg-red-400"
                                                        : event.action.includes("Strike 1")
                                                            ? "bg-orange-400"
                                                            : "bg-yellow-400"
                                                }`}
                                        />

                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {event.action}
                                                </span>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                    {event.date}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {event.reason}
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                                By {event.moderator}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-white/10">
                            <button
                                onClick={() => setHistoryModal(null)}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
