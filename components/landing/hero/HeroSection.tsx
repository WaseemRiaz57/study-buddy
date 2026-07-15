"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMotionValue, useReducedMotion, useSpring, useTransform, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import ParticleNetwork from "./ParticleNetwork";
import SplineBrain from "./SplineBrain";
import { FloatingGlassCards } from "./FloatingGlassCards";

/**
 * Premium immersive hero: particle network + kinetic typography + 3D glass brain + floating cards.
 * Three layers per the Vanguard_UI_Architect directive.
 */
export default function HeroSection() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  // Mouse tracking for parallax layers
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [mounted, setMounted] = useState(false);
  const frameRef = useRef<number | null>(null);
  const latestPointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;

    const handlePointerMove = (event: PointerEvent) => {
      latestPointerRef.current = {
        x: event.clientX / window.innerWidth - 0.5,
        y: event.clientY / window.innerHeight - 0.5,
      };

      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        mouseX.set(latestPointerRef.current.x);
        mouseY.set(latestPointerRef.current.y);
        frameRef.current = null;
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [isMobile, prefersReducedMotion, mouseX, mouseY]);

  // Kinetic headline: subtle 3D rotation driven by cursor
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [3, -3]),
    { stiffness: 50, damping: 20 }
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-3, 3]),
    { stiffness: 50, damping: 20 }
  );

  // Scroll-driven entrance
  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, staggerChildren: 0.15 },
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
    <section
      className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#faf9fc] dark:bg-[#050505] px-5 py-24 sm:px-8"
      aria-labelledby="studybuddy-hero-heading"
    >
      {/* ── Layer 0: Radial mesh gradient orbs ── */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -left-[20%] top-[10%] h-[500px] w-[500px] rounded-full bg-violet-500/[0.08] blur-[120px] dark:bg-violet-500/[0.12] dark:blur-[140px]" />
        <div className="absolute -right-[15%] top-[30%] h-[400px] w-[400px] rounded-full bg-emerald-500/[0.05] blur-[100px] dark:bg-emerald-500/[0.08] dark:blur-[120px]" />
        <div className="absolute bottom-[5%] left-[40%] h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-fuchsia-500/[0.06] blur-[110px] dark:bg-fuchsia-500/[0.09] dark:blur-[130px]" />
      </div>

      {/* ── Layer 1: Particle network ── */}
      <ParticleNetwork />

      {/* ── Layer 2: 3D Brain (centerpiece) ── */}
      <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
        <SplineBrain className="h-[500px] w-[500px] md:h-[600px] md:w-[600px] opacity-60 dark:opacity-50" />
      </div>

      {/* ── Layer 3: Parallax floating cards ── */}
      {mounted && <FloatingGlassCards mouseX={mouseX} mouseY={mouseY} isMobile={isMobile} />}

      {/* ── Foreground: Kinetic typography + CTAs ── */}
      <motion.div
        className="relative z-20 mx-auto max-w-4xl text-center"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ perspective: 1000 }}
      >
        <motion.div variants={itemVariants}>
          <div className="mb-6 inline-flex rounded-full border border-violet-200/60 bg-violet-100/50 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300">
            ✨ Free Forever
          </div>
        </motion.div>

        <motion.h1
          id="studybuddy-hero-heading"
          className="text-balance text-5xl font-black leading-[1.02] tracking-[-0.04em] sm:text-6xl md:text-7xl"
          variants={itemVariants}
          style={{
            rotateX: isMobile || prefersReducedMotion ? 0 : rotateX,
            rotateY: isMobile || prefersReducedMotion ? 0 : rotateY,
            transformStyle: "preserve-3d",
          }}
        >
          <span className="block text-slate-900 dark:text-white">
            Studying made social.
          </span>
          <span className="block bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-300 bg-clip-text text-transparent dark:from-violet-400 dark:via-fuchsia-400 dark:to-violet-200">
            Success made certain.
          </span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-slate-600 dark:text-slate-400"
          variants={itemVariants}
        >
          Where learning meets innovation. Build knowledge, connect with mentors, and achieve your goals in a community that never stops growing.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          variants={itemVariants}
        >
          {/* Primary CTA — Double-Bezel Button-in-Button */}
          <Link
            href="/dashboard/study-rooms"
            className="group inline-flex h-14 items-center gap-3 rounded-full bg-violet-600 pl-8 pr-2 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-violet-500 hover:shadow-xl hover:shadow-violet-500/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            Begin a session
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:bg-white/25 group-hover:scale-105">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          {/* Secondary CTA */}
          <Link
            href="/dashboard"
            className="inline-flex h-14 items-center gap-3 rounded-full border border-slate-200/80 bg-white/70 px-8 text-base font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 sm:w-auto dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            View dashboard
          </Link>
        </motion.div>

        <motion.p
          className="mt-6 text-sm font-medium text-slate-500 dark:text-slate-400"
          variants={itemVariants}
        >
          No credit card required · Free forever plan
        </motion.p>
      </motion.div>
    </section>
  );
}
