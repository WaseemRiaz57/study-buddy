"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    ShieldCheck,
    AlertOctagon,
    Type,
    Bot,
    Save,
    Zap,
    Filter,
    Shield,
} from "lucide-react";

// ─── Custom Toggle Component ────────────────────────────────────────────────────
function Toggle({
    enabled,
    onToggle,
}: {
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1a0f26] ${enabled
                    ? "bg-purple-600"
                    : "bg-slate-200 dark:bg-white/10"
                }`}
            aria-pressed={enabled}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0"
                    }`}
            />
        </button>
    );
}

// ─── Settings Card Wrapper ──────────────────────────────────────────────────────
function SettingsCard({
    icon: Icon,
    iconColor,
    title,
    description,
    children,
}: {
    icon: React.ElementType;
    iconColor: string;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-white/[0.04]">
                <div
                    className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${iconColor}`}
                >
                    <Icon size={17} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {title}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {description}
                    </p>
                </div>
            </div>
            {/* Card Body */}
            <div className="px-6 py-5 space-y-5">{children}</div>
        </div>
    );
}

// ─── Toggle Row ─────────────────────────────────────────────────────────────────
function ToggleRow({
    label,
    description,
    enabled,
    onToggle,
    tag,
}: {
    label: string;
    description?: string;
    enabled: boolean;
    onToggle: () => void;
    tag?: { text: string; color: string };
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-1">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {label}
                    </p>
                    {tag && (
                        <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${tag.color}`}
                        >
                            {tag.text}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            <Toggle enabled={enabled} onToggle={onToggle} />
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function AutoModSettingsPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Strike Automation
    const [autoBanAfter3, setAutoBanAfter3] = useState(true);
    const [strikeExpiry, setStrikeExpiry] = useState("30");

    // AI Content Scanner
    const [flagLowConfidence, setFlagLowConfidence] = useState(true);
    const [haltBlacklisted, setHaltBlacklisted] = useState(false);

    // Keyword & Spam Filter
    const [keywords, setKeywords] = useState(
        "hack, cheat, promo, buy-followers, free-coins, exploit, crack, keygen"
    );
    const [spamSensitivity, setSpamSensitivity] = useState(70);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    const sensitivityLabel =
        spamSensitivity >= 80
            ? "Very High"
            : spamSensitivity >= 60
                ? "High"
                : spamSensitivity >= 40
                    ? "Medium"
                    : spamSensitivity >= 20
                        ? "Low"
                        : "Very Low";

    const sensitivityColor =
        spamSensitivity >= 80
            ? "text-red-500 dark:text-red-400"
            : spamSensitivity >= 60
                ? "text-orange-500 dark:text-orange-400"
                : spamSensitivity >= 40
                    ? "text-yellow-500 dark:text-yellow-400"
                    : "text-emerald-500 dark:text-emerald-400";

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-emerald-100 border border-emerald-200 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-500/25 dark:text-emerald-400">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Automated Moderation Settings
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Configure rules for auto-flagging and automated penalties.
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white shadow-md shadow-purple-500/30 hover:bg-purple-700 transition-all shrink-0">
                    <Save size={15} /> Save Changes
                </button>
            </div>

            {/* ════════ CARD 1: STRIKE AUTOMATION ════════ */}
            <SettingsCard
                icon={Zap}
                iconColor="bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
                title="Strike Automation"
                description="Configure automatic escalation and expiry rules for user strikes."
            >
                <ToggleRow
                    label="Automatically ban users after 3 strikes"
                    description="When enabled, users who accumulate 3 strikes will be permanently banned without manual intervention."
                    enabled={autoBanAfter3}
                    onToggle={() => setAutoBanAfter3(!autoBanAfter3)}
                    tag={{
                        text: "Recommended",
                        color:
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
                    }}
                />

                <div className="border-t border-slate-100 dark:border-white/[0.04] pt-5">
                    <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                        Strike expiry duration
                    </label>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                        How long a strike remains active on a user&apos;s record before it
                        automatically expires.
                    </p>
                    <div className="relative w-full sm:w-64">
                        <select
                            value={strikeExpiry}
                            onChange={(e) => setStrikeExpiry(e.target.value)}
                            className="w-full appearance-none pl-3 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                        >
                            <option value="30">30 Days</option>
                            <option value="60">60 Days</option>
                            <option value="90">90 Days</option>
                            <option value="never">Never (Permanent)</option>
                        </select>
                        <svg
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </div>
                </div>
            </SettingsCard>

            {/* ════════ CARD 2: AI CONTENT SCANNER ════════ */}
            <SettingsCard
                icon={Bot}
                iconColor="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
                title="AI Content Scanner"
                description="Control how AI-generated content is analyzed and moderated."
            >
                <ToggleRow
                    label="Auto-flag AI outputs with < 50% confidence score"
                    description="Generated content that scores below the confidence threshold will be flagged for manual review before publishing."
                    enabled={flagLowConfidence}
                    onToggle={() => setFlagLowConfidence(!flagLowConfidence)}
                    tag={{
                        text: "AI Guard",
                        color:
                            "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
                    }}
                />

                <div className="border-t border-slate-100 dark:border-white/[0.04] pt-5">
                    <ToggleRow
                        label="Halt generation for blacklisted keywords"
                        description="Immediately stop AI content generation if any restricted keyword from the blocklist is detected in the prompt or output."
                        enabled={haltBlacklisted}
                        onToggle={() => setHaltBlacklisted(!haltBlacklisted)}
                        tag={{
                            text: "Strict",
                            color:
                                "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
                        }}
                    />
                </div>
            </SettingsCard>

            {/* ════════ CARD 3: KEYWORD & SPAM FILTER ════════ */}
            <SettingsCard
                icon={Filter}
                iconColor="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
                title="Keyword & Spam Filter"
                description="Manage the global blocklist and spam detection sensitivity."
            >
                {/* Restricted Keywords */}
                <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-white block mb-1.5">
                        Restricted Keywords
                    </label>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                        Comma-separated list of words that will be automatically flagged
                        across all posts, comments, and resources.
                    </p>
                    <textarea
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors resize-none font-mono leading-relaxed"
                        placeholder="Enter restricted keywords, separated by commas..."
                    />
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {keywords
                                .split(",")
                                .filter((k) => k.trim()).length}{" "}
                            keywords active
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            Applied globally
                        </span>
                    </div>
                </div>

                {/* Spam Detection Threshold */}
                <div className="border-t border-slate-100 dark:border-white/[0.04] pt-5">
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                            Spam Detection Threshold
                        </label>
                        <span
                            className={`text-xs font-bold ${sensitivityColor}`}
                        >
                            {sensitivityLabel} ({spamSensitivity}%)
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                        Higher sensitivity catches more spam but may produce false
                        positives. Lower sensitivity reduces noise but may miss subtle spam.
                    </p>

                    {/* Range Slider */}
                    <div className="space-y-3">
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={spamSensitivity}
                            onChange={(e) => setSpamSensitivity(Number(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-white/10 accent-purple-600"
                        />
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            <span>Low Sensitivity</span>
                            <span>High Sensitivity</span>
                        </div>
                    </div>
                </div>
            </SettingsCard>

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pb-4">
                <span>Changes are saved immediately when you click Save.</span>
                <span>StudyBuddy Admin · Auto-Mod Configuration</span>
            </div>
        </div>
    );
}

