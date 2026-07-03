"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { PRICING_PLANS, calculateYearlyPrice } from "@/lib/pricingConfig";

// ─── Types ──────────────────────────────────────────────────────────────────────
type PlanTier = "free" | "pro" | "elite";
type TxStatus = "success" | "refunded" | "failed";

// Note: we remap PricingPlanConfig to match the local PricingPlan interface structure for UI rendering
interface PricingPlan {
    tier: PlanTier;
    title: string;
    price: string;
    period: string;
    activeUsers: number;
    features: string[];
    highlight?: boolean;
    rawPrice: number;
}

interface Transaction {
    id: string;
    user: string;
    email: string;
    image: string;
    avatar: string;
    plan: string;
    amount: string;
    date: string;
    status: TxStatus;
}

interface MonetizationStats {
    freeCount: number;
    proCount: number;
    eliteCount: number;
    activePaidSubscriptions: number;
    monthlyRecurringRevenue: number;
    prices: {
        pro: number;
        elite: number;
    };
}

const EMPTY_STATS: MonetizationStats = {
    freeCount: 0,
    proCount: 0,
    eliteCount: 0,
    activePaidSubscriptions: 0,
    monthlyRecurringRevenue: 0,
    prices: {
        pro: 9.99,
        elite: 24.99,
    },
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en", {
        style: "currency",
        currency: "USD",
    }).format(value);
}

function formatTransactionDate(value?: string) {
    if (!value) return "Unknown";

    return new Date(value).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U";
}

function normalizeStatus(status: string): TxStatus {
    const normalized = status.toLowerCase();

    if (normalized === "failed") return "failed";
    if (normalized === "refunded") return "refunded";
    return "success";
}

// --- Status Config --------------------------------------------------------------
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


// ─── Plan Card Styles ───────────────────────────────────────────────────────────
const TIER_STYLES: Record<
    PlanTier,
    { border: string; icon: React.ElementType; iconColor: string; bg: string }
