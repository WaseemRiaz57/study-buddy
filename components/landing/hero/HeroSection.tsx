"use client";

import { motion, useReducedMotion, useSpring, Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect, memo } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { KineticHeadline } from "./KineticHeadline";
import { FloatingEcosystem } from "./FloatingEcosystem";
import ParticleNetwork from "./ParticleNetwork";

// ─── Animation Variants ──────────────────────────────────────────────────────
const softSpring = { type: "spring", stiffness: 58, damping: 18, mass: 0.9 } as const;
const liquidEase = [0.22, 1, 0.36, 1] as const;

const fluidChild: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: softSpring,
  },
};

const fluidParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
};

// ─── Scroll Indicator ────────────────────────────────────────────────────────
const ScrollIndicator = memo(function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 3 }}
    >
      <motion.span
        className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        Scroll to explore
      </motion.span>
      <motion.div
        className="flex flex-col items-center gap-1"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-7 w-[1.5px] bg-gradient-to-b from-purple-400/60 to-transparent" />
        <div className="h-1 w-1 rounded-full bg-purple-400/40" />
      </motion.div>
    </motion.div>
  );
});

// ─── Trust Badges ────────────────────────────────────────────────────────────
const TrustBadges = memo(function TrustBadges() {
  return (
    <motion.div
      variants={fluidChild}
      className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8"
    >
      {[
        { icon: "🔒", text: "No credit card required" },
        { icon: "⚡", text: "Setup in 60 seconds" },
        { icon: "🎁", text: "Free forever plan" },
      ].map((badge) => (
        <span
          key={badge.text}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-white/40"
        >
          <span>{badge.icon}</span>
          {badge.text}
        </span>
      ))}
    </motion.div>
  );
});

// ─── Social Proof Counter ────────────────────────────────────────────────────
const SocialProof = memo(function SocialProof() {
  return (
    <motion.div
      variants={fluidChild}
      className="flex items-center justify-center gap-3 mt-6"
    >
      <div className="flex -space-x-2">
        {["bg-violet-500", "bg-cyan-500", "bg-pink-500", "bg-amber-500", "bg-emerald-500"].map(
          (color, i) => (
            <div
              key={i}
              className={`h-7 w-7 rounded-full ${color} border-2 border-[#0a0515] flex items-center justify-center text-[8px] font-bold text-white`}
            >
              {["AK", "SR", "MP", "JL", "RD"][i]}
            </div>
          )
        )}
      </div>
      <div className="text-left">
        <p className="text-[11px] font-bold text-white/70">
          <span className="text-purple-400">50,000+</span> students & teachers
        </p>
        <p className="text-[9px] text-white/40">learning together right now</p>
      </div>
    </motion.div>
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// HERO SECTION
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Cinematic Hero Section for the StudyBuddy landing page.
 *
 * Architecture:
 * - Background: Dark immersive gradient + interactive particle network (lazy-loaded)
 * - Typography: Kinetic word-by-word 3D reveal
 * - Foreground: Floating glassmorphic UI cards with mouse-tracking parallax
 *
 * SEO/AEO: Uses semantic HTML (<section>, <h1>, <article>). All card content
 * is real DOM text — no canvas-rendered text. Aria labels throughout.
 */
const HeroSection = memo(function HeroSection() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Mouse tracking for parallax
  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;
    const onMove = (e: MouseEvent) =>
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [isMobile, prefersReducedMotion]);

  return (
    <section
      id="hero"
      className="hero-section relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
      aria-label="StudyBuddy — Unlock your full learning potential with AI-powered study tools, expert teachers, and collaborative study rooms"
    >
      {/* ── Layer 0: Deep background gradient ── */}
      <div className="absolute inset-0 z-0 hero-bg-gradient" />

      {/* ── Layer 1: Ambient orbs — liquid floating glows ── */}
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        <motion.div
          className="absolute -left-[15%] top-[10%] h-[600px] w-[600px] rounded-full bg-purple-600/[0.12] blur-[160px]"
          animate={{
            y: [0, -30, 10, 0],
            scale: [1, 1.1, 1.03, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: liquidEase }}
        />
        <motion.div
          className="absolute right-[-10%] top-[20%] h-[500px] w-[500px] rounded-full bg-fuchsia-600/[0.09] blur-[150px]"
          animate={{
            y: [0, -35, 12, 0],
            x: [0, 20, -10, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: liquidEase,
            delay: 1.5,
          }}
        />
        <motion.div
          className="absolute bottom-[5%] left-[30%] h-[400px] w-[400px] rounded-full bg-cyan-500/[0.06] blur-[130px]"
          animate={{
            y: [0, -20, 8, 0],
            x: [0, -18, 8, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: liquidEase,
            delay: 3,
          }}
        />
        {/* Neon accent line */}
        <div className="absolute top-[40%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>

      {/* ── Layer 2: Particle network — lazy-loaded ── */}
      <div className="absolute inset-0 z-[2]">
        {!isMobile && <ParticleNetwork />}
      </div>

      {/* ── Layer 3: Grid pattern overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 z-[3] opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* ── Layer 4: Floating glass cards ── */}
      <div className="hidden md:block">
        <FloatingEcosystem
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          isMobile={isMobile}
        />
      </div>

      {/* ── Layer 5: Hero content — center stage ── */}
      <motion.div
        className="relative z-30 mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={fluidParent}
      >
        {/* Announcement badge */}
        <motion.div variants={fluidChild} className="mb-8 flex justify-center">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 backdrop-blur-sm"
            whileHover={{ scale: 1.05, borderColor: "rgba(168,85,247,0.5)" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              AI-Powered Learning Platform
            </span>
          </motion.div>
        </motion.div>

        {/* Kinetic headline */}
        <motion.div variants={fluidChild}>
          <KineticHeadline
            line1="Unlock Your Full"
            line2="Learning Potential"
            className="mb-8 text-4xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-2xl sm:text-5xl md:text-6xl lg:text-7xl"
          />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={fluidChild}
          className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg md:text-xl"
        >
          Where learning meets innovation. Connect with expert teachers,
          generate AI-powered study notes, and collaborate in real-time study
          rooms — all in one platform built for your success.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={fluidChild}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2.5 rounded-xl px-10 py-4 text-base font-bold text-white shadow-2xl shadow-purple-600/30 transition-all overflow-hidden"
              id="hero-cta-primary"
            >
              {/* Button gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 bg-[length:200%_100%] hero-btn-gradient" />
              {/* Shine sweep */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative z-10">Start Learning Free</span>
              <motion.span
                className="relative z-10 inline-flex"
                animate={
                  isMobile ? { y: [0, 3, 0] } : { x: [0, 5, 0] }
                }
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.06] px-10 py-4 text-base font-bold text-white/90 backdrop-blur-sm transition-all hover:border-white/[0.2] hover:bg-white/[0.1]"
              id="hero-cta-secondary"
            >
              View Dashboard
            </Link>
          </motion.div>
        </motion.div>

        {/* Social proof */}
        <SocialProof />

        {/* Trust badges */}
        <TrustBadges />
      </motion.div>

      {/* ── Layer 6: Bottom gradient fade ── */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />

      {/* ── Scroll indicator ── */}
      <ScrollIndicator />
    </section>
  );
});

export default HeroSection;
