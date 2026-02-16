import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarPlus,
  ArrowRight,
  Sparkles,
  Star,
  Clock,
  Trophy,
  Zap,
} from "lucide-react";
import type { Mentor } from "./BookingModal";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface SuccessViewProps {
  mentor: Mentor;
  date: Date;
  time: string;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Confetti particle (pure CSS, no extra deps)                        */
/* ------------------------------------------------------------------ */
function ConfettiParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: Math.random() * 2 + 2,
        size: Math.random() * 6 + 4,
        color: [
          "#8c30e8",
          "#a760eb",
          "#c084fc",
          "#ec4899",
          "#f472b6",
          "#fbbf24",
          "#34d399",
          "#60a5fa",
          "#818cf8",
        ][Math.floor(Math.random() * 9)],
        rotation: Math.random() * 360,
        drift: (Math.random() - 0.5) * 120,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            rotate: `${p.rotation}deg`,
          }}
          initial={{ y: -20, opacity: 1, x: 0 }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, p.drift],
            opacity: [1, 1, 0],
            rotate: [p.rotation, p.rotation + 720],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Radial burst rings                                                 */
/* ------------------------------------------------------------------ */
function BurstRings() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-primary/30"
          initial={{ width: 0, height: 0, opacity: 0.7 }}
          animate={{ width: 600, height: 600, opacity: 0 }}
          transition={{ duration: 1.5, delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  XP Progress Bar                                                    */
/* ------------------------------------------------------------------ */
function XpBar() {
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setFill(100), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-text-muted dark:text-slate-400 flex items-center gap-1.5">
          <Zap size={13} className="text-amber-500" />
          XP Earned
        </span>
        <motion.span
          className="font-bold text-primary dark:text-purple-400"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
        >
          +50 XP
        </motion.span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary via-purple-400 to-pink-400 shadow-lg shadow-primary/30"
          initial={{ width: "0%" }}
          animate={{ width: `${fill}%` }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-text-muted dark:text-slate-500">
        <span>Level 4 — 320 XP</span>
        <span>370 / 500 XP</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SuccessView                                                        */
/* ------------------------------------------------------------------ */
export default function SuccessView({
  mentor,
  date,
  time,
  onClose,
}: SuccessViewProps) {
  const initials = mentor.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleAddToCalendar = () => {
    console.log(
      `[Calendar] Add session: ${mentor.name} on ${formattedDate} at ${time}`,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
    >
      {/* Confetti */}
      <ConfettiParticles />

      {/* Burst rings */}
      <BurstRings />

      {/* Glass card */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.15 }}
        className="relative w-full max-w-lg rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {/* Top gradient accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-purple-400 to-pink-400" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* ── Trophy icon ── */}
          <div className="flex flex-col items-center text-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-400/30"
            >
              <Trophy size={36} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="space-y-1"
            >
              <h2 className="text-2xl font-extrabold tracking-tight text-text-main dark:text-white">
                Session Booked!
              </h2>
              <p className="text-sm text-text-muted dark:text-slate-400">
                You&apos;re one step closer to levelling up 🚀
              </p>
            </motion.div>
          </div>

          {/* ── Booking details card ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] p-5 space-y-4"
          >
            {/* Mentor row */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-400 text-white font-bold text-sm ring-2 ring-primary/30 shadow-md shadow-primary/20">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-main dark:text-white truncate">
                  {mentor.name}
                </p>
                <p className="text-xs text-text-muted dark:text-slate-400 truncate">
                  {mentor.role} · {mentor.company}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-amber-500 shrink-0">
                <Star size={13} fill="currentColor" />
                <span className="text-xs font-semibold text-text-main dark:text-white">
                  {mentor.rating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200/60 dark:border-white/[0.08]" />

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 rounded-xl bg-white/70 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.08] px-3.5 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15 text-primary">
                  <CalendarPlus size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-text-muted dark:text-slate-500">
                    Date
                  </p>
                  <p className="text-xs font-bold text-text-main dark:text-white">
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-white/70 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.08] px-3.5 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15 text-primary">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-text-muted dark:text-slate-500">
                    Time
                  </p>
                  <p className="text-xs font-bold text-text-main dark:text-white">
                    {time}
                  </p>
                </div>
              </div>
            </div>

            {/* Session type badge */}
            <div className="flex items-center gap-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/15 dark:border-primary/20 px-3.5 py-2.5">
              <Sparkles size={15} className="text-primary dark:text-purple-400 shrink-0" />
              <span className="text-xs text-text-muted dark:text-slate-400">
                <span className="font-semibold text-text-main dark:text-white">1-on-1 Mentoring</span>{" "}
                · 60 min · ${mentor.hourlyRate}
              </span>
            </div>
          </motion.div>

          {/* ── XP Bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <XpBar />
          </motion.div>

          {/* ── Actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="flex flex-col sm:flex-row gap-3 pt-1"
          >
            <button
              onClick={handleAddToCalendar}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border border-slate-200 dark:border-white/10 text-text-main dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <CalendarPlus size={16} />
              Add to Calendar
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold bg-gradient-to-r from-primary to-purple-400 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Enter Hub
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
