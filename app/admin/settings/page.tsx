"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import {
    Settings,
    Shield,
    Globe,
    Save,
    Key,
    AlertTriangle,
    Eye,
    EyeOff,
    RefreshCw,
    Mail,
    Lock,
    Loader2,
} from "lucide-react";

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
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 ${checked ? "bg-[#7C3AED]" : "bg-slate-300 dark:bg-white/10"
                }`}
        >
            <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
            />
        </button>
    );
}

// ─── Setting Row ────────────────────────────────────────────────────────────────
function SettingRow({
    label,
    description,
    children,
}: {
    label: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-8 py-4 border-b last:border-b-0 border-slate-100 dark:border-white/[0.04]">
            <div className="min-w-0 sm:max-w-[55%]">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {label}
                </p>
                {description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            <div className="sm:ml-auto shrink-0">{children}</div>
        </div>
    );
}

// ─── Section Card ───────────────────────────────────────────────────────────────
function SectionCard({
    icon: Icon,
    iconColor,
    title,
    children,
}: {
    icon: React.ElementType;
    iconColor: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor}`}
                >
                    <Icon size={14} />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {title}
                </h2>
            </div>
            <div className="px-5">{children}</div>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function PlatformSettingsPage() {
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // General
    const [platformName, setPlatformName] = useState("StudyBuddy");
    const [supportEmail, setSupportEmail] = useState("support@studybuddy.io");
    const [allowSignups, setAllowSignups] = useState(true);

    // Security & Maintenance
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceMsg, setMaintenanceMsg] = useState(
        "We're currently performing scheduled maintenance. We'll be back shortly!"
    );
    const [emailVerification, setEmailVerification] = useState(true);

    // API
    const [showOpenAI, setShowOpenAI] = useState(false);
    const [showStripe, setShowStripe] = useState(false);
    const [openAIKey, setOpenAIKey] = useState("sk-...........");
    const [stripeKey, setStripeKey] = useState("sk_live_4eR7y...........nL2x");

    useEffect(() => {
        setMounted(true);
        let active = true;

        async function fetchSettings() {
            try {
                setIsLoading(true);
                const response = await fetch("/api/admin/settings", {
                    cache: "no-store",
                });
                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(data?.message || "Failed to load settings.");
                }

                if (!active) return;

                const settings = data?.settings || {};
                setPlatformName(settings.platformName || "StudyBuddy");
                setSupportEmail(settings.supportEmail || "support@studybuddy.io");
                setAllowSignups(Boolean(settings.allowNewSignups));
                setMaintenanceMode(Boolean(settings.maintenanceMode));
                setLastUpdated(settings.updatedAt || null);
            } catch (error) {
                if (active) {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : "Failed to load settings."
                    );
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        }

        void fetchSettings();

        return () => {
            active = false;
        };
    }, []);

    const saveSettings = async () => {
        try {
            setIsSaving(true);
            const response = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platformName,
                    supportEmail,
                    allowNewSignups: allowSignups,
                    maintenanceMode,
                }),
            });
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.message || "Failed to save settings.");
            }

            setLastUpdated(data?.settings?.updatedAt || new Date().toISOString());
            toast.success(data?.message || "Platform settings updated.");
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to save settings."
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-slate-100 border border-slate-200 text-slate-600 dark:bg-white/[0.06] dark:border-white/10 dark:text-slate-400">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Platform Settings
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Global configurations, API keys, and maintenance mode.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => void saveSettings()}
                    disabled={isSaving || isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#7C3AED] text-white shadow-md shadow-purple-500/30 hover:opacity-90 transition-all shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {isSaving ? "Saving..." : "Save All Changes"}
                </button>
            </div>

            {/* ════════ SECTION 1: GENERAL PREFERENCES ════════ */}
            <SectionCard
                icon={Globe}
                iconColor="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
                title="General Preferences"
            >
                {/* Platform Name */}
                <SettingRow
                    label="Platform Name"
                    description="The public-facing name of your application."
                >
                    <input
                        type="text"
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        className="w-full sm:w-64 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    />
                </SettingRow>

                {/* Platform Logo */}
                <SettingRow
                    label="Platform Logo"
                    description="The official StudyBuddy logo used across the marketing site and application."
                >
                    <div className="flex items-center gap-4">
                        <BrandLogo />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Managed from the shared <code className="font-mono text-[11px]">BrandLogo</code> component
                        </p>
                    </div>
                </SettingRow>

                {/* Support Email */}
                <SettingRow
                    label="Support Email"
                    description="Users will see this email for help and contact requests."
                >
                    <div className="relative w-full sm:w-64">
                        <Mail
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        />
                        <input
                            type="email"
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                        />
                    </div>
                </SettingRow>

                {/* Allow New Signups */}
                <SettingRow
                    label="Allow New Signups"
                    description="When disabled, no new users can register on the platform."
                >
                    <div className="flex items-center gap-2">
                        <Toggle checked={allowSignups} onChange={setAllowSignups} />
                        <span
                            className={`text-[11px] font-semibold ${allowSignups
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-slate-400 dark:text-slate-500"
                                }`}
                        >
                            {allowSignups ? "Enabled" : "Disabled"}
                        </span>
                    </div>
                </SettingRow>
            </SectionCard>

            {/* ════════ SECTION 2: SECURITY & MAINTENANCE ════════ */}
            <SectionCard
                icon={Shield}
                iconColor="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
                title="Security & Maintenance"
            >
                {/* Maintenance Mode */}
                <div className="py-4 border-b border-slate-100 dark:border-white/[0.04]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-8">
                        <div className="min-w-0 sm:max-w-[55%]">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                Maintenance Mode
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                                Puts the app offline for all users. Only admins can access the
                                dashboard.
                            </p>
                        </div>
                        <div className="sm:ml-auto shrink-0 flex items-center gap-2">
                            <Toggle
                                checked={maintenanceMode}
                                onChange={setMaintenanceMode}
                            />
                            <span
                                className={`text-[11px] font-semibold ${maintenanceMode
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-slate-400 dark:text-slate-500"
                                    }`}
                            >
                                {maintenanceMode ? "Active" : "Off"}
                            </span>
                        </div>
                    </div>

                    {/* Conditional Maintenance Message */}
                    {maintenanceMode && (
                        <div className="mt-3 space-y-2">
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/[0.06] p-3 border border-amber-100 dark:border-amber-500/10">
                                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed flex items-start gap-2">
                                    <AlertTriangle
                                        size={13}
                                        className="shrink-0 mt-0.5"
                                    />
                                    Your application is currently in maintenance mode. Users will
                                    see the message below instead of the app.
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                                    Maintenance Message
                                </label>
                                <textarea
                                    value={maintenanceMsg}
                                    onChange={(e) =>
                                        setMaintenanceMsg(e.target.value)
                                    }
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 dark:focus:border-amber-400 transition-colors resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Email Verification */}
                <SettingRow
                    label="Require Email Verification"
                    description="New users must verify their email before accessing the platform."
                >
                    <div className="flex items-center gap-2">
                        <Toggle
                            checked={emailVerification}
                            onChange={setEmailVerification}
                        />
                        <span
                            className={`text-[11px] font-semibold ${emailVerification
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-slate-400 dark:text-slate-500"
                                }`}
                        >
                            {emailVerification ? "Required" : "Optional"}
                        </span>
                    </div>
                </SettingRow>
            </SectionCard>

            {/* ════════ SECTION 3: API & INTEGRATIONS ════════ */}
            <SectionCard
                icon={Key}
                iconColor="bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400"
                title="API & Integrations"
            >
                {/* OpenAI Key */}
                <SettingRow
                    label="OpenAI API Key"
                    description="Used for AI-powered study recommendations and content generation."
                >
                    <div className="relative w-full sm:w-72">
                        <Lock
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        />
                        <input
                            type={showOpenAI ? "text" : "password"}
                            value={openAIKey}
                            onChange={(e) => setOpenAIKey(e.target.value)}
                            className="w-full pl-9 pr-10 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowOpenAI((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            {showOpenAI ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </SettingRow>

                {/* Stripe Key */}
                <SettingRow
                    label="Stripe Secret Key"
                    description="Payment processing for Pro and Elite subscriptions."
                >
                    <div className="relative w-full sm:w-72">
                        <Lock
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        />
                        <input
                            type={showStripe ? "text" : "password"}
                            value={stripeKey}
                            onChange={(e) => setStripeKey(e.target.value)}
                            className="w-full pl-9 pr-10 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowStripe((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            {showStripe ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </SettingRow>

                {/* Rotate Keys */}
                <div className="py-4">
                    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                        <RefreshCw size={14} /> Rotate Keys
                    </button>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                        Invalidate existing API keys and generate new ones. This will
                        disrupt active integrations.
                    </p>
                </div>
            </SectionCard>

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                    Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Not saved yet"}
                </span>
                <span>Admin · Platform Settings</span>
            </div>
        </div>
    );
}

