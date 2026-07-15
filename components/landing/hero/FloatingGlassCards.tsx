"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useReducedMotion, useSpring, useMotionValue } from "framer-motion";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Brain,
  Clock,
  Play,
  FileText,
  Users,
  Timer,
  Headphones,
  Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface GlassCardData {
  id: string;
  title: string;
  position: string;
  depth: number;
  floatDelay: number;
  glowColor: string;
  content: React.ReactNode;
}

// ─── Card Definitions ────────────────────────────────────────────────────────
const GLASS_CARDS: GlassCardData[] = [
  {
    id: "book-mentor",
    title: "Book a Mentor",
    position: "top-[12%] -left-[2%] md:left-[3%]",
    depth: 1.8,
    floatDelay: 0,
    glowColor: "shadow-violet-500/15",
    content: (
      <article aria-label="Book a Mentor feature preview" className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Users className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Book a Mentor</span>
        </div>
        <div className="space-y-1.5">
          {[
            { name: "Sarah K.", subject: "Mathematics", available: true },
            { name: "Dr. Ali R.", subject: "Physics", available: true },
            { name: "Emma T.", subject: "Chemistry", available: false },
          ].map((mentor) => (
            <div
              key={mentor.name}
              className="flex items-center justify-between rounded-lg border border-violet-100/60 bg-white/50 px-2.5 py-1.5 dark:border-violet-400/10 dark:bg-white/5"
            >
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-[8px] font-bold text-white">
                  {mentor.name[0]}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">{mentor.name}</p>
                  <p className="text-[8px] text-slate-500 dark:text-slate-400">{mentor.subject}</p>
                </div>
              </div>
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  mentor.available
                    ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                    : "bg-slate-200 dark:bg-slate-600"
                }`}
              />
            </div>
          ))}
        </div>
        <button className="mt-1 w-full rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 py-1.5 text-[10px] font-bold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-shadow duration-500">
          Browse All Mentors →
        </button>
      </article>
    ),
  },
  {
    id: "ai-notes",
    title: "AI Notes Generator",
    position: "top-[8%] -right-[2%] md:right-[2%]",
    depth: 2.2,
    floatDelay: 0.8,
    glowColor: "shadow-cyan-500/15",
    content: (
      <article aria-label="AI Notes Generator feature preview" className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">AI Notes</span>
          <span className="ml-auto rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-bold text-emerald-600 dark:text-emerald-400">
            LIVE
          </span>
        </div>
        <div className="mb-1 rounded-lg border border-cyan-100/60 bg-white/50 p-2.5 dark:border-cyan-400/10 dark:bg-white/5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText className="h-3 w-3 text-cyan-500" />
            <span className="text-[9px] font-semibold text-cyan-600 dark:text-cyan-400">Generating notes...</span>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-700/60">
              <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 hero-shimmer" />
            </div>
            <div className="h-1.5 w-[65%] overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-700/60">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 hero-shimmer" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        </div>
        <p className="text-[9px] leading-relaxed text-slate-600 dark:text-slate-400">
          &quot;Quantum entanglement describes a phenomenon where particles become interconnected...&quot;
        </p>
      </article>
    ),
  },
  {
    id: "focus-room",
    title: "Focus Room",
    position: "bottom-[14%] -left-[1%] md:left-[6%]",
    depth: 1.5,
    floatDelay: 1.5,
    glowColor: "shadow-rose-500/15",
    content: (
      <article aria-label="Focus Room timer feature preview" className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Timer className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Focus Room</span>
        </div>
        <div className="flex items-center justify-center my-1">
          <div className="relative h-16 w-16">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" strokeWidth="3" className="stroke-slate-200/60 dark:stroke-slate-700/60" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="url(#focus-gradient)" strokeWidth="3" strokeDasharray="175.93" strokeDashoffset="44" strokeLinecap="round" className="hero-timer-ring" />
              <defs>
                <linearGradient id="focus-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black tabular-nums text-slate-800 dark:text-slate-200">24:38</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
            <Headphones className="h-3 w-3" />
            <span>Lo-Fi</span>
          </div>
          <div className="h-3 w-px bg-slate-300/60 dark:bg-slate-600/60" />
          <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
            <Users className="h-3 w-3" />
            <span>4 studying</span>
          </div>
        </div>
      </article>
    ),
  },
  {
    id: "live-session",
    title: "Live Study Session",
    position: "bottom-[10%] -right-[2%] md:right-[4%]",
    depth: 2.0,
    floatDelay: 2.0,
    glowColor: "shadow-amber-500/15",
    content: (
      <article aria-label="Live Study Session feature preview" className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Live Session</span>
          <span className="ml-auto flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[8px] font-bold text-red-500">REC</span>
          </span>
        </div>
        <div className="mb-1 rounded-lg border border-amber-100/60 bg-white/50 p-2 dark:border-amber-400/10 dark:bg-white/5">
          <div className="grid grid-cols-2 gap-1.5">
            {["AP", "MK", "JL", "SR"].map((initials, i) => (
              <div key={initials} className="flex items-center gap-1.5 rounded bg-slate-100/60 px-1.5 py-1 dark:bg-white/5">
                <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white ${
                  ["bg-purple-500", "bg-cyan-500", "bg-emerald-500", "bg-amber-500"][i]
                }`}>
                  {initials}
                </div>
                <div className="flex gap-px">
                  {[3, 5, 2, 6, 4].map((h, j) => (
                    <div key={j} className="hero-eq-bar w-0.5 rounded-full bg-slate-400 dark:bg-slate-500" style={{ height: `${h * 2}px`, animationDelay: `${j * 0.1 + i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400">
          <span>Organic Chemistry Study Group</span>
          <span className="font-bold text-amber-500">1:24:03</span>
        </div>
      </article>
    ),
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
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  isMobile: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const parallaxStrength = isMobile || prefersReducedMotion ? 0 : card.depth;
  const x = useSpring(useMotionValue(mouseX.get() * -parallaxStrength * 18), { stiffness: 45, damping: 22, mass: 0.8 });
  const y = useSpring(useMotionValue(mouseY.get() * -parallaxStrength * 12), { stiffness: 45, damping: 22, mass: 0.8 });

  useEffect(() => {
    x.set(mouseX.get() * -parallaxStrength * 18);
    y.set(mouseY.get() * -parallaxStrength * 12);
  }, [mouseX, mouseY, parallaxStrength, x, y]);

  return (
    <div
      className={`absolute ${card.position} z-20 w-[180px] md:w-[220px]`}
      style={{ x, y, willChange: "transform" }}
    >
      <div
        className={`animate-[float_${6 + card.floatDelay}s_ease-in-out_infinite]`}
        style={{ animationDelay: `${card.floatDelay}s` }}
      >
        {/* Outer shell — Double-Bezel */}
        <div className={`rounded-[1.5rem] p-[3px] border border-white/20 bg-gradient-to-br from-white/10 to-white/[0.02] dark:border-white/10 dark:from-white/5 dark:to-white/[0.01] shadow-[0_16px_45px_rgba(0,0,0,0.06)] ${card.glowColor} dark:shadow-[0_16px_45px_rgba(0,0,0,0.2)]`}>
          {/* Inner core — glassmorphism */}
          <div className="rounded-[calc(1.5rem-3px)] border border-white/30 bg-white/60 p-3.5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <div className="relative z-10">{card.content}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── Floating Glass Cards ────────────────────────────────────────────────────
export const FloatingGlassCards = memo(function FloatingGlassCards({
  mouseX,
  mouseY,
  isMobile,
}: {
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  isMobile: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      style={{ perspective: 1200 }}
      aria-hidden="false"
      role="region"
      aria-label="StudyBuddy feature previews"
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
