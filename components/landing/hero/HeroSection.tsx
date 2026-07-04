'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Container, ISourceOptions, Engine } from '@tsparticles/engine';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import Link from 'next/link';

const PURPLE = '#9333EA'; // Brand Purple (Works on Light & Dark)
const CYAN = '#06B6D4';   // Secondary Cyan

const line1 = ['Studying', 'made', 'social.'];
const line2 = ['Success', 'made', 'certain.'];

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.2 },
  },
};

const letter: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95, filter: 'blur(5px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

function AnimatedWord({ word }: { word: string }) {
  return (
    <span className="inline-block whitespace-nowrap">
      {word.split('').map((ch, i) => (
        <motion.span key={i} variants={letter} className="inline-block">
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

export default function StudyBuddyHero() {
  const [nodeCount, setNodeCount] = useState(0);
  const [contentVisible, setContentVisible] = useState(false);
  const containerRef = useRef<Container | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const initEngine = useCallback(async (engine: any) => {
    await loadSlim(engine as Engine);
  }, []);

  useEffect(() => {
    const totalLetters = [...line1, ...line2].join('').length;
    const totalMs = prefersReducedMotion ? 0 : (0.2 + totalLetters * 0.04 + 0.6) * 1000;
    const t = setTimeout(() => setContentVisible(true), totalMs);
    return () => clearTimeout(t);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const id = setInterval(() => {
      const c = containerRef.current;
      if (!c) return;
      setNodeCount(c.particles?.count ?? 0);
    }, 500);
    return () => clearInterval(id);
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      background: { color: { value: 'transparent' } }, // Tailwind handles the background now
      fpsLimit: 60,
      particles: {
        number: { value: 60, density: { enable: true, width: 1440, height: 900 } },
        color: { value: PURPLE },
        opacity: { value: 0.5 },
        size: { value: { min: 1, max: 2.5 } },
        move: {
          enable: !prefersReducedMotion,
          speed: 0.6,
          outModes: { default: 'bounce' },
        },
        links: {
          enable: true,
          distance: 140,
          color: CYAN,
          opacity: 0.25,
          width: 1,
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: 'grab' },
          resize: { enable: true },
        },
        modes: {
          grab: { distance: 180, links: { opacity: 0.6, color: PURPLE } },
        },
      },
      detectRetina: true,
    }),
    [prefersReducedMotion]
  );

  return (
    // SEO: Semantic section with clear aria-label
    <section
      aria-label="StudyBuddy Hero Section"
      className="relative flex items-center justify-center min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0b1121] font-sans transition-colors duration-300"
    >
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-purple-500/10 dark:bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

      <ParticlesProvider init={initEngine}>
        <Particles
          id="studybuddy-network"
          options={options}
          particlesLoaded={async (c) => {
            containerRef.current = c ?? null;
          }}
          className="absolute inset-0 z-0"
        />
      </ParticlesProvider>

      <div className="relative z-10 w-full max-w-4xl px-6 text-center">
        {/* Network Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-medium tracking-widest uppercase border rounded-full text-cyan-700 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 backdrop-blur-sm"
        >
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(147,51,234,0.6)]" />
          Live Network · {String(nodeCount).padStart(2, '0')} Active Nodes
        </motion.div>

        {/* H1 Kinetic Typography */}
        <motion.h1
          variants={container}
          initial="hidden"
          animate="show"
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
        >
          {/* Line 1: Adaptive Dark/Light Color */}
          <span className="block text-slate-900 dark:text-white">
            {line1.map((w, i) => (
              <span key={w}>
                <AnimatedWord word={w} />
                {i < line1.length - 1 ? '\u00A0' : ''}
              </span>
            ))}
          </span>
          {/* Line 2: Brand Purple Gradient */}
          <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-300">
            {line2.map((w, i) => (
              <span key={w}>
                <AnimatedWord word={w} />
                {i < line2.length - 1 ? '\u00A0' : ''}
              </span>
            ))}
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate={contentVisible ? 'show' : 'hidden'}
          className="max-w-2xl mx-auto mb-10 text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed"
        >
          Where learning meets innovation. Build knowledge, connect with{' '}
          <strong className="font-semibold text-slate-900 dark:text-white">mentors</strong>, 
          and achieve your goals in a community that never stops growing.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={contentVisible ? 'show' : 'hidden'}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 bg-purple-600 rounded-lg hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95"
          >
            Begin a session <span>→</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center px-8 py-3.5 text-sm font-semibold transition-all duration-200 border rounded-lg text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 backdrop-blur-md active:scale-95"
          >
            View dashboard
          </Link>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate={contentVisible ? 'show' : 'hidden'}
          className="mt-6 text-sm text-slate-500 dark:text-slate-400"
        >
          No credit card required • Free forever plan
        </motion.p>
      </div>
    </section>
  );
}
