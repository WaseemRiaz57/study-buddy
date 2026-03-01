"use client";

import { useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { X, Star, Sparkles, Zap, Crown } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Props                                                             */
/* ------------------------------------------------------------------ */
interface MythicBadgeModalProps {
  isOpen: boolean;
  onClose: () => void; // Yahan theek kar diya hai
  /** Override the default XP reward displayed */
  xpReward?: number;
  /** Override the profile-aura label */
  auraLabel?: string;
  /** Callback fired when the user clicks "Claim with Honor" */
  onClaimAction?: () => void;
}

/* ------------------------------------------------------------------ */
/* Animation variants                                                */
/* ------------------------------------------------------------------ */
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: "easeIn" as const } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 22, delay: 0.1 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.25, ease: "easeIn" as const },
  },
};

const floatVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
  },
};

const pulseGlow: Variants = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.7, 1, 0.7],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const },
  },
};

const shineSweep: Variants = {
  animate: {
    x: ["-100%", "200%"],
    transition: { duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/* Component                                                         */
/* ------------------------------------------------------------------ */
export default function MythicBadgeModal({
  isOpen,
  onClose, // Yahan theek kar diya hai
  xpReward = 500,
  auraLabel = "Mythic Aura",
  onClaimAction,
}: MythicBadgeModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose(); // Yahan theek kar diya hai
    }
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]); // Dependency update kar di

  return (
    <AnimatePresence>
      {isOpen && (
        /* ---- Overlay ---- */
        <motion.div
          key="mythic-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(88, 28, 135, 0.55) 0%, rgba(0, 0, 0, 0.85) 80%)",
          }}
          onClick={onClose} // Yahan theek kar diya hai
        >
          {/* ---- Card ---- */}
          <motion.div
            key="mythic-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md mx-4 rounded-3xl border border-purple-200 dark:border-purple-500/30
                       bg-white dark:bg-gradient-to-b dark:from-[#1a0533] dark:via-[#0f0a1a] dark:to-[#0a0612]
                       shadow-[0_0_50px_rgba(140,48,232,0.5)] overflow-hidden"
          >
            {/* ---- Ambient glow rings ---- */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />

            {/* ---- Close button ---- */}
            <button
              onClick={onClose} // Yahan theek kar diya hai
              aria-label="Close"
              className="absolute right-4 top-4 z-10 rounded-full p-1.5
                         text-purple-600/60 dark:text-purple-300/60 transition-colors hover:bg-purple-100 dark:hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-200"
            >
              <X size={20} />
            </button>

            {/* ---- Content ---- */}
            <div className="relative flex flex-col items-center px-8 pb-10 pt-12 text-center">
              {/* Floating emblem */}
              <motion.div
                variants={floatVariants}
                animate="animate"
                className="relative mb-6"
              >
                {/* Outer radiate ring */}
                <motion.div
                  variants={pulseGlow}
                  animate="animate"
                  className="absolute -inset-6 rounded-full bg-gradient-to-tr from-purple-600/40 via-amber-400/30 to-purple-600/40 blur-2xl"
                />
                {/* Star emblem */}
                <div
                  className="relative flex h-28 w-28 items-center justify-center rounded-full
                             border-2 border-amber-400/60 bg-gradient-to-br from-purple-900/80 to-purple-950
                             shadow-[0_0_30px_rgba(217,170,0,0.35)]"
                >
                  <Star className="h-14 w-14 fill-amber-400 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]" />
                  {/* tiny sparkles */}
                  <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-amber-300/80" />
                  <Sparkles className="absolute -bottom-1 -left-1 h-4 w-4 text-purple-300/70" />
                </div>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-purple-700/80 dark:text-purple-300/80"
              >
                Badge Unlocked
              </motion.p>

              {/* Title – gradient text */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mb-4 text-3xl font-extrabold leading-tight sm:text-4xl"
              >
                <span
                  className="bg-gradient-to-r from-amber-300 via-purple-400 to-amber-300 bg-clip-text text-transparent"
                >
                  Mythic Ascension
                </span>
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="mb-8 max-w-xs text-sm leading-relaxed text-purple-800/70 dark:text-purple-200/70"
              >
                You have transcended the ordinary. Your dedication has earned you
                a badge of legend — wear it with pride.
              </motion.p>

              {/* Reward pills */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="mb-8 flex flex-wrap items-center justify-center gap-3"
              >
                {/* XP pill */}
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-400/30
                             bg-amber-100 dark:bg-amber-400/10 px-4 py-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300"
                >
                  <Zap size={15} className="fill-amber-400 text-amber-400" />
                  +{xpReward} XP
                </span>
                {/* Aura pill */}
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 dark:border-purple-400/30
                             bg-purple-100 dark:bg-purple-500/10 px-4 py-1.5 text-sm font-semibold text-purple-700 dark:text-purple-300"
                >
                  <Crown size={15} className="text-purple-400" />
                  {auraLabel}
                </span>
              </motion.div>

              {/* Claim button with shine sweep */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onClaimAction?.();
                  onClose(); // Yahan theek kar diya hai
                }}
                className="group relative overflow-hidden rounded-full
                           bg-gradient-to-r from-purple-600 via-purple-500 to-amber-500
                           px-10 py-3 text-sm font-bold uppercase tracking-wider text-white
                           shadow-[0_0_24px_rgba(140,48,232,0.5)] transition-shadow
                           hover:shadow-[0_0_36px_rgba(140,48,232,0.7)]"
              >
                {/* Shine sweep overlay */}
                <motion.span
                  variants={shineSweep}
                  animate="animate"
                  className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                />
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles size={16} />
                  Claim with Honor
                </span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}