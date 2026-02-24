"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    Swords,
    Target,
    Gift,
    Plus,
    Edit,
    Trash2,
    Clock,
    Zap,
    Coins,
    X,
    Flame,
    Users,
    Calendar,
    Sparkles,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type Frequency = "daily" | "weekly" | "one-time";

interface Challenge {
    id: string;
    title: string;
    description: string;
    frequency: Frequency;
    xpReward: number;
    coinReward: number;
    targetGoal: number;
    targetUnit: string;
    completedBy: number;
    totalEligible: number;
    active: boolean;
}

// ─── Frequency Config ───────────────────────────────────────────────────────────
const FREQ_CONFIG: Record<
    Frequency,
    { label: string; badge: string; Icon: React.ElementType }
> = {
    daily: {
        label: "Daily",
        badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25",
        Icon: Clock,
    },
    weekly: {
        label: "Weekly",
        badge: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/25",
        Icon: Calendar,
    },
    "one-time": {
        label: "Special Event",
        badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
        Icon: Sparkles,
    },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const INITIAL_CHALLENGES: Challenge[] = [
    {
        id: "c1",
        title: "Weekend Warrior",
        description: "Study for 5 hours over the weekend to earn bonus rewards.",
        frequency: "weekly",
        xpReward: 500,
        coinReward: 50,
        targetGoal: 5,
        targetUnit: "hours",
        completedBy: 1240,
        totalEligible: 3800,
        active: true,
    },
    {
        id: "c2",
        title: "Flashcard Frenzy",
        description: "Create and review 10 flashcard decks in a single day.",
        frequency: "daily",
        xpReward: 200,
        coinReward: 20,
        targetGoal: 10,
        targetUnit: "decks",
        completedBy: 876,
        totalEligible: 3800,
        active: true,
    },
    {
        id: "c3",
        title: "Helpful Mentor",
        description: "Answer 15 questions from fellow students this week.",
        frequency: "weekly",
        xpReward: 750,
        coinReward: 80,
        targetGoal: 15,
        targetUnit: "answers",
        completedBy: 312,
        totalEligible: 1100,
        active: true,
    },
    {
        id: "c4",
        title: "Launch Day Blitz",
        description: "Complete your first quiz and share your score during the launch event.",
        frequency: "one-time",
        xpReward: 1000,
        coinReward: 150,
        targetGoal: 1,
        targetUnit: "quiz",
        completedBy: 2045,
        totalEligible: 3800,
        active: false,
    },
];

// ─── Toggle Component ───────────────────────────────────────────────────────────
function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 ${checked
                    ? "bg-purple-600"
                    : "bg-slate-300 dark:bg-white/10"
                }`}
        >
            <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
            />
        </button>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function ChallengesManagementPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
    const [modal, setModal] = useState<"create" | Challenge | null>(null);

    // Form state
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formFreq, setFormFreq] = useState<Frequency>("daily");
    const [formXP, setFormXP] = useState(100);
    const [formCoins, setFormCoins] = useState(10);
    const [formTarget, setFormTarget] = useState(1);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    const openCreate = () => {
        setFormTitle("");
        setFormDesc("");
        setFormFreq("daily");
        setFormXP(100);
        setFormCoins(10);
        setFormTarget(1);
        setModal("create");
    };

    const openEdit = (c: Challenge) => {
        setFormTitle(c.title);
        setFormDesc(c.description);
        setFormFreq(c.frequency);
        setFormXP(c.xpReward);
        setFormCoins(c.coinReward);
        setFormTarget(c.targetGoal);
        setModal(c);
    };

    const handleToggle = (id: string, active: boolean) => {
        setChallenges((prev) =>
            prev.map((c) => (c.id === id ? { ...c, active } : c))
        );
    };

    const handleDelete = (id: string) => {
        setChallenges((prev) => prev.filter((c) => c.id !== id));
    };

    const activeCount = challenges.filter((c) => c.active).length;
    const totalCompleted = challenges.reduce((sum, c) => sum + c.completedBy, 0);
    const totalXPDistributed = challenges.reduce(
        (sum, c) => sum + c.completedBy * c.xpReward,
        0
    );

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-indigo-100 border border-indigo-200 text-indigo-600 dark:bg-indigo-500/15 dark:border-indigo-500/25 dark:text-indigo-400">
                        <Swords size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Challenges Management
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Create and manage daily/weekly tasks and their rewards.
                        </p>
                    </div>
                </div>

                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white shadow-md shadow-purple-500/30 hover:bg-purple-700 transition-all shrink-0"
                >
                    <Plus size={15} /> Create New Challenge
                </button>
            </div>

            {/* ════════ STAT CARDS ════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Active Challenges */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-purple-50/60 border-purple-200 dark:bg-purple-500/[0.08] dark:border-purple-500/20">
                    <div className="text-purple-500 dark:text-purple-400 shrink-0">
                        <Target size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            Active Challenges
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {activeCount}
                        </div>
                    </div>
                </div>

                {/* Total Completions */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-emerald-50/60 border-emerald-200 dark:bg-emerald-500/[0.08] dark:border-emerald-500/20">
                    <div className="text-emerald-500 dark:text-emerald-400 shrink-0">
                        <Users size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Total Completions
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {totalCompleted.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* XP Distributed */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-amber-50/60 border-amber-200 dark:bg-amber-500/[0.08] dark:border-amber-500/20">
                    <div className="text-amber-500 dark:text-amber-400 shrink-0">
                        <Gift size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            XP Distributed
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {totalXPDistributed.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ CHALLENGES GRID ════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {challenges.length === 0 ? (
                    <div className="col-span-full text-center py-20">
                        <Swords
                            size={42}
                            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                        />
                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                            No challenges yet.
                        </p>
                        <p className="text-xs text-slate-400/60 dark:text-slate-500/60 mt-1">
                            Create your first challenge to get started.
                        </p>
                    </div>
                ) : (
                    challenges.map((challenge) => {
                        const freq = FREQ_CONFIG[challenge.frequency];
                        const progress =
                            challenge.totalEligible > 0
                                ? Math.round(
                                    (challenge.completedBy / challenge.totalEligible) * 100
                                )
                                : 0;

                        return (
                            <div
                                key={challenge.id}
                                className={`group rounded-2xl border bg-white dark:bg-white/[0.02] flex flex-col transition-all hover:shadow-lg hover:shadow-purple-500/5 ${challenge.active
                                        ? "border-purple-300/60 dark:border-purple-500/30 shadow-sm"
                                        : "border-slate-200 dark:border-white/[0.06] opacity-75"
                                    }`}
                            >
                                {/* Card Header */}
                                <div className="px-5 pt-5 pb-3">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                {challenge.title}
                                            </h3>
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 inline-flex items-center gap-1 ${freq.badge}`}
                                        >
                                            <freq.Icon size={10} />
                                            {freq.label}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                                        {challenge.description}
                                    </p>
                                </div>

                                {/* Progress */}
                                <div className="px-5 pb-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                            Completed by{" "}
                                            <strong className="text-slate-600 dark:text-slate-300">
                                                {challenge.completedBy.toLocaleString()}
                                            </strong>{" "}
                                            users
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                            {progress}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${challenge.active
                                                    ? "bg-gradient-to-r from-purple-500 to-indigo-500"
                                                    : "bg-slate-300 dark:bg-white/10"
                                                }`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Rewards */}
                                <div className="px-5 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/15">
                                            <Zap size={11} className="shrink-0" />+
                                            {challenge.xpReward.toLocaleString()} XP
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/15">
                                            <Coins size={11} className="shrink-0" />+
                                            {challenge.coinReward} Coins
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-100 dark:bg-white/[0.03] dark:text-slate-400 dark:border-white/[0.06]">
                                            <Target size={10} className="shrink-0" />
                                            {challenge.targetGoal} {challenge.targetUnit}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="mt-auto px-5 py-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Toggle
                                            checked={challenge.active}
                                            onChange={(v) =>
                                                handleToggle(challenge.id, v)
                                            }
                                        />
                                        <span
                                            className={`text-[11px] font-semibold ${challenge.active
                                                    ? "text-purple-600 dark:text-purple-400"
                                                    : "text-slate-400 dark:text-slate-500"
                                                }`}
                                        >
                                            {challenge.active ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEdit(challenge)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(challenge.id)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                    {challenges.length} challenges · {activeCount} active
                </span>
                <span>StudyBuddy Admin · Challenges Panel</span>
            </div>

            {/* ════════ CREATE / EDIT MODAL ════════ */}
            {modal !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setModal(null)}
                >
                    <div
                        className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                                    {modal === "create" ? (
                                        <Plus size={16} />
                                    ) : (
                                        <Edit size={16} />
                                    )}
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {modal === "create"
                                        ? "Create New Challenge"
                                        : "Edit Challenge"}
                                </h3>
                            </div>
                            <button
                                onClick={() => setModal(null)}
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
                                    Challenge Title
                                </label>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="e.g. Weekend Warrior"
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    value={formDesc}
                                    onChange={(e) => setFormDesc(e.target.value)}
                                    placeholder="What should the student do?"
                                    rows={3}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors resize-none"
                                />
                            </div>

                            {/* Frequency */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    Frequency
                                </label>
                                <div className="flex gap-2">
                                    {(
                                        [
                                            { key: "daily", label: "Daily" },
                                            { key: "weekly", label: "Weekly" },
                                            { key: "one-time", label: "One-Time" },
                                        ] as const
                                    ).map((opt) => {
                                        const isActive = formFreq === opt.key;
                                        return (
                                            <button
                                                key={opt.key}
                                                onClick={() => setFormFreq(opt.key)}
                                                className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${isActive
                                                        ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20"
                                                        : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Rewards Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                        <span className="inline-flex items-center gap-1">
                                            <Zap size={13} className="text-purple-500" /> XP Reward
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formXP}
                                        onChange={(e) =>
                                            setFormXP(Number(e.target.value))
                                        }
                                        min={0}
                                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                        <span className="inline-flex items-center gap-1">
                                            <Coins size={13} className="text-amber-500" /> Coin
                                            Reward
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formCoins}
                                        onChange={(e) =>
                                            setFormCoins(Number(e.target.value))
                                        }
                                        min={0}
                                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>
                            </div>

                            {/* Target Goal */}
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                                    <span className="inline-flex items-center gap-1">
                                        <Target size={13} className="text-indigo-500" /> Target Goal
                                    </span>
                                </label>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                                    The number the student must reach (e.g. 5 for &quot;5 hours&quot;, 10 for &quot;10 flashcards&quot;).
                                </p>
                                <input
                                    type="number"
                                    value={formTarget}
                                    onChange={(e) =>
                                        setFormTarget(Number(e.target.value))
                                    }
                                    min={1}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 shrink-0">
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
                                {modal === "create" ? (
                                    <>
                                        <Plus size={14} /> Create Challenge
                                    </>
                                ) : (
                                    <>
                                        <Edit size={14} /> Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
