"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  Brain,
  Clock,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
  Diamond,
  Star,
  BookOpen,
  FileText,
  Award,
} from "lucide-react";
import BackButton from "@/components/ui/BackButton";

/* ═══════════════════════════════════════════════════════════════════ */
/*  MOCK DATA                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

const sessionSummary = {
  mentorName: "Alex M.",
  mentorAvatar: "AM",
  mentorRank: "Grandmaster",
  subject: "Calculus III — Vector Fields",
  date: "Jun 14, 2025",
  duration: "58 min",
  xpEarned: 240,
  focusScore: 92,
  knowledgeGained: 87,
  aiSummary:
    "You explored the divergence theorem and its applications to vector fields. You demonstrated strong conceptual understanding of surface integrals and made a key breakthrough connecting divergence to flux density. The session covered problems #4–#7 from the midterm review with increasing confidence throughout.",
  keyTakeaways: [
    "The divergence theorem connects surface integrals to volume integrals",
    "Setting up triple integral bounds requires careful region analysis",
    "Flux density represents the 'source strength' at each point",
    "Practice problems #4–#7 completed with 85% accuracy",
  ],
  sharedResources: [
    {
      id: 1,
      title: "Divergence Theorem — Khan Academy",
      type: "Video",
      url: "#",
    },
    {
      id: 2,
      title: "Vector Calculus Cheat Sheet",
      type: "PDF",
      url: "#",
    },
    {
      id: 3,
      title: "Practice Problem Set — Flux & Divergence",
      type: "Worksheet",
      url: "#",
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  FLOATING PARTICLES                                               */
/* ═══════════════════════════════════════════════════════════════════ */

