"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bot,
  Filter,
  Save,
  ShieldCheck,
  Type,
  Zap,
} from "lucide-react";

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
      className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 ${
        enabled ? "bg-[#7C3AED]" : "bg-slate-200 dark:bg-white/10"
      }`}
      aria-pressed={enabled}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

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
    <div className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-white/[0.02]">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconColor}`}>
          <Icon size={17} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-5 px-6 py-5">{children}</div>
    </div>
  );
}

export default function AutoModSettingsPage() {
  const [banAfterStrikes, setBanAfterStrikes] = useState(3);
  const [strikeExpiryDays, setStrikeExpiryDays] = useState(30);
  const [restrictedKeywords, setRestrictedKeywords] = useState("");
  const [autoFlagAI, setAutoFlagAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/moderation/settings", { cache: "no-store" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      toast.error(data?.message || "Failed to load moderation settings.");
      setLoading(false);
      return;
    }

    const settings = data?.settings || {};
    setBanAfterStrikes(Number(settings.banAfterStrikes || 3));
    setStrikeExpiryDays(Number(settings.strikeExpiryDays || 30));
    setRestrictedKeywords(Array.isArray(settings.restrictedKeywords) ? settings.restrictedKeywords.join(", ") : "");
    setAutoFlagAI(Boolean(settings.autoFlagAI));
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  async function saveSettings() {
    setSaving(true);
    const response = await fetch("/api/admin/moderation/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        banAfterStrikes,
        strikeExpiryDays,
        restrictedKeywords,
        autoFlagAI,
      }),
    });
    const data = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      toast.error(data?.message || "Failed to save settings.");
      return;
    }

    toast.success(data?.message || "Settings saved.");
    void fetchSettings();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-200 bg-[#7C3AED]/10 text-[#7C3AED] dark:border-purple-500/25">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Automated Moderation Settings</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Configure rules for auto-flagging and automated penalties.</p>
          </div>
        </div>
        <button
          onClick={() => void saveSettings()}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
        >
          <Save size={15} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <SettingsCard
        icon={Zap}
        iconColor="bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
        title="Strike Automation"
        description="Configure automatic escalation and expiry rules for user strikes."
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Ban after active strikes</label>
          <p className="mb-3 text-xs text-muted-foreground">When a user reaches this count, the moderation engine automatically creates a ban log.</p>
          <input
            type="number"
            min={1}
            max={10}
            value={banAfterStrikes}
            onChange={(event) => setBanAfterStrikes(Number(event.target.value))}
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:bg-white/[0.04] sm:w-64"
          />
        </div>

        <div className="border-t border-border pt-5">
          <label className="mb-1.5 block text-sm font-medium text-foreground">Strike expiry duration</label>
          <p className="mb-3 text-xs text-muted-foreground">How long warnings and strikes remain active before expiry.</p>
          <select
            value={strikeExpiryDays}
            onChange={(event) => setStrikeExpiryDays(Number(event.target.value))}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:bg-white/[0.04] sm:w-64"
          >
            <option value={7}>7 Days</option>
            <option value={30}>30 Days</option>
            <option value={60}>60 Days</option>
            <option value={90}>90 Days</option>
            <option value={365}>1 Year</option>
          </select>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Bot}
        iconColor="bg-violet-100 text-[#7C3AED] dark:bg-violet-500/15"
        title="AI Content Scanner"
        description="Control how AI-generated content is analyzed and moderated."
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Auto-flag AI outputs</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Generated content with restricted or suspicious terms will be queued for manual review.</p>
          </div>
          <Toggle enabled={autoFlagAI} onToggle={() => setAutoFlagAI((current) => !current)} />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Filter}
        iconColor="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
        title="Keyword & Spam Filter"
        description="Manage the global blocklist and moderation keyword detection."
      >
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
            <Type size={14} /> Restricted Keywords
          </label>
          <p className="mb-3 text-xs text-muted-foreground">Comma-separated words that should be flagged across posts, comments, resources, and AI prompts.</p>
          <textarea
            value={restrictedKeywords}
            onChange={(event) => setRestrictedKeywords(event.target.value)}
            rows={4}
            placeholder="hack, cheat, spam..."
            className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 font-mono text-sm leading-relaxed outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:bg-white/[0.04]"
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            {restrictedKeywords.split(",").filter((keyword) => keyword.trim()).length} keywords active
          </p>
        </div>
      </SettingsCard>

      <div className="flex items-center justify-between pb-4 text-xs text-muted-foreground">
        <span>Changes are saved when you click Save.</span>
        <span>StudyBuddy Admin · Auto-Mod Configuration</span>
      </div>
    </div>
  );
}
