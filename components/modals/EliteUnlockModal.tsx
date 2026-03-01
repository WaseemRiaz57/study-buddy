"use client";

import { useEffect, useState } from "react"; // 👈 useState import kiya
import { motion, AnimatePresence } from "framer-motion";
import { Key, Trophy, Star, Shield, Coins, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface EliteUnlockModalProps {
  isOpen: boolean;
  onClose: () => void; 
  onUnlockAction?: () => void;
}

/* ───────────────── sub-components ───────────────── */

function Spark({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-amber-400"
      style={{ width: size, height: size, left: `${x}%`, bottom: 0 }}
      initial={{ y: 0, opacity: 0.9, scale: 1 }}
      animate={{
        y: [0, -260 - Math.random() * 140],
        opacity: [0.9, 0],
        scale: [1, 0.3],
      }}
      transition={{
        duration: 2.2 + Math.random() * 1.2,
        repeat: Infinity,
        delay,
        ease: "easeOut",
      }}
    />
  );
}

function BenefitRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      className="flex items-center gap-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-100 dark:bg-amber-900/10 px-5 py-4 backdrop-blur-md"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-200 dark:bg-gradient-to-br dark:from-amber-500/30 dark:to-amber-700/30 text-amber-600 dark:text-amber-400">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-amber-900 dark:text-amber-200">{title}</p>
        <p className="text-sm text-slate-700 dark:text-amber-300/60">{description}</p>
      </div>
    </motion.div>
  );
}

/* ───────────────── main modal ───────────────── */

export default function EliteUnlockModal({
  isOpen,
  onClose, 
  onUnlockAction,
}: EliteUnlockModalProps) {
  const router = useRouter();
  
  // 👈 1. Client-side render check ke liye state add ki
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* lock body scroll while open */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(); 
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]); 

  return (
    <AnimatePresence>
      {isOpen && (
        /* ── backdrop ── */
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} 
        >
          {/* ── modal card ── */}
          <motion.div
            className="relative mx-4 w-full max-w-lg overflow-hidden rounded-3xl border border-amber-200 dark:border-amber-500/30 bg-white dark:bg-[#0f0b15] shadow-[0_0_80px_rgba(255,215,0,0.15)]"
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* animated border pulse overlay */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl animate-[border-pulse_4s_infinite_ease-in-out] border-2 border-amber-500/40" />

            {/* close button */}
            <button
              onClick={onClose} 
              className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-amber-300/50 transition hover:bg-amber-500/10 hover:text-amber-300"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* ── upper hero section ── */}
            <div className="relative flex flex-col items-center px-6 pt-10 pb-6">
              
              {/* 👈 2. Yahan array ko {mounted && ...} mein wrap kar diya */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {mounted && Array.from({ length: 14 }).map((_, i) => (
                  <Spark
                    key={i}
                    delay={i * 0.35}
                    x={10 + Math.random() * 80}
                    size={2 + Math.random() * 4}
                  />
                ))}
              </div>

              {/* floating master key */}
              <motion.div
                className="relative mb-6 flex h-28 w-28 items-center justify-center"
                animate={{
                  y: [0, -14, 0],
                  rotateY: [0, 360],
                }}
                transition={{
                  y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                  rotateY: { duration: 6, repeat: Infinity, ease: "linear" },
                }}
                style={{ perspective: 800 }}
              >
                {/* glow ring behind key */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/30 via-yellow-400/10 to-transparent blur-xl" />
                <div className="absolute inset-2 rounded-full border-2 border-amber-500/20 animate-[border-pulse_4s_infinite_ease-in-out]" />

                <Key
                  size={52}
                  className="relative z-10 text-amber-600 dark:text-amber-400 drop-shadow-[0_0_18px_rgba(255,215,0,0.6)]"
                  strokeWidth={1.5}
                />
              </motion.div>

              {/* headline */}
              <h2 className="mb-2 text-center text-2xl font-extrabold tracking-tight sm:text-3xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 dark:from-amber-300 dark:via-yellow-400 dark:to-amber-500 bg-clip-text text-transparent">
                Unlock the Path to Mastery
              </h2>
              <p className="max-w-xs text-center text-sm text-slate-700 dark:text-amber-300/50">
                Gain access to the most prestigious challenges and elevate your
                rank among the elite.
              </p>
            </div>

            {/* ── benefits list ── */}
            <div className="flex flex-col gap-3 px-6">
              <BenefitRow
                icon={<Trophy size={22} />}
                title="Elite Challenges"
                description="Access exclusive, expert-level challenges."
              />
              <BenefitRow
                icon={<Star size={22} />}
                title="1.5× XP Multiplier"
                description="Earn 50% more XP on every completion."
              />
              <BenefitRow
                icon={<Shield size={22} />}
                title="Mythic Badges"
                description="Collect legendary badges for your profile."
              />
            </div>

            {/* ── footer ── */}
            <div className="flex flex-col items-center gap-4 px-6 pt-6 pb-8">
              {/* cost badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-600 dark:bg-amber-900/20 px-4 py-1.5 text-sm font-medium text-white dark:border-amber-500/30 dark:text-amber-300">
                <Coins size={16} className="text-white dark:text-amber-400" />
                Cost: 500 Coins
              </div>

              {/* unlock button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onUnlockAction?.();
                  onClose(); 
                  router.push('/dashboard/upgrade');
                }}
                className="relative w-full max-w-xs overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 bg-[length:200%_100%] px-8 py-3 text-base font-bold text-[#0f0b15] shadow-[0_0_30px_rgba(255,215,0,0.35)] transition-shadow hover:shadow-[0_0_50px_rgba(255,215,0,0.5)]"
              >
                Unlock Now
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}