function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 4,
            height: 2 + Math.random() * 4,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background:
              i % 3 === 0
                ? "rgba(140, 48, 232, 0.4)"
                : i % 3 === 1
                ? "rgba(236, 72, 153, 0.3)"
                : "rgba(255, 215, 0, 0.3)",
          }}
          animate={{
            y: [0, -40 - Math.random() * 60, 0],
            x: [0, (Math.random() - 0.5) * 30, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  METRIC CARD WITH GLOW                                            */
/* ═══════════════════════════════════════════════════════════════════ */

function GlowMetric({
  icon,
  label,
  value,
  glowColor,
  bgColor,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  glowColor: string;
  bgColor: string;
  delay: number;
}) {
  return (
    <motion.div
      className={`relative flex flex-col items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 p-4 ${bgColor} overflow-hidden`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.03, y: -2 }}
    >
      {/* glow orb */}
      <div
        className={`absolute -top-6 h-20 w-20 rounded-full blur-2xl ${glowColor}`}
      />
      <div className="relative z-10">{icon}</div>
      <span className="relative z-10 text-xl font-bold text-slate-900 dark:text-white">
        {value}
      </span>
      <span className="relative z-10 text-xs font-medium text-slate-500 dark:text-white/50">
        {label}
      </span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  DIAMOND RATING                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

function DiamondRating() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating > 0) setSubmitted(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {submitted ? (
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <CheckCircle2 size={32} className="text-emerald-400" />
          <p className="text-sm font-medium text-slate-500 dark:text-white/70">
            Thanks for your feedback!
          </p>
        </motion.div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((d) => (
              <motion.button
                key={d}
                onClick={() => setRating(d)}
                onMouseEnter={() => setHover(d)}
                onMouseLeave={() => setHover(0)}
                whileHover={{ scale: 1.2, y: -4 }}
                whileTap={{ scale: 0.9 }}
                className="group relative p-1.5"
              >
                {/* crystal glow behind diamond */}
                {d <= (hover || rating) && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/30 blur-lg"
                    layoutId={`glow-${d}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
                <Diamond
                  size={28}
                  className={`relative z-10 transition-all duration-200 ${
                    d <= (hover || rating)
                      ? "fill-primary text-primary drop-shadow-[0_0_12px_rgba(140,48,232,0.6)]"
                      : "text-slate-300 dark:text-white/20"
                  }`}
                />
              </motion.button>
            ))}
          </div>
          {rating > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleSubmit}
              className="rounded-xl bg-primary/20 px-5 py-2 text-sm font-medium text-primary transition hover:bg-primary/30"
            >
              Submit Rating
            </motion.button>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

export default function SessionSummaryPage() {
  const s = sessionSummary;

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      {/* ── ambient gradient background ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[160px]" />
        <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-pink-500/6 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      <FloatingParticles />

      {/* ── content ── */}
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* back link */}
        <BackButton
          href="/dashboard/sessions"
          label="Back to sessions"
          className="mb-6"
        />

        {/* ── hero: avatar + title ── */}
        <motion.div
          className="mb-8 flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* glowing avatar */}
          <div className="relative mb-4">
            <motion.div
              className="absolute -inset-3 rounded-full bg-[#7C3AED]    blur-xl"
              animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/40 bg-[#7C3AED]     text-lg font-bold text-primary shadow-[0_0_30px_rgba(140,48,232,0.3)]">
              {s.mentorAvatar}
            </div>
            {/* rank badge */}
            <motion.div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-amber-500/40 bg-white/90 dark:bg-slate-900/90 px-3 py-0.5 text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-400 backdrop-blur-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center gap-1">
                <Award size={10} />
                {s.mentorRank}
              </div>
            </motion.div>
          </div>

          <h1 className="text-shimmer mb-1 text-xl font-bold sm:text-2xl">
            Session Complete
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/40">
            with {s.mentorName} · {s.date}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/60">{s.subject}</p>
        </motion.div>

        {/* ── metric cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <GlowMetric
            icon={
              <Zap
                size={22}
                className="text-amber-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]"
              />
            }
            label="XP Earned"
            value={`+${s.xpEarned}`}
            glowColor="bg-amber-400/20"
            bgColor="bg-amber-500/5"
            delay={0.1}
          />
          <GlowMetric
            icon={
              <Clock
                size={22}
                className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"
              />
            }
            label="Duration"
            value={s.duration}
            glowColor="bg-blue-400/20"
            bgColor="bg-blue-500/5"
            delay={0.2}
          />
          <GlowMetric
            icon={
              <Brain
                size={22}
                className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              />
            }
            label="Focus Score"
            value={`${s.focusScore}%`}
            glowColor="bg-emerald-400/20"
            bgColor="bg-emerald-500/5"
            delay={0.3}
          />
          <GlowMetric
            icon={
              <TrendingUp
                size={22}
                className="text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]"
              />
            }
            label="Knowledge"
            value={`${s.knowledgeGained}%`}
            glowColor="bg-pink-400/20"
            bgColor="bg-pink-500/5"
            delay={0.4}
          />
        </div>

        {/* ── AI summary section ── */}
        <motion.div
          className="mb-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">
              The Essence of the Session
            </h2>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-slate-600 dark:text-white/70">
            {s.aiSummary}
          </p>

          {/* key takeaways checklist */}
          <ul className="space-y-2.5">
            {s.keyTakeaways.map((item, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-white/60"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* ── shared resources ── */}
        <motion.div
          className="mb-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">
              Shared Wisdom
            </h2>
          </div>
          <div className="space-y-2">
            {s.sharedResources.map((res) => (
              <motion.a
                key={res.id}
                href={res.url}
                className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] px-4 py-3 transition hover:border-primary/30 hover:bg-primary/5"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <FileText size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-white/80">
                      {res.title}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-white/30">{res.type}</p>
                  </div>
                </div>
                <ExternalLink size={14} className="text-slate-300 dark:text-white/20" />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* ── rate the experience ── */}
        <motion.div
          className="mb-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4 text-center backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">
            Rate the Experience
          </h2>
          <p className="mb-5 text-xs text-slate-400 dark:text-white/30">
            How would you rate this session?
          </p>
          <DiamondRating />
        </motion.div>

        {/* ── bottom actions ── */}
        <motion.div
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Link
            href="/dashboard/sessions"
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-6 py-3 text-sm font-medium text-slate-600 dark:text-white/60 transition hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-800 dark:hover:text-white/80"
          >
            Return to Sessions
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:shadow-xl hover:shadow-primary/30"
          >
            <Star size={16} />
            Continue Learning
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

