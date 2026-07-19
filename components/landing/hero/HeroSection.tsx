"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import SplineBrain from "./SplineBrain";
import { KineticHeadline } from "./KineticHeadline";

const ParticleNetwork = dynamic(() => import("./ParticleNetwork"), {
  ssr: false,
});

const liquidEase = [0.16, 1, 0.3, 1] as const;

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const latestPointerRef = useRef({ x: 0, y: 0 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const isMobile = useIsMobile(768, true);
  const prefersReducedMotion = useReducedMotion();
  const [enableDesktopEffects, setEnableDesktopEffects] = useState(false);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const brainY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 96]), {
    stiffness: 70,
    damping: 24,
    mass: 0.6,
  });
  const backdropY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.82, 1], [1, 0.88, 0]);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [2.4, -2.4]), { stiffness: 55, damping: 22 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-2.8, 2.8]), { stiffness: 55, damping: 22 });

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    if (!desktopQuery.matches || prefersReducedMotion) return;

    const timer = window.setTimeout(() => setEnableDesktopEffects(true), 220);
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!enableDesktopEffects || isMobile || prefersReducedMotion) return;

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
  }, [enableDesktopEffects, isMobile, mouseX, mouseY, prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[100dvh] items-center overflow-hidden border-b border-black/[0.06] bg-[#f7f7f5] px-4 py-24 dark:border-white/[0.07] dark:bg-[#07070a] sm:px-6 lg:px-8"
      aria-labelledby="studybuddy-hero-heading"
    >
      <div className="landing-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-1/2 top-[42%] h-[52rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/[0.12] blur-[130px] dark:bg-violet-600/[0.16]" />
        <div className="absolute bottom-[-28%] right-[-8%] h-[34rem] w-[34rem] rounded-full bg-cyan-300/[0.08] blur-[130px] dark:bg-cyan-500/[0.07]" />
      </div>

      {enableDesktopEffects && (
        <ParticleNetwork id="hero-particles" density={38} className="z-0 opacity-45" />
      )}

      <motion.div
        className="pointer-events-none absolute inset-x-0 top-[23%] z-[1] select-none overflow-hidden font-mono text-[clamp(4rem,13vw,12rem)] font-medium uppercase leading-none tracking-[-0.08em] text-violet-950/[0.018] dark:text-white/[0.02]"
        style={{ y: isMobile || prefersReducedMotion ? 0 : backdropY }}
        aria-hidden="true"
      >
        <div className="whitespace-nowrap">STUDY · CONNECT · GROW</div>
      </motion.div>

      <motion.div
        className="absolute inset-0 z-[5] flex items-center justify-center"
        style={{ y: isMobile || prefersReducedMotion ? 0 : brainY, opacity: isMobile ? 1 : heroOpacity }}
      >
        <SplineBrain
          allowInteractive={enableDesktopEffects}
          className="h-[min(88vw,620px)] w-[min(88vw,620px)] opacity-25 dark:opacity-30 sm:h-[min(66vw,620px)] sm:w-[min(66vw,620px)]"
        />
      </motion.div>

      <motion.div
        className="relative z-20 mx-auto flex w-full max-w-5xl flex-col items-center text-center"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.13, delayChildren: 0.08 } },
        }}
        style={{
          perspective: 1100,
          rotateX: isMobile || prefersReducedMotion ? 0 : rotateX,
          rotateY: isMobile || prefersReducedMotion ? 0 : rotateY,
        }}
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: liquidEase } } }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-white/65 px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700 shadow-[0_12px_40px_-24px_rgba(124,58,237,.55)] backdrop-blur-xl dark:border-violet-300/15 dark:bg-white/[0.055] dark:text-violet-300"
        >
          <Sparkles className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
          Free Forever
        </motion.div>

        <KineticHeadline
          id="studybuddy-hero-heading"
          line1="Studying made social."
          line2="Success made certain."
          className="max-w-4xl text-balance text-[clamp(2.65rem,7vw,6.45rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-[#17151d] dark:text-white"
        />

        <motion.p
          className="mx-auto mt-8 max-w-2xl text-pretty text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg"
          variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: liquidEase } } }}
        >
          Where learning meets innovation. Build knowledge, connect with mentors, and achieve your goals in a community that never stops growing.
        </motion.p>

        <motion.div
          className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
          variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: liquidEase } } }}
        >
          <Link href="/dashboard/study-rooms" className="landing-button-primary group w-full sm:w-auto">
            Begin a session
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/14 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </span>
          </Link>
          <Link href="/dashboard" className="landing-button-secondary w-full sm:w-auto">
            View dashboard
          </Link>
        </motion.div>

        <motion.p
          className="mt-6 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.8, delay: 0.2 } } }}
        >
          No credit card required · Free forever plan
        </motion.p>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-[#f7f7f5] to-transparent dark:from-[#07070a]" aria-hidden="true" />
    </section>
  );
}
