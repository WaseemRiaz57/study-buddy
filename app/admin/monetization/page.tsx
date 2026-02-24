"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    CreditCard,
    TrendingUp,
    Users,
    DollarSign,
    Edit,
    Check,
    Settings,
    ArrowRight,
    X,
    Sparkles,
    Crown,
    Zap,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type PlanTier = "free" | "pro" | "elite";
type TxStatus = "success" | "refunded" | "failed";

interface PricingPlan {
    tier: PlanTier;
    title: string;
    price: string;
    period: string;
    activeUsers: number;
    features: string[];
    highlight?: boolean;
}

interface Transaction {
    id: string;
    user: string;
    email: string;
    avatar: string;
    plan: string;
    amount: string;
    date: string;
    status: TxStatus;
}

// ─── Status Config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
    TxStatus,
    { label: string; emoji: string; badge: string }
> = {
    success: {
        label: "Success",
        emoji: "✅",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25",
    },
    refunded: {
        label: "Refunded",
        emoji: "↩️",
        badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
    },
    failed: {
        label: "Failed",
        emoji: "❌",
        badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
    },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const PLANS: PricingPlan[] = [
    {
        tier: "free",
        title: "Free",
        price: "$0",
        period: "forever",
        activeUsers: 8420,
        features: [
            "Access to public study groups",
            "Basic flashcard creation (up to 50)",
            "Community Q&A participation",
        ],
    },
    {
        tier: "pro",
        title: "Pro Member 🌟",
        price: "$9.99",
        period: "/month",
        activeUsers: 1340,
        features: [
            "Unlimited flashcards & quizzes",
            "AI-powered study recommendations",
            "Priority mentor matching",
        ],
    },
    {
        tier: "elite",
        title: "Elite 👑",
        price: "$24.99",
        period: "/month",
        activeUsers: 287,
        features: [
            "Everything in Pro",
            "1-on-1 live mentor sessions",
            "Custom learning paths & analytics",
        ],
        highlight: true,
    },
];

const TRANSACTIONS: Transaction[] = [
    {
        id: "TXN-4829",
        user: "Sophia Zhang",
        email: "sophia.z@uni.edu",
        avatar: "SZ",
        plan: "Elite",
        amount: "$24.99",
        date: "Feb 23, 2026",
        status: "success",
    },
    {
        id: "TXN-4828",
        user: "Alex Nguyen",
        email: "alex.n@gmail.com",
        avatar: "AN",
        plan: "Pro",
        amount: "$9.99",
        date: "Feb 23, 2026",
        status: "success",
    },
    {
        id: "TXN-4827",
        user: "Jordan Williams",
        email: "j.williams@mail.com",
        avatar: "JW",
        plan: "Pro",
        amount: "$9.99",
        date: "Feb 22, 2026",
        status: "refunded",
    },
    {
        id: "TXN-4826",
        user: "Priya Sharma",
        email: "priya.s@outlook.com",
        avatar: "PS",
        plan: "Elite",
        amount: "$24.99",
        date: "Feb 22, 2026",
        status: "success",
    },
    {
        id: "TXN-4825",
        user: "Liam O'Brien",
        email: "liam.ob@techmail.io",
        avatar: "LO",
        plan: "Pro",
        amount: "$9.99",
        date: "Feb 21, 2026",
        status: "failed",
    },
];

// ─── Plan Card Styles ───────────────────────────────────────────────────────────
const TIER_STYLES: Record<
    PlanTier,
    { border: string; icon: React.ElementType; iconColor: string; gradient: string }
> = {
    free: {
        border: "border-slate-200 dark:border-white/[0.06]",
        icon: Users,
        iconColor: "text-slate-500 dark:text-slate-400",
        gradient: "from-slate-400 to-slate-500",
    },
    pro: {
        border: "border-purple-300/60 dark:border-purple-500/30",
        icon: Sparkles,
        iconColor: "text-purple-500 dark:text-purple-400",
        gradient: "from-purple-500 to-indigo-500",
    },
    elite: {
        border: "border-amber-400/50 dark:border-amber-500/30",
        icon: Crown,
        iconColor: "text-amber-500 dark:text-amber-400",
        gradient: "from-amber-400 to-yellow-600",
    },
};

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function MonetizationPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [editModal, setEditModal] = useState<PricingPlan | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-emerald-100 border border-emerald-200 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-500/25 dark:text-emerald-400">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Monetization &amp; Plans
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage subscription tiers, track revenue, and view transactions.
                        </p>
                    </div>
                </div>
            </div>

            {/* ════════ STAT CARDS ════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* MRR */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-emerald-50/60 border-emerald-200 dark:bg-emerald-500/[0.08] dark:border-emerald-500/20">
                    <div className="text-emerald-500 dark:text-emerald-400 shrink-0">
                        <DollarSign size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Monthly Recurring Revenue
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            $12,450
                        </div>
                    </div>
                </div>

                {/* Active Pro/Elite Subs */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-sky-50/60 border-sky-200 dark:bg-sky-500/[0.08] dark:border-sky-500/20">
                    <div className="text-sky-500 dark:text-sky-400 shrink-0">
                        <Users size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                            Active Pro / Elite Subs
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            1,627
                        </div>
                    </div>
                </div>

                {/* Total Transactions */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-purple-50/60 border-purple-200 dark:bg-purple-500/[0.08] dark:border-purple-500/20">
                    <div className="text-purple-500 dark:text-purple-400 shrink-0">
                        <TrendingUp size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            Total Transactions
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            4,829
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ SUBSCRIPTION TIERS ════════ */}
            <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Settings size={14} className="text-slate-400 dark:text-slate-500" />
                    Subscription Tiers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PLANS.map((plan) => {
                        const style = TIER_STYLES[plan.tier];
                        const TierIcon = style.icon;

                        return (
                            <div
                                key={plan.tier}
                                className={`relative group rounded-2xl border bg-white dark:bg-white/[0.02] flex flex-col transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/5 ${plan.highlight
                                        ? `${style.border} shadow-md shadow-amber-500/10 dark:bg-amber-950/10`
                                        : style.border
                                    }`}
                            >
                                {/* Highlight banner */}
                                {plan.highlight && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-500/30">
                                        Most Popular
                                    </div>
                                )}

                                <div className="px-5 pt-6 pb-4">
                                    {/* Tier Icon & Title */}
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${style.gradient} text-white shrink-0`}
                                        >
                                            <TierIcon size={16} />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {plan.title}
                                        </h3>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-4">
                                        <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                            {plan.price}
                                        </span>
                                        <span className="text-sm text-slate-400 dark:text-slate-500 ml-1">
                                            {plan.period}
                                        </span>
                                    </div>

                                    {/* Active Users */}
                                    <div className="flex items-center gap-1.5 mb-4">
                                        <Users
                                            size={12}
                                            className="text-slate-400 dark:text-slate-500"
                                        />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            <strong className="text-slate-700 dark:text-slate-300">
                                                {plan.activeUsers.toLocaleString()}
                                            </strong>{" "}
                                            active users
                                        </span>
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-2">
                                        {plan.features.map((feature, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
                                            >
                                                <Check
                                                    size={13}
                                                    className={`mt-0.5 shrink-0 ${plan.tier === "elite"
                                                            ? "text-amber-500"
                                                            : plan.tier === "pro"
                                                                ? "text-purple-500"
                                                                : "text-emerald-500"
                                                        }`}
                                                />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Edit Button */}
                                <div className="mt-auto px-5 py-3 border-t border-slate-100 dark:border-white/[0.06]">
                                    <button
                                        onClick={() => setEditModal(plan)}
                                        className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${plan.highlight
                                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-500/20"
                                                : "bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                                            }`}
                                    >
                                        <Edit size={12} /> Edit Plan
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ════════ RECENT TRANSACTIONS ════════ */}
            <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <CreditCard size={14} className="text-slate-400 dark:text-slate-500" />
                    Recent Transactions
                </h2>
                <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Transaction ID
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        User
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Plan
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Amount
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Date
                                    </th>
                                    <th className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {TRANSACTIONS.map((tx) => {
                                    const status = STATUS_CONFIG[tx.status];

                                    return (
                                        <tr
                                            key={tx.id}
                                            className="border-b last:border-b-0 border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            {/* Transaction ID */}
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                                                    {tx.id}
                                                </span>
                                            </td>

                                            {/* User */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                                        {tx.avatar}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {tx.user}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                                            {tx.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Plan */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tx.plan === "Elite"
                                                            ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25"
                                                            : "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/25"
                                                        }`}
                                                >
                                                    {tx.plan}
                                                </span>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {tx.amount}
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-4">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {tx.date}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <div className="flex justify-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.badge}`}
                                                    >
                                                        {status.emoji} {status.label}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                    {PLANS.length} plans · {TRANSACTIONS.length} recent transactions
                </span>
                <span>StudyBuddy Admin · Monetization Panel</span>
            </div>

            {/* ════════ EDIT PLAN MODAL ════════ */}
            {editModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setEditModal(null)}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${TIER_STYLES[editModal.tier].gradient
                                        } text-white shrink-0`}
                                >
                                    <Edit size={15} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Edit Plan — {editModal.title}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                        {editModal.activeUsers.toLocaleString()} active subscribers
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditModal(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4">
                            {/* Plan Name */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    Plan Name
                                </label>
                                <input
                                    type="text"
                                    defaultValue={editModal.title}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    <span className="inline-flex items-center gap-1">
                                        <DollarSign size={13} className="text-emerald-500" />
                                        Monthly Price
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    defaultValue={editModal.price}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                                />
                            </div>

                            {/* Features */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    Top Features
                                </label>
                                <div className="space-y-2">
                                    {editModal.features.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600 w-4 shrink-0">
                                                {i + 1}.
                                            </span>
                                            <input
                                                type="text"
                                                defaultValue={f}
                                                className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Info Notice */}
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/[0.06] p-3 border border-amber-100 dark:border-amber-500/10">
                                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed flex items-start gap-2">
                                    <Zap size={13} className="shrink-0 mt-0.5" />
                                    Changes go live immediately. Existing subscribers keep their
                                    current price until their next billing cycle.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10">
                            <button
                                onClick={() => setEditModal(null)}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setEditModal(null)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/30 hover:bg-purple-700 transition-all"
                            >
                                <Check size={14} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
