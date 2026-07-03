"use client";

import { motion, useReducedMotion, useSpring, useMotionValue, Variants } from "framer-motion";
import { useEffect, useState, useRef, memo } from "react";
import {
  BookOpen,
  Brain,
  Clock,
  Sparkles,
  Users,
  Play,
  FileText,
  Timer,
  Headphones,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface GlassCardData {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  /** CSS positioning: top/left/right/bottom as tailwind classes */
  position: string;
  /** Parallax depth multiplier (higher = more movement) */
  depth: number;
  /** Initial rotation in degrees for 3D tilt */
  rotateY: number;
  rotateX: number;
  /** Floating animation delay */
  floatDelay: number;
  /** Glow color */
  glowColor: string;
}

// ─── Card Definitions ────────────────────────────────────────────────────────
const GLASS_CARDS: GlassCardData[] = [
  {
    id: "book-teacher",
    title: "Book a Teacher",
    icon: <Users className="h-4 w-4" />,
    content: (
      <article aria-label="Book a Teacher feature preview">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Users className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">Book a Teacher</span>
        </div>
        <div className="space-y-2">
          {[
            { name: "Sarah K.", subject: "Mathematics", available: true },
            { name: "Dr. Ali R.", subject: "Physics", available: true },
            { name: "Emma T.", subject: "Chemistry", available: false },
          ].map((teacher) => (
            <div
              key={teacher.name}
              className="flex items-center justify-between rounded-lg bg-white/[0.06] px-2.5 py-1.5 border border-white/[0.05]"
            >
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-[8px] font-bold text-white">
                  {teacher.name[0]}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-white/90">{teacher.name}</p>
                  <p className="text-[8px] text-white/50">{teacher.subject}</p>
                </div>
              </div>
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  teacher.available
                    ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                    : "bg-white/20"
                }`}
              />
            </div>
          ))}
        </div>
        <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 py-1.5 text-[10px] font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow">
          Browse All Teachers →
        </button>
      </article>
    ),
    position: "top-[12%] -left-[2%] md:left-[3%]",
    depth: 1.8,
    rotateY: 12,
    rotateX: -6,
    floatDelay: 0,
    glowColor: "shadow-violet-500/20",
  },
  {
    id: "ai-notes",
    title: "AI Notes Generator",
    icon: <Brain className="h-4 w-4" />,
    content: (
      <article aria-label="AI Notes Generator feature preview">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">AI Notes</span>
          <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[8px] font-bold text-emerald-300 border border-emerald-500/30">
            LIVE
          </span>
        </div>
        <div className="rounded-lg bg-white/[0.06] p-2.5 border border-white/[0.05] mb-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText className="h-3 w-3 text-cyan-400" />
            <span className="text-[9px] font-semibold text-cyan-300">Generating notes...</span>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 hero-shimmer" />
            </div>
            <div className="h-1.5 w-[65%] rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 hero-shimmer" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        </div>
        <p className="text-[9px] text-white/50 leading-relaxed">
          &quot;Quantum entanglement describes a phenomenon where particles become interconnected...&quot;
        </p>
      </article>
    ),
    position: "top-[8%] -right-[2%] md:right-[2%]",
    depth: 2.2,
    rotateY: -14,
    rotateX: -4,
    floatDelay: 0.8,
    glowColor: "shadow-cyan-500/20",
  },
  {
    id: "focus-room",
    title: "Focus Room",
    icon: <Clock className="h-4 w-4" />,
    content: (
      <article aria-label="Focus Room timer feature preview">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Timer className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">Focus Room</span>
        </div>
        <div className="flex items-center justify-center my-2">
          <div className="relative h-16 w-16">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32" cy="32" r="28"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="3"
              />
              <circle
                cx="32" cy="32" r="28"
                fill="none"
                stroke="url(#focus-gradient)"
                strokeWidth="3"
                strokeDasharray="175.93"
                strokeDashoffset="44"
                strokeLinecap="round"
                className="hero-timer-ring"
              />
              <defs>
                <linearGradient id="focus-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-white tabular-nums">24:38</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mt-1">
          <div className="flex items-center gap-1 text-[9px] text-white/50">
            <Headphones className="h-3 w-3" />
            <span>Lo-Fi</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-1 text-[9px] text-white/50">
            <Users className="h-3 w-3" />
            <span>4 studying</span>
          </div>
        </div>
      </article>
    ),
    position: "bottom-[14%] -left-[1%] md:left-[6%]",
    depth: 1.5,
    rotateY: 8,
    rotateX: 6,
    floatDelay: 1.5,
    glowColor: "shadow-rose-500/20",
  },
  {
    id: "live-session",
    title: "Live Study Session",
    icon: <Play className="h-4 w-4" />,
    content: (
      <article aria-label="Live Study Session feature preview">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">Live Session</span>
          <span className="ml-auto flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[8px] font-bold text-red-400">REC</span>
          </span>
        </div>
        <div className="rounded-lg bg-white/[0.06] p-2 border border-white/[0.05] mb-2">
          <div className="grid grid-cols-2 gap-1.5">
            {["AP", "MK", "JL", "SR"].map((initials, i) => (
              <div
                key={initials}
                className="flex items-center gap-1.5 rounded bg-white/[0.04] px-1.5 py-1"
              >
                <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white ${
                  ["bg-purple-500", "bg-cyan-500", "bg-emerald-500", "bg-amber-500"][i]
                }`}>
                  {initials}
                </div>
                <div className="flex gap-px">
                  {[3, 5, 2, 6, 4].map((h, j) => (
                    <div
                      key={j}
                      className="w-0.5 rounded-full bg-white/30 hero-eq-bar"
                      style={{
                        height: `${h * 2}px`,
                        animationDelay: `${j * 0.1 + i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-[9px] text-white/50">
          <span>Organic Chemistry Study Group</span>
          <span className="text-amber-400 font-bold">1:24:03</span>
        </div>
      </article>
    ),
    position: "bottom-[10%] -right-[2%] md:right-[4%]",
    depth: 2.0,
    rotateY: -10,
    rotateX: 4,
    floatDelay: 2.0,
    glowColor: "shadow-amber-500/20",
  },
];

// ─── Single Glass Card ───────────────────────────────────────────────────────
const GlassCard = memo(function GlassCard({
  card,
  mouseX,
  mouseY,
  isMobile,
}: {
  card: GlassCardData;
  mouseX: number;
  mouseY: number;
  isMobile: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  // Parallax: cards move in opposition to cursor (inverted)
  const parallaxX = isMobile || prefersReducedMotion ? 0 : -mouseX * card.depth * 18;
  const parallaxY = isMobile || prefersReducedMotion ? 0 : -mouseY * card.depth * 12;

  const springConfig = { stiffness: 45, damping: 22, mass: 0.8 };
  const x = useSpring(parallaxX, springConfig);
  const y = useSpring(parallaxY, springConfig);

  // Update spring targets when mouse moves
  useEffect(() => {
    x.set(parallaxX);
    y.set(parallaxY);
  }, [parallaxX, parallaxY, x, y]);

  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.7,
      rotateY: card.rotateY * 2,
      rotateX: card.rotateX * 2,
      y: 60,
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotateY: isMobile ? 0 : card.rotateY,
      rotateX: isMobile ? 0 : card.rotateX,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 60,
        damping: 16,
        mass: 1,
        delay: 0.8 + card.floatDelay,
      },
    },
  };

  return (
    <motion.div
      className={`absolute ${card.position} z-20 w-[180px] md:w-[220px]`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      style={{
        x,
        y,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {/* Floating animation wrapper */}
      <motion.div
        animate={
          prefersReducedMotion
            ? {}
            : {
                y: [0, -8, 0, 6, 0],
                rotateZ: [0, 0.5, 0, -0.5, 0],
              }
        }
        transition={{
          duration: 6 + card.floatDelay,
          repeat: Infinity,
          ease: "easeInOut",
          delay: card.floatDelay,
        }}
      >
        <div
          className={`
            relative rounded-2xl p-3.5
            border border-white/[0.12]
            bg-white/[0.06]
            backdrop-blur-xl
            shadow-2xl ${card.glowColor}
            hover:border-white/[0.2]
            hover:bg-white/[0.1]
            hover:shadow-3xl
            transition-all duration-500
            group
          `}
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          {/* Inner glow */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10" />

          {/* Card content */}
          <div className="relative z-10">{card.content}</div>

          {/* Subtle edge highlight */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-t-2xl" />
        </div>
      </motion.div>
    </motion.div>
  );
});

// ─── Floating Ecosystem ──────────────────────────────────────────────────────
/**
 * Renders 4 glassmorphic UI preview cards that float around the hero content.
 * Uses mouse-tracking parallax for a 3D depth illusion.
 * All text is real DOM content for SEO/AEO indexability.
 */
export const FloatingEcosystem = memo(function FloatingEcosystem({
  mouseX,
  mouseY,
  isMobile,
}: {
  mouseX: number;
  mouseY: number;
  isMobile: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      style={{ perspective: 1200 }}
      aria-hidden="false"
      role="region"
      aria-label="StudyBuddy feature previews showcasing Book a Teacher, AI Notes, Focus Room, and Live Sessions"
    >
      {GLASS_CARDS.map((card) => (
        <GlassCard
          key={card.id}
          card={card}
          mouseX={mouseX}
          mouseY={mouseY}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
});
