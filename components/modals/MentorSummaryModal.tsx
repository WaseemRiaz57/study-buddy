"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  Brain,
  TrendingUp,
  Sparkles,
  Save,
  CheckCircle2,
  ChevronRight,
  FileText,
  Star,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════ */
/*  TYPES                                                            */
/* ═══════════════════════════════════════════════════════════════════ */

interface MentorSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalize?: () => void;
  sessionData?: {
    studentName: string;
    studentAvatar: string;
    subject: string;
    duration: string;
    focusScore: number;
    knowledgeGained: number;
    aiSummary: string;
    topicsCovered: string[];
  };
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  DEFAULT DATA                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

const defaultSession = {
  studentName: "Sarah J.",
  studentAvatar: "SJ",
  subject: "Calculus III — Vector Fields",
  duration: "58 min",
  focusScore: 92,
  knowledgeGained: 87,
  aiSummary:
    "The session focused primarily on the divergence theorem and its applications to vector fields. Sarah demonstrated strong conceptual understanding of surface integrals but needed additional guidance on setting up the bounds for triple integrals. A breakthrough moment occurred when connecting divergence to the physical interpretation of flux density.",
  topicsCovered: [
    "Divergence theorem proof walkthrough",
    "Surface integral setup & bounds",
    "Flux density physical interpretation",
    "Practice problems #4–#7 from midterm review",
  ],
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  METRIC CARD                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

function MetricCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}
      >
        {icon}
      </div>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

export default function MentorSummaryModal({
  isOpen,
  onClose,
  onFinalize,
  sessionData,
}: MentorSummaryModalProps) {
  const session = sessionData ?? defaultSession;
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isFinalized, setIsFinalized] = useState(false);

  /* Lock body scroll */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleFinalize = () => {
    setIsFinalized(true);
    onFinalize?.();
    setTimeout(() => onClose(), 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        /* ── backdrop ── */
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* ── modal card ── */}
          <motion.div
            className="relative mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── success overlay ── */}
            <AnimatePresence>
              {isFinalized && (
                <motion.div
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-card/95 backdrop-blur-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      damping: 15,
                      stiffness: 200,
                    }}
                  >
                    <CheckCircle2
                      size={64}
                      className="text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    />
                  </motion.div>
                  <p className="text-lg font-semibold text-foreground">
                    Session Logged Successfully
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Summary sent to {session.studentName}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── header ── */}
            <div className="relative flex items-center justify-between border-b border-border px-6 py-5">
              {/* shimmer title */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-shimmer text-lg font-bold">
                    Session Complete
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {session.subject}
                  </p>
                </div>
              </div>

              {/* close button */}
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* ── scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-none">
              {/* student info row */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {session.studentAvatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {session.studentName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.subject}
                  </p>
                </div>
              </div>

              {/* ── impact metrics ── */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Impact Metrics
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    icon={<Clock size={20} className="text-blue-400" />}
                    label="Duration"
                    value={session.duration}
                    color="bg-blue-500/10"
                    delay={0.1}
                  />
                  <MetricCard
                    icon={<Brain size={20} className="text-emerald-400" />}
                    label="Focus Score"
                    value={`${session.focusScore}%`}
                    color="bg-emerald-500/10"
                    delay={0.2}
                  />
                  <MetricCard
                    icon={
                      <TrendingUp size={20} className="text-amber-400" />
                    }
                    label="Knowledge Gained"
                    value={`${session.knowledgeGained}%`}
                    color="bg-amber-500/10"
                    delay={0.3}
                  />
                </div>
              </div>

              {/* ── AI summary ── */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    AI Summary Preview
                  </h3>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {session.aiSummary}
                  </p>
                </div>
              </div>

              {/* ── topics covered checklist ── */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Topics Covered
                  </h3>
                </div>
                <ul className="space-y-2">
                  {session.topicsCovered.map((topic, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-foreground/80"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                    >
                      <ChevronRight
                        size={14}
                        className="mt-0.5 shrink-0 text-primary"
                      />
                      {topic}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* ── session rating ── */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Session Rating
                </h3>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="rounded-lg p-1 transition hover:scale-110"
                    >
                      <Star
                        size={24}
                        className={`transition-colors ${
                          star <= (hoverRating || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <motion.span
                      className="ml-2 text-sm text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {rating}/5
                    </motion.span>
                  )}
                </div>
              </div>

              {/* ── private educator notes ── */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Private Educator Notes
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record observations, next steps, or areas to focus on..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
                <p className="mt-1.5 text-xs text-muted-foreground/60">
                  These notes are private and only visible to you.
                </p>
              </div>
            </div>

            {/* ── sticky footer ── */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <button
                onClick={onClose}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Save Draft
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinalize}
                disabled={isFinalized}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:shadow-xl hover:shadow-primary/30 disabled:opacity-60"
              >
                <Save size={16} />
                Finalize & Log Session
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