> = {
    free: {
        border: "border-slate-200 dark:border-white/[0.06]",
        icon: Users,
        iconColor: "text-slate-500 dark:text-slate-400",
        bg: "bg-slate-500",
    },
    pro: {
        border: "border-purple-300/60 dark:border-purple-500/30",
        icon: Sparkles,
        iconColor: "text-purple-500 dark:text-purple-400",
        bg: "bg-[#7C3AED]",
    },
    elite: {
        border: "border-amber-400/50 dark:border-amber-500/30",
        icon: Crown,
        iconColor: "text-amber-500 dark:text-amber-400",
        bg: "bg-amber-500",
    },
};

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function MonetizationPage() {
    const [mounted, setMounted] = useState(false);
    const [editModal, setEditModal] = useState<PricingPlan | null>(null);
    const [stats, setStats] = useState<MonetizationStats>(EMPTY_STATS);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
    const [dbPlans, setDbPlans] = useState<PricingPlan[]>([]);
    const [editTitle, setEditTitle] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editFeatures, setEditFeatures] = useState<string[]>([]);
    const [isSavingPlan, setIsSavingPlan] = useState(false);

    useEffect(() => {
        setMounted(true);
        let active = true;

        async function fetchStats() {
            try {
                setIsLoadingStats(true);
                const response = await fetch("/api/admin/monetization/stats", {
                    cache: "no-store",
                });
                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(data?.message || "Failed to load monetization stats.");
                }

                if (active) {
                    setStats({
                        ...EMPTY_STATS,
                        ...data,
                        prices: {
                            ...EMPTY_STATS.prices,
                            ...(data?.prices || {}),
                        },
                    });
                }
            } catch (error) {
                if (active) {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : "Failed to load monetization stats."
                    );
                }
            } finally {
                if (active) {
                    setIsLoadingStats(false);
                }
            }
        }

        async function fetchTransactions() {
            try {
                setIsLoadingTransactions(true);
                const response = await fetch("/api/admin/monetization/transactions", {
                    cache: "no-store",
                });
                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(data?.message || "Failed to load transactions.");
                }

                if (active) {
                    setTransactions(
                        (data?.transactions || []).map((transaction: any) => {
                            const name = transaction?.user?.name || "Unknown User";

                            return {
                                id: `TXN-${String(transaction.id || "").slice(-6).toUpperCase()}`,
                                user: name,
                                email: transaction?.user?.email || "No email",
                                image: transaction?.user?.image || "",
                                avatar: getInitials(name),
                                plan: transaction.plan || "Free",
                                amount: formatCurrency(Number(transaction.amount || 0)),
                                date: formatTransactionDate(transaction.createdAt),
                                status: normalizeStatus(transaction.status || "Success"),
                            };
                        })
                    );
                }
            } catch (error) {
                if (active) {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : "Failed to load transactions."
                    );
                }
            } finally {
                if (active) {
                    setIsLoadingTransactions(false);
                }
            }
        }

        async function fetchPlans() {
            try {
                const response = await fetch("/api/admin/subscription-plans", {
                    cache: "no-store",
                });
                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(data?.message || "Failed to load subscription plans.");
                }

                if (active && Array.isArray(data?.plans)) {
                    setDbPlans(
                        data.plans.map((plan: any) => ({
                            tier: plan.id,
                            title: plan.name,
                            price: plan.displayPrice,
                            period: "/month",
                            activeUsers: 0,
                            features: Array.isArray(plan.features) ? plan.features : [],
                            highlight: Boolean(plan.featured),
                            rawPrice: Number(plan.price) || 0,
                        }))
                    );
                }
            } catch (error) {
                if (active) {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : "Failed to load subscription plans."
                    );
                }
            }
        }

        void fetchStats();
        void fetchTransactions();
        void fetchPlans();

        return () => {
            active = false;
        };
    }, []);

    const [isYearly, setIsYearly] = useState(false);

    // Merge activeUsers from stats into plans
    const plansToDisplay = (dbPlans.length > 0 ? dbPlans : PRICING_PLANS.map(p => ({
        tier: p.id as PlanTier,
        title: p.name,
        price: p.displayPrice,
        period: "/month",
        activeUsers: 0,
        features: p.features,
        highlight: p.featured,
        rawPrice: p.price
    }))).map((plan) => {
        let users = 0;
        if (plan.tier === "free") users = stats.freeCount;
        if (plan.tier === "pro") users = stats.proCount;
        if (plan.tier === "elite") users = stats.eliteCount;
        
        return {
            ...plan,
            activeUsers: users || plan.activeUsers,
        };
    });

    useEffect(() => {
        if (!editModal) return;
        setEditTitle(editModal.title);
        setEditPrice(editModal.price.replace(/[^0-9.]/g, ""));
        setEditFeatures(editModal.features);
    }, [editModal]);

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    const savePlan = async () => {
        if (!editModal) return;

        try {
            setIsSavingPlan(true);
            const response = await fetch("/api/admin/subscription-plans", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tier: editModal.tier,
                    price: Number(editPrice || 0),
                    features: editFeatures,
                }),
            });
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.message || "Failed to save subscription plan.");
            }

            setDbPlans((current) =>
                current.map((plan) =>
                    plan.tier === editModal.tier
                        ? {
                              ...plan,
                              title: data?.plan?.name || editTitle,
                              price: data?.plan?.displayPrice || formatCurrency(Number(editPrice || 0)),
                              features: data?.plan?.features || editFeatures,
                              highlight: Boolean(data?.plan?.featured),
                          }
                        : plan
                )
            );
            toast.success("Subscription plan updated.");
            setEditModal(null);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to save subscription plan."
            );
        } finally {
            setIsSavingPlan(false);
        }
    };

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
                            {isLoadingStats
                                ? "..."
                                : formatCurrency(stats.monthlyRecurringRevenue)}
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
                            {isLoadingStats
                                ? "..."
                                : stats.activePaidSubscriptions.toLocaleString()}
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
                            {isLoadingTransactions
                                ? "..."
                                : transactions.length.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ SUBSCRIPTION TIERS ════════ */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Settings size={14} className="text-slate-400 dark:text-slate-500" />
                        Subscription Tiers
                    </h2>
                    <div className="flex items-center gap-3 text-sm font-medium bg-slate-50 dark:bg-white/[0.02] p-1 rounded-xl border border-slate-200 dark:border-white/[0.05]">
                        <button
                            onClick={() => setIsYearly(false)}
                            className={`px-3 py-1.5 rounded-lg transition-all ${!isYearly ? "bg-white dark:bg-white/[0.05] shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${isYearly ? "bg-white dark:bg-white/[0.05] shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
                        >
                            Yearly
                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                -20%
                            </span>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plansToDisplay.map((plan) => {
                        const style = TIER_STYLES[plan.tier];
                        const TierIcon = style.icon;
                        
                        const calculatedPrice = isYearly ? calculateYearlyPrice(plan.rawPrice || 0) : (plan.rawPrice || 0);
                        const displayPrice = plan.rawPrice === 0 ? "Free" : `$${calculatedPrice.toFixed(2)}`;
                        const displayPeriod = plan.rawPrice === 0 ? "forever" : "/month";

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
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#7C3AED] text-white shadow-md shadow-purple-500/30">
                                        Most Popular
                                    </div>
                                )}

                                <div className="px-5 pt-6 pb-4">
                                    {/* Tier Icon & Title */}
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${style.bg} text-white shrink-0`}
                                        >
                                            <TierIcon size={16} />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {plan.title}
                                        </h3>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                                {displayPrice}
                                            </span>
                                            <span className="text-sm text-slate-400 dark:text-slate-500">
                                                {displayPeriod}
                                            </span>
                                        </div>
                                        {isYearly && plan.rawPrice > 0 && (
                                            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                                                Billed ${(calculatedPrice * 12).toFixed(2)}/year
                                            </div>
                                        )}
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
                                {isLoadingTransactions ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center text-sm text-slate-400 dark:text-slate-500"
                                        >
                                            Loading transactions...
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center text-sm text-slate-400 dark:text-slate-500"
                                        >
                                            No transactions recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => {
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
                                                    <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden">
                                                        {tx.image ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={tx.image}
                                                                alt={`${tx.user} profile picture`}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            tx.avatar
                                                        )}
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
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                    {plansToDisplay.length} plans · {transactions.length} recent transactions
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
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${TIER_STYLES[editModal.tier].bg
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
                                    value={editTitle}
                                    onChange={(event) => setEditTitle(event.target.value)}
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
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={editPrice}
                                    onChange={(event) => setEditPrice(event.target.value)}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                                />
                            </div>

                            {/* Features */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    Top Features
                                </label>
                                <div className="space-y-2">
                                    {editFeatures.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600 w-4 shrink-0">
                                                {i + 1}.
                                            </span>
                                            <input
                                                type="text"
                                                value={f}
                                                onChange={(event) =>
                                                    setEditFeatures((current) =>
                                                        current.map((feature, index) =>
                                                            index === i ? event.target.value : feature
                                                        )
                                                    )
                                                }
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
                                onClick={() => void savePlan()}
                                disabled={isSavingPlan}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-[#7C3AED] text-white shadow-md shadow-purple-500/30 hover:opacity-90 transition-all"
                            >
                                <Check size={14} /> {isSavingPlan ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

