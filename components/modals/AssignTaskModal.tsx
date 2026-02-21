"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  X,
  Check,
  Send,
  Calendar,
  Brain,
  Code,
  FlaskConical,
  FileText,
  Target,
  Sparkles,
} from "lucide-react";

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentAvatar?: string;
}

interface AIResource {
  id: string;
  title: string;
  type: string;
  difficulty: "Easy" | "Medium" | "Hard";
  duration: string;
  icon: React.ReactNode;
  boostPercent: number;
}

/* ────────────────────────────────────────────────
   Mock Data
   ──────────────────────────────────────────────── */

const AI_RESOURCES: AIResource[] = [
  {
    id: "r1",
    title: "Linear Algebra Quiz",
    type: "Quiz",
    difficulty: "Medium",
    duration: "20 min",
    icon: <Brain size={18} />,
    boostPercent: 15,
  },
  {
    id: "r2",
    title: "Python Debug Challenge",
    type: "Challenge",
    difficulty: "Hard",
    duration: "35 min",
    icon: <Code size={18} />,
    boostPercent: 20,
  },
  {
    id: "r3",
    title: "Chemistry Lab Sim",
    type: "Simulation",
    difficulty: "Medium",
    duration: "25 min",
    icon: <FlaskConical size={18} />,
    boostPercent: 12,
  },
  {
    id: "r4",
    title: "Essay Structure Guide",
    type: "Reading",
    difficulty: "Easy",
    duration: "15 min",
    icon: <FileText size={18} />,
    boostPercent: 8,
  },
];

const QUICK_REPLIES = [
  "You've got this! 💪",
  "Focus on accuracy!",
  "Take your time 🧘",
  "Let's crush this goal!",
  "Ask me if you need help!",
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15",
  Medium: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15",
  Hard: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/15",
};

/* ────────────────────────────────────────────────
   Panel Variants
   ──────────────────────────────────────────────── */

const panelVariants: Variants = {
  initial: { x: "100%" },
  animate: { x: 0, transition: { type: "spring", damping: 28, stiffness: 300 } },
  exit: { x: "100%", transition: { duration: 0.25 } },
};

const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/* ────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────── */

export default function AssignTaskModal({
  isOpen,
  onClose,
  studentName,
}: AssignTaskModalProps) {
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

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

  /* helpers */
  const toggleResource = (id: string) => {
    setSelectedResources((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const totalBoost = AI_RESOURCES.filter((r) =>
    selectedResources.includes(r.id),
  ).reduce((acc, r) => acc + r.boostPercent, 0);

  const handleSend = () => {
    setIsSending(true);
    // Simulate send
    setTimeout(() => {
      setIsSending(false);
      setSelectedResources([]);
      setDueDate("");
      setPersonalMessage("");
      onClose();
    }, 1500);
  };

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
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Assign Task
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  for{" "}
                  <span className="font-semibold text-primary">
                    {studentName}
                  </span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
                aria-label="Close panel"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* ─── AI-Generated Resources ─── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    AI-Generated Resources
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {AI_RESOURCES.map((resource) => {
                    const isSelected = selectedResources.includes(resource.id);
                    return (
                      <motion.button
                        key={resource.id}
                        onClick={() => toggleResource(resource.id)}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left ${
                          isSelected
                            ? "border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/30"
                            : "border-border bg-white dark:bg-white/5 hover:border-primary/40"
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-slate-100 dark:bg-white/10 text-muted-foreground"
                          }`}
                        >
                          {resource.icon}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {resource.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${DIFFICULTY_COLORS[resource.difficulty]}`}
                            >
                              {resource.difficulty}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {resource.duration}
                            </span>
                          </div>
                        </div>

                        {/* Checkmark */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? "bg-primary text-white"
                              : "border-2 border-slate-300 dark:border-white/20"
                          }`}
                        >
                          {isSelected && <Check size={14} />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </section>

              {/* ─── Goal Alignment ─── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Goal Alignment
                  </h3>
                </div>
                <div className="rounded-xl border border-border bg-white dark:bg-white/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Weekly Goal Impact
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {totalBoost > 0 ? `+${totalBoost}% Boost` : "Select tasks"}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(totalBoost, 100)}%` }}
                      transition={{ type: "spring", damping: 20 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedResources.length === 0
                      ? "Select resources above to see goal impact."
                      : `${selectedResources.length} task(s) selected — this will push ${studentName} closer to their weekly target.`}
                  </p>
                </div>
              </section>

              {/* ─── Customization ─── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Customization
                  </h3>
                </div>

                {/* Due Date */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  />
                </div>

                {/* Personal Message */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Personal Message
                  </label>
                  <textarea
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    rows={3}
                    placeholder="Add an encouraging note..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-shadow"
                  />
                  {/* Quick Reply Pills */}
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => setPersonalMessage(reply)}
                        className="px-3 py-1 text-xs font-medium rounded-full border border-border bg-slate-50 dark:bg-white/5 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* ── Sticky Footer ── */}
            <div className="px-6 py-4 border-t border-border bg-slate-50/80 dark:bg-white/5">
              <button
                onClick={handleSend}
                disabled={selectedResources.length === 0 || isSending}
                className="relative w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-shadow overflow-hidden"
              >
                {/* Shine animation */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[glow-slide_3s_linear_infinite]" />
                {isSending ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="inline-block"
                    >
                      ⏳
                    </motion.span>
                    Sending…
                  </span>
                ) : (
                  <>
                    <Send size={16} />
                    Send Assignment
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
