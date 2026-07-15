"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import ParticleNetwork from "./hero/ParticleNetwork";
import SplineBrain from "./hero/SplineBrain";

/**
 * Premium immersive final CTA: particle network + 3D brain + kinetic typography.
 * Mirrors the HeroSection aesthetic for bookend symmetry.
 */
export default function PremiumFinalCTA() {
  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section className="relative isolate w-full overflow-hidden px-5 py-24 md:py-36 sm:px-8 bg-[#faf9fc] dark:bg-[#050505]">
      {/* ── Radial mesh gradient orbs ── */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-500/[0.07] blur-[120px] dark:bg-violet-500/[0.1] dark:blur-[140px]" />
        <div className="absolute bottom-[10%] right-[10%] h-[300px] w-[300px] rounded-full bg-fuchsia-500/[0.05] blur-[100px] dark:bg-fuchsia-500/[0.08] dark:blur-[120px]" />
      </div>

      {/* ── Particle network ── */}
      <ParticleNetwork />

      {/* ── 3D Brain background ── */}
      <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
        <SplineBrain className="h-[400px] w-[400px] md:h-[500px] md:w-[500px] opacity-50 dark:opacity-40" />
      </div>

      {/* ── Foreground content ── */}
      <motion.div
        className="relative z-20 mx-auto max-w-3xl text-center"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{ perspective: 900 }}
      >
        <motion.div variants={itemVariants} className="mb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/[0.06] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-purple-600 dark:border-purple-400/20 dark:bg-purple-500/10 dark:text-purple-400">
            <Sparkles className="h-3 w-3" />
            Get Started Free
          </div>
        </motion.div>

        {/* Cinematic 3D word flip */}
        <motion.h2
          className="mb-6 text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1]"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          style={{ perspective: 900 }}
        >
          {["Stop", "Procrastinating."].map((w, i) => (
            <motion.span key={i} variants={wordFlip3D} className="inline-block mr-3 text-slate-900 dark:text-white" style={{ transformOrigin: "bottom center" }}>
              {w}
            </motion.span>
          ))}
          <br />
          {["Start", "Achieving."].map((w, i) => (
            <motion.span key={i} variants={wordFlip3D} className="inline-block mr-3 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-300 bg-clip-text text-transparent dark:from-violet-400 dark:via-fuchsia-400 dark:to-violet-200" style={{ transformOrigin: "bottom center" }}>
              {w}
            </motion.span>
          ))}
        </motion.h2>

        <motion.p variants={itemVariants} className="mb-10 text-lg text-slate-600 dark:text-slate-400">
          Join the smartest study community today. Setup takes less than 60 seconds.
        </motion.p>

        {/* Double-Bezel CTA card */}
        <motion.div variants={itemVariants} className="mx-auto max-w-md">
          <div className="rounded-[2rem] p-[3px] border border-white/20 bg-gradient-to-br from-white/10 to-white/[0.02] dark:border-white/10 dark:from-white/5 dark:to-white/[0.01] shadow-[0_24px_60px_rgba(124,58,237,0.1)] dark:shadow-[0_24px_60px_rgba(124,58,237,0.15)]">
            <div className="rounded-[calc(2rem-3px)] border border-white/30 bg-white/70 p-8 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <Link
                href="/register"
                className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-violet-600 pl-8 pr-2 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-violet-500 hover:shadow-xl hover:shadow-violet-500/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:bg-violet-600 dark:hover:bg-violet-500"
              >
                Create Free Account
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:bg-white/25 group-hover:scale-105">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                Free forever plan · No credit card required
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Animation variants (duplicated locally to keep this self-contained) ──

const liquidSpring = { type: "spring", stiffness: 90, damping: 14, mass: 0.85 } as const;

const stagger: any = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const wordFlip3D: any = {
  hidden: { opacity: 0, y: 44, rotateX: -70 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: liquidSpring },
};
