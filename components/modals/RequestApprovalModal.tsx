"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // <-- NAYI LINE: Router import
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  X,
  CheckCircle,
  XCircle,
  MessageCircle,
  Brain,
  GraduationCap,
  Quote,
  Sparkles,
} from "lucide-react";

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

interface SubjectGrade {
  subject: string;
  grade: string;
  percent: number;
}

export interface StudentRequestData {
  name: string;
  initials: string;
  tagline: string;
  focusScore: number;
  subjects: SubjectGrade[];
  personalMessage: string;
}

interface RequestApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: StudentRequestData;
}

/* ────────────────────────────────────────────────
   Default / Mock Student Data
   ──────────────────────────────────────────────── */

export const DEFAULT_STUDENT: StudentRequestData = {
  name: "Aria Chen",
  initials: "AC",
  tagline: "Aspiring mathematician & AI enthusiast",
  focusScore: 88,
  subjects: [
    { subject: "Calculus II", grade: "A-", percent: 90 },
    { subject: "Physics", grade: "B+", percent: 82 },
    { subject: "Linear Algebra", grade: "B", percent: 76 },
    { subject: "Statistics", grade: "A", percent: 94 },
  ],
  personalMessage:
    "I am struggling with Linear Algebra, especially eigenvalues and eigenvectors. I really want to build a strong mathematical foundation before diving into machine learning. I've heard amazing things about your teaching style and would love your guidance!",
};

/* ────────────────────────────────────────────────
   Grade bar colour helper
   ──────────────────────────────────────────────── */

function gradeBarColor(pct: number) {
  if (pct >= 90) return "from-emerald-500 to-teal-400";
  if (pct >= 80) return "from-blue-500 to-cyan-400";
  if (pct >= 70) return "from-amber-500 to-yellow-400";
  return "from-rose-500 to-pink-400";
}

/* ────────────────────────────────────────────────
   Animation Variants
   ──────────────────────────────────────────────── */

const panelVariants: Variants = {
  initial: { x: "100%" },
  animate: {
    x: 0,
    transition: { type: "spring", damping: 28, stiffness: 300 },
  },
  exit: { x: "100%", transition: { duration: 0.25 } },
};

const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

/* ────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────── */

export default function RequestApprovalModal({
  isOpen,
  onClose,
  studentData,
}: RequestApprovalModalProps) {
  const router = useRouter(); // <-- NAYI LINE: Router hook

  /* Navigation handler for message button */
  const handleMessageClick = () => {
    onClose(); // Pehle modal band karein
    router.push("/dashboard/messages"); // Phir chat screen par le jayen
  };

  /* lock body scroll */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const { name, initials, tagline, focusScore, subjects, personalMessage } =
    studentData;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
          />

          {/* ── Slide-over Panel ── */}
          <motion.div
            className="fixed inset-y-0 right-0 z-[100] w-full max-w-md flex flex-col bg-white dark:bg-[#191121] border-l border-border shadow-2xl"
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-slate-50/80 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Mentorship Request
                  </h2>
                  <span className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary animate-pulse">
                    <Sparkles size={12} />
                    Incoming Application
                  </span>
                </div>
              </div>
              <button
                onClick={onClose} // <-- YAHAN BHI CLOSE LOGIC ADD KI
                className="p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
                aria-label="Close panel"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* ─── Profile Card ─── */}
              <motion.div
                className="flex flex-col items-center text-center"
                {...fadeUp}
                transition={{ delay: 0.1 }}
              >
                {/* Avatar with glow */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_20px_rgba(140,48,232,0.4)]">
                    {initials}
                  </div>
                  {/* Aura ring */}
                  <div className="absolute -inset-1.5 rounded-full border-2 border-primary/30 animate-pulse pointer-events-none" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{name}</h3>
                <p className="text-sm text-muted-foreground mt-1 italic">
                  &ldquo;{tagline}&rdquo;
                </p>
              </motion.div>

              {/* ─── Academic Snapshot ─── */}
              <motion.section {...fadeUp} transition={{ delay: 0.2 }}>
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap size={16} className="text-primary" />
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Academic Snapshot
                  </h4>
                </div>

                {/* Focus Score highlight */}
                <div className="flex items-center gap-4 mb-5 p-4 rounded-xl border border-border bg-white/60 dark:bg-white/5 backdrop-blur-md">
                  <div className="relative w-16 h-16 shrink-0">
                    {/* Circular highlight */}
                    <svg
                      className="w-full h-full -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        strokeWidth="3"
                        className="stroke-slate-200 dark:stroke-white/10"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        strokeWidth="3"
                        strokeDasharray={`${focusScore} ${100 - focusScore}`}
                        strokeLinecap="round"
                        className="stroke-primary"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                      {focusScore}%
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Brain size={14} className="text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        Avg. Focus Score
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Top 15% among peer applicants
                    </p>
                  </div>
                </div>

                {/* Subject Grades */}
                <div className="space-y-3">
                  {subjects.map((s) => (
                    <div key={s.subject}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground font-medium">
                          {s.subject}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">
                          {s.grade}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${gradeBarColor(s.percent)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${s.percent}%` }}
                          transition={{ duration: 0.7, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* ─── Personal Appeal ─── */}
              <motion.section {...fadeUp} transition={{ delay: 0.35 }}>
                <div className="flex items-center gap-2 mb-3">
                  <Quote size={16} className="text-primary" />
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Personal Appeal
                  </h4>
                </div>
                <blockquote className="relative rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4">
                  <Quote
                    size={28}
                    className="absolute -top-3 -left-2 text-primary/20"
                  />
                  <p className="text-sm leading-relaxed text-foreground/90 pl-3">
                    {personalMessage}
                  </p>
                </blockquote>
              </motion.section>
            </div>

            {/* ── Sticky Footer ── */}
            <div className="px-6 py-4 border-t border-border bg-slate-50/80 dark:bg-white/5 space-y-3">
              {/* Accept button */}
              <button 
                onClick={onClose} // <-- YAHAN ONCLICK ADD KIYA
                className="relative w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow overflow-hidden"
              >
                {/* Shine */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[glow-slide_3s_linear_infinite]" />
                <CheckCircle size={16} />
                Accept Request
              </button>

              {/* Secondary row */}
              <div className="flex gap-3">
                <button 
                  onClick={onClose} // <-- YAHAN ONCLICK ADD KIYA
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  <XCircle size={15} />
                  Decline
                </button>
                <button 
                  onClick={handleMessageClick} // <-- YAHAN CHAT PAR BHEJNE KA LOGIC ADD KIYA
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-foreground bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                >
                  <MessageCircle size={15} />
                  Message
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}