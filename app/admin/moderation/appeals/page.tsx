"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    Scale,
    CheckCircle,
    XCircle,
    MessageSquare,
    History,
    UserCheck,
    ShieldAlert,
    X,
    ChevronDown,
    Clock,
    FileText,
    AlertTriangle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type AppealStatus = "pending" | "approved" | "rejected";
type PenaltyType = "permanent_ban" | "strike2" | "strike1" | "suspension";

interface Appeal {
    id: string;
    userName: string;
    username: string;
    email: string;
    avatar: string;
    penalty: PenaltyType;
    originalReason: string;
    originalContent: string;
    appealMessage: string;
    dateSubmitted: string;
    status: AppealStatus;
}

// ─── Penalty Config ─────────────────────────────────────────────────────────────
const PENALTY_CONFIG: Record<
    PenaltyType,
    { label: string; badge: string }
> = {
    permanent_ban: {
        label: "Permanent Ban",
        badge:
            "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
    },
    strike2: {
        label: "Strike 2",
        badge:
            "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25",
    },
    strike1: {
        label: "Strike 1",
        badge:
            "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/25",
    },
    suspension: {
        label: "Temp Suspension",
        badge:
            "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
    },
};

const STATUS_CONFIG: Record<
    AppealStatus,
    { label: string; badge: string; Icon: React.ElementType }
