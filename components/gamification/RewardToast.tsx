"use client";

import { motion } from "framer-motion";
import { Coins, Sparkles, X } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export function RewardToast({
  id,
  title,
  xp,
  coins,
}: {
  id: string | number;
  title: string;
  xp: number;
  coins: number;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      className={`flex w-[340px] max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-[#7C3AED]/30 p-4 shadow-2xl shadow-purple-500/40 backdrop-blur-xl ${
        isDark ? "bg-slate-950/95 text-white" : "bg-white/95 text-slate-950"
      }`}
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/15 text-[#7C3AED]">
        <Sparkles size={22} className="animate-pulse" />
        <Coins size={14} className="absolute -right-1 -top-1 animate-bounce text-yellow-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black">{title}</p>
        <p className={`mt-0.5 text-xs font-semibold ${isDark ? "text-purple-100" : "text-purple-700"}`}>
          +{xp} XP | +{coins} Coins added.
        </p>
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]"
        aria-label="Dismiss reward notification"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

export function showRewardToast({
  title = "Reward Added!",
  xp,
  coins,
}: {
  title?: string;
  xp: number;
  coins: number;
}) {
  toast.custom(
    (id) => <RewardToast id={id} title={title} xp={xp} coins={coins} />,
    { duration: 4500 }
  );
}
