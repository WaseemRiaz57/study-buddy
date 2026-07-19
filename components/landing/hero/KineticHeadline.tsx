"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";
import { useIsMobile } from "@/hooks/useIsMobile";

// Liquid spring — a whisper of overshoot for hero/headline characters
const liquidSpring = {
  type: "spring",
  stiffness: 90,
  damping: 14,
  mass: 0.85,
} as const;

/**
 * Cinematic word-by-word reveal with 3D rotateX flip.
 * Each word flips up from behind a perspective plane with staggered timing.
 * Uses aria-label for accessibility — screen readers get the full text.
 */
export function KineticHeadline({
  line1,
  line2,
  className = "",
  id,
}: {
  line1: string;
  line2: string;
  className?: string;
  id?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile(768, true);

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.08, delayChildren: 0.4 },
    },
  };

  const wordVariant: Variants = {
    hidden: { opacity: 0, y: 50, rotateX: -90, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: "blur(0px)",
      transition: liquidSpring,
    },
  };

  if (prefersReducedMotion || isMobile) {
    return (
      <h1 id={id} className={className} aria-label={`${line1} ${line2}`}>
        <span className="block">{line1}</span>
        <span className="block bg-gradient-to-r from-purple-600 to-purple-400 text-transparent bg-clip-text pb-1">{line2}</span>
      </h1>
    );
  }

  return (
    <motion.h1
      id={id}
      className={className}
      aria-label={`${line1} ${line2}`}
      style={{ perspective: 1000 }}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Line 1 */}
      <span className="block" style={{ transformStyle: "preserve-3d" }}>
        {line1.split(" ").map((word, i) => (
          <motion.span
            key={`l1-${i}`}
            variants={wordVariant}
            className="inline-block mr-[0.28em] last:mr-0"
            style={{ transformOrigin: "bottom center" }}
            aria-hidden="true"
          >
            {word}
          </motion.span>
        ))}
      </span>

      {/* Line 2 — gradient text */}
      <span
        className="block mt-2"
        style={{ transformStyle: "preserve-3d" }}
      >
        {line2.split(" ").map((word, i) => (
          <motion.span
            key={`l2-${i}`}
            variants={wordVariant}
            className="inline-block mr-[0.28em] last:mr-0 bg-gradient-to-r from-purple-600 to-purple-400 text-transparent bg-clip-text pb-2"
            style={{ transformOrigin: "bottom center" }}
            aria-hidden="true"
          >
            {word}
          </motion.span>
        ))}
      </span>
    </motion.h1>
  );
}