> = {
    pending: {
        label: "Pending",
        badge:
            "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25",
        Icon: Clock,
    },
    approved: {
        label: "Approved",
        badge:
            "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25",
        Icon: CheckCircle,
    },
    rejected: {
        label: "Rejected",
        badge:
            "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
        Icon: XCircle,
    },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_APPEALS: Appeal[] = [
    {
        id: "a1",
        userName: "Jake Thompson",
        username: "@jake_cheater",
        email: "jake.t@email.com",
        avatar: "JT",
        penalty: "permanent_ban",
        originalReason:
            "Sharing copyrighted exam answers and encouraging academic dishonesty across multiple resource threads.",
        originalContent:
            "User uploaded 12 copyrighted exam papers from MIT OCW and Stanford's restricted materials portal. Also posted direct solutions to ongoing assignments in 3 active study groups.",
        appealMessage:
            "I sincerely apologize for my actions. I now understand that sharing copyrighted materials is harmful to the academic community. I was under immense pressure during finals and made a terrible decision. I have since deleted all my local copies and want to contribute positively to the platform. I promise to follow all community guidelines if given a second chance. I've been a member for 2 years and this was my first major offense until the escalation.",
        dateSubmitted: "2 hours ago",
        status: "pending",
    },
    {
        id: "a2",
        userName: "Elena Rodriguez",
        username: "@elena_spam",
        email: "elena.r@email.com",
        avatar: "ER",
        penalty: "strike2",
        originalReason:
            "Posting promotional spam links across multiple resource threads and study groups.",
        originalContent:
            "User posted identical promotional links to an external tutoring site in 8 different study group channels within a 2-hour window. Links redirected to a paid service unaffiliated with StudyBuddy.",
        appealMessage:
            "My account was compromised by someone who used it to post spam. I've since changed my password and enabled 2FA. I can provide proof that I was logged in from an IP address in a different country during the time the spam was posted. I've been a legitimate user for 6 months and have contributed 15 helpful resources. Please review my account activity before the incident to see my genuine contributions.",
        dateSubmitted: "5 hours ago",
        status: "pending",
    },
    {
        id: "a3",
        userName: "Marcus Cole",
        username: "@darkphoenix99",
        email: "marcus.c@email.com",
        avatar: "MC",
        penalty: "strike2",
        originalReason:
            "Repeated harassment in study group channels and targeted bullying of new members.",
        originalContent:
            "User made derogatory comments toward 3 new members in the Chemistry study group, including personal attacks on their academic ability. Also sent unsolicited DMs to 2 members with threatening language.",
        appealMessage:
            "I was going through a really rough patch personally and took it out on others in the community. That's not who I am. I've started seeing a counselor and I'm working on managing my anger. I want to apologize publicly to the members I hurt and would be willing to have restricted messaging privileges if that helps rebuild trust. I genuinely love this platform and the study communities here.",
        dateSubmitted: "1 day ago",
        status: "pending",
    },
    {
        id: "a4",
        userName: "David Park",
        username: "@david_park",
        email: "david.p@email.com",
        avatar: "DP",
        penalty: "suspension",
        originalReason: "Multiple off-topic posts and disruption of study sessions.",
        originalContent:
            "User repeatedly posted memes and off-topic content in active study sessions, despite 2 prior warnings from moderators. Disrupted a live calculus tutoring session by spamming the chat.",
        appealMessage:
            "I understand I was being disruptive. I didn't realize how seriously it affected other students' learning. I'll keep all my posts on-topic going forward and I won't interrupt live sessions again.",
        dateSubmitted: "3 days ago",
        status: "rejected",
    },
];

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function AppealsManagementPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");
    const [reviewModal, setReviewModal] = useState<Appeal | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const pendingAppeals = MOCK_APPEALS.filter((a) => a.status === "pending");
    const resolvedAppeals = MOCK_APPEALS.filter((a) => a.status !== "pending");

    const displayedAppeals =
        activeTab === "pending" ? pendingAppeals : resolvedAppeals;

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-indigo-100 border border-indigo-200 text-indigo-600 dark:bg-indigo-500/15 dark:border-indigo-500/25 dark:text-indigo-400">
                        <Scale size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Ban &amp; Strike Appeals
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Review appeals from users requesting to lift their penalties.
                        </p>
                    </div>
                </div>
            </div>

            {/* ════════ STAT CARDS ════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Pending Appeals */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-orange-50/60 border-orange-200 dark:bg-orange-500/[0.08] dark:border-orange-500/20">
                    <div className="text-orange-500 dark:text-orange-400 shrink-0">
                        <Scale size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            Pending Appeals
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {pendingAppeals.length}
                        </div>
                    </div>
                </div>

                {/* Approved / Lifted */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-emerald-50/60 border-emerald-200 dark:bg-emerald-500/[0.08] dark:border-emerald-500/20">
                    <div className="text-emerald-500 dark:text-emerald-400 shrink-0">
                        <UserCheck size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Approved / Lifted
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            7
                        </div>
                    </div>
                </div>

                {/* Rejected */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-red-50/60 border-red-200 dark:bg-red-500/[0.08] dark:border-red-500/20">
                    <div className="text-red-500 dark:text-red-400 shrink-0">
                        <XCircle size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                            Rejected
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {resolvedAppeals.filter((a) => a.status === "rejected").length}
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ TABS ════════ */}
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 w-fit">
                {(
                    [
                        { key: "pending", label: "Pending Review", count: pendingAppeals.length },
                        { key: "resolved", label: "Resolved Appeals", count: resolvedAppeals.length },
                    ] as const
                ).map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${isActive
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            {tab.label}
                            <span
                                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${isActive
                                        ? "bg-white/20 text-white"
                                        : "bg-slate-200 text-slate-500 dark:bg-white/[0.06] dark:text-slate-500"
                                    }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ════════ DATA TABLE ════════ */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px]">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    User
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Original Penalty
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Appeal Message
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Submitted
                                </th>
                                {activeTab === "resolved" && (
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Outcome
                                    </th>
                                )}
                                <th className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedAppeals.length === 0 ? (
                                <tr>
                                    <td colSpan={activeTab === "resolved" ? 6 : 5} className="text-center py-16">
                                        <Scale
                                            size={36}
                                            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                                        />
                                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                            No {activeTab === "pending" ? "pending" : "resolved"} appeals.
                                        </p>
                                        <p className="text-xs text-slate-400/60 dark:text-slate-500/60 mt-1">
                                            {activeTab === "pending"
                                                ? "All caught up! No appeals awaiting review."
                                                : "Resolved appeals will appear here."}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                displayedAppeals.map((appeal) => {
                                    const penaltyCfg = PENALTY_CONFIG[appeal.penalty];
                                    const statusCfg = STATUS_CONFIG[appeal.status];
                                    const isBan = appeal.penalty === "permanent_ban";

                                    return (
                                        <tr
                                            key={appeal.id}
                                            className={`border-b last:border-b-0 transition-colors ${isBan
                                                    ? "bg-red-50/50 dark:bg-red-950/15 border-l-4 border-l-red-500 border-b-slate-100 dark:border-b-white/[0.04]"
                                                    : "border-l-4 border-l-transparent border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                                }`}
                                        >
                                            {/* User Info */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {appeal.avatar}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {appeal.userName}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                                            {appeal.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Original Penalty */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${penaltyCfg.badge}`}
                                                >
                                                    {penaltyCfg.label}
                                                </span>
                                            </td>

                                            {/* Appeal Message (truncated) */}
                                            <td className="px-5 py-4">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] truncate">
                                                    {appeal.appealMessage}
                                                </p>
                                            </td>

                                            {/* Date Submitted */}
                                            <td className="px-5 py-4">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {appeal.dateSubmitted}
                                                </span>
                                            </td>

                                            {/* Outcome (resolved tab only) */}
                                            {activeTab === "resolved" && (
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${statusCfg.badge}`}
                                                    >
                                                        <statusCfg.Icon size={11} />
                                                        {statusCfg.label}
                                                    </span>
                                                </td>
                                            )}

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button
                                                        onClick={() => setReviewModal(appeal)}
                                                        title="Review Appeal"
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all whitespace-nowrap"
                                                    >
                                                        <MessageSquare size={12} /> Review
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
                    Showing {displayedAppeals.length} of {MOCK_APPEALS.length} appeals
                </span>
                <span>StudyBuddy Admin · Appeals Panel</span>
            </div>

            {/* ════════ REVIEW MODAL ════════ */}
            {reviewModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setReviewModal(null)}
                >
                    <div
                        className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {reviewModal.avatar}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Appeal from {reviewModal.userName}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                        {reviewModal.username} · {reviewModal.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${PENALTY_CONFIG[reviewModal.penalty].badge}`}
                                >
                                    {PENALTY_CONFIG[reviewModal.penalty].label}
                                </span>
                                <button
                                    onClick={() => setReviewModal(null)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body: Two Columns */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/10">
                                {/* Left Column: Original Offense */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                                            <ShieldAlert size={14} />
                                        </div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            Original Offense
                                        </h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                                                Reason
                                            </label>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3 border border-slate-200 dark:border-white/[0.06]">
                                                {reviewModal.originalReason}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                                                Reported Content / Details
                                            </label>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3 border border-slate-200 dark:border-white/[0.06]">
                                                {reviewModal.originalContent}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: User's Appeal */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                                            <MessageSquare size={14} />
                                        </div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            User&apos;s Appeal
                                        </h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                                                Appeal Message
                                            </label>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-indigo-50/50 dark:bg-indigo-500/[0.04] rounded-xl p-3 border border-indigo-100 dark:border-indigo-500/10">
                                                {reviewModal.appealMessage}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                                                Submitted
                                            </label>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <Clock size={13} /> {reviewModal.dateSubmitted}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer: Action Buttons */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 shrink-0">
                            <button
                                onClick={() => setReviewModal(null)}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                                Close
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setReviewModal(null)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white shadow-md shadow-red-500/30 hover:bg-red-700 transition-all"
                                >
                                    <XCircle size={14} /> Reject Appeal
                                </button>
                                <button
                                    onClick={() => setReviewModal(null)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-700 transition-all"
                                >
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
