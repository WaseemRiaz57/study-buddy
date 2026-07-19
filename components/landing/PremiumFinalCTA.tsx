"use client";

import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { useRef } from "react";

const liquidEase = [0.16, 1, 0.3, 1] as const;
const liquidSpring = { type: "spring", stiffness: 86, damping: 16, mass: 0.82 } as const;

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.075, delayChildren: 0.08 } },
};

const wordReveal: Variants = {
  hidden: { opacity: 0, y: 36, rotateX: -55 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: liquidSpring },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: liquidEase } },
};

export default function PremiumFinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const backgroundX = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden border-t border-violet-950/[0.07] bg-[#f0ecf7] px-4 py-24 dark:border-white/[0.07] dark:bg-[#0d0b12] sm:px-6 md:py-32 lg:px-8"
      aria-labelledby="final-cta-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-24 top-1/2 aspect-square w-[34rem] -translate-y-1/2 rounded-full border border-violet-500/10 dark:border-violet-300/[0.07]" />
        <div className="absolute -right-8 top-1/2 aspect-square w-[24rem] -translate-y-1/2 rounded-full border border-violet-500/10 dark:border-violet-300/[0.07]" />
        <div className="absolute right-16 top-1/2 aspect-square w-48 -translate-y-1/2 rounded-full bg-violet-500/[0.08] dark:bg-violet-400/[0.06]" />
        <motion.div
          className="absolute bottom-8 left-0 whitespace-nowrap font-mono text-[clamp(5rem,15vw,13rem)] font-medium uppercase leading-none tracking-[-0.08em] text-violet-950/[0.025] dark:text-white/[0.025]"
          style={{ x: prefersReducedMotion ? 0 : backgroundX }}
        >
          YOUR NEXT SESSION
        </motion.div>
      </div>

      <motion.div
        className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.25fr_0.75fr] lg:gap-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      >
        <div className="max-w-4xl text-center lg:text-left">
          <motion.div variants={fadeUp} className="mb-6">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-600 text-white dark:bg-violet-400 dark:text-violet-950">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              </span>
              Get Started Free
            </div>
          </motion.div>

          <motion.h2
            id="final-cta-heading"
            className="text-balance text-[clamp(3.25rem,7.5vw,7rem)] font-semibold leading-[0.9] tracking-[-0.065em] text-[#17131e] dark:text-white"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            aria-label="Stop Procrastinating. Start Achieving."
          >
            <span className="block" aria-hidden="true">
              {["Stop", "Procrastinating."].map((word) => (
                <motion.span key={word} variants={wordReveal} className="mr-[0.19em] inline-block last:mr-0" style={{ transformOrigin: "bottom center" }}>
                  {word}
                </motion.span>
              ))}
            </span>
            <span className="mt-1 block text-violet-600 dark:text-violet-300" aria-hidden="true">
              {["Start", "Achieving."].map((word) => (
                <motion.span key={word} variants={wordReveal} className="mr-[0.19em] inline-block last:mr-0" style={{ transformOrigin: "bottom center" }}>
                  {word}
                </motion.span>
              ))}
            </span>
          </motion.h2>

          <motion.p variants={fadeUp} className="mx-auto mt-7 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg lg:mx-0">
            Join the smartest study community today. Setup takes less than 60 seconds.
          </motion.p>
        </div>

        <motion.aside
          variants={fadeUp}
          className="mx-auto w-full max-w-md rounded-[2rem] border border-violet-950/[0.08] bg-white/72 p-2 shadow-[0_30px_80px_-46px_rgba(76,29,149,.36)] dark:border-white/[0.08] dark:bg-white/[0.045]"
          aria-label="Create a free StudyBuddy account"
        >
          <div className="rounded-[calc(2rem-8px)] border border-white bg-white/72 p-6 dark:border-white/[0.07] dark:bg-[#15121c] sm:p-8">
            <div className="mb-8 space-y-4">
              {["Free forever plan", "No credit card required", "Setup takes less than 60 seconds"].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.65, delay: 0.2 + index * 0.08, ease: liquidEase }}
                  className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                    <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                  </span>
                  {item}
                </motion.div>
              ))}
            </div>

            <Link href="/register" className="landing-button-primary group w-full justify-between">
              Create Free Account
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/14 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </motion.aside>
      </motion.div>
    </section>
  );
}
