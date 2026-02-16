"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Clock,
  Play,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Video,
  MessageSquare,
  Briefcase,
  Award,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Shared Mentor type (re-exported from page)                         */
/* ------------------------------------------------------------------ */
export interface Mentor {
  id: number;
  name: string;
  role: string;
  company: string;
  hourlyRate: number;
  rating: number;
  reviews: number;
  avatar: string;
  tags: string[];
  category: string;
  bio: string;
  available: boolean;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor;
  onConfirm: (mentor: Mentor, date: Date, time: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Calendar helpers                                                   */
/* ------------------------------------------------------------------ */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeToday(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function isWeekend(date: Date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

/* ------------------------------------------------------------------ */
/*  Time slot data                                                     */
/* ------------------------------------------------------------------ */
const MORNING_SLOTS = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"];
const AFTERNOON_SLOTS = ["1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"];

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-muted dark:text-slate-500">{label}</p>
        <p className="text-sm font-bold text-text-main dark:text-white">{value}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BookingModal                                                       */
/* ------------------------------------------------------------------ */
export default function BookingModal({
  isOpen,
  onClose,
  mentor,
  onConfirm,
}: BookingModalProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  /* Reset selections when mentor changes */
  useEffect(() => {
    setSelectedDate(null);
    setSelectedTime(null);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }, [mentor, today]);

  /* Lock body scroll when open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* Calendar grid */
  const calendarCells = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const cells: (Date | null)[] = Array.from({ length: firstDay }, () => null);

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }

    /* Pad trailing so grid is always a full rectangle */
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [viewYear, viewMonth]);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const canConfirm = selectedDate !== null && selectedTime !== null;

  const initials = mentor.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  /* Formatted selected date */
  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        /* ── Backdrop ── */
        <motion.div
          key="booking-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* ── Slide-over panel ── */}
          <motion.div
            key="booking-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-full w-full max-w-3xl flex-col border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f0a16] shadow-2xl overflow-hidden"
          >
            {/* Gradient accent top */}
            <div className="h-1 w-full shrink-0 bg-gradient-to-r from-primary via-purple-400 to-primary/60" />

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/70 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <CalendarDays size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-text-main dark:text-white">
                  Schedule a Session
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* ── Body — two columns ── */}
            <div className="flex flex-1 min-h-0">
              {/* ========== LEFT COLUMN — Mentor Profile (sticky) ========== */}
              <div className="hidden md:flex md:w-[280px] lg:w-[320px] shrink-0 flex-col border-r border-slate-200/70 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="sticky top-0 p-5 space-y-5 overflow-y-auto h-full scrollbar-thin">
                  {/* Avatar + Name */}
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-400 text-white font-bold text-2xl ring-4 ring-primary/20 shadow-lg shadow-primary/20">
                      {initials}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text-main dark:text-white">
                        {mentor.name}
                      </h3>
                      <p className="text-sm text-text-muted dark:text-slate-400">
                        {mentor.role}
                      </p>
                      <p className="text-xs text-text-muted/70 dark:text-slate-500">
                        {mentor.company}
                      </p>
                    </div>
                    {/* Availability badge */}
                    {mentor.available && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-400/10 rounded-full px-3 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        Available Now
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-text-muted dark:text-slate-400 leading-relaxed text-center">
                    {mentor.bio}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {mentor.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-primary/10 dark:bg-primary/15 text-primary dark:text-purple-300 border border-primary/20 dark:border-purple-400/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200/70 dark:border-white/10" />

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      icon={<Star size={16} fill="currentColor" className="text-amber-500" />}
                      label="Rating"
                      value={`${mentor.rating.toFixed(1)} (${mentor.reviews})`}
                    />
                    <StatCard
                      icon={<Clock size={16} />}
                      label="Rate"
                      value={`$${mentor.hourlyRate}/hr`}
                    />
                    <StatCard
                      icon={<Award size={16} />}
                      label="Sessions"
                      value={`${mentor.reviews * 3}+`}
                    />
                    <StatCard
                      icon={<MessageSquare size={16} />}
                      label="Response"
                      value="< 2 hrs"
                    />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200/70 dark:border-white/10" />

                  {/* Video Intro placeholder */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-slate-500">
                      Video Intro
                    </p>
                    <div className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/[0.02] border border-slate-200/70 dark:border-white/10 aspect-video overflow-hidden group cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-400/5 dark:from-primary/10 dark:to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                        <Play size={20} fill="currentColor" />
                      </div>
                      <p className="absolute bottom-2 text-[10px] font-medium text-text-muted dark:text-slate-500">
                        2:30 min
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========== RIGHT COLUMN — Calendar & Time ========== */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
                {/* ─ Mobile mentor summary (visible below md) ─ */}
                <div className="flex md:hidden items-center gap-3 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-400 text-white font-bold text-sm">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text-main dark:text-white truncate">
                      {mentor.name}
                    </p>
                    <p className="text-xs text-text-muted dark:text-slate-400 truncate">
                      {mentor.role} · ${mentor.hourlyRate}/hr
                    </p>
                  </div>
                </div>

                {/* ─ Calendar ─ */}
                <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-md p-4 md:p-5">
                  {/* Month nav */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={prevMonth}
                      className="p-2 rounded-lg text-text-muted dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h3 className="text-sm font-bold text-text-main dark:text-white">
                      {MONTHS[viewMonth]} {viewYear}
                    </h3>
                    <button
                      onClick={nextMonth}
                      className="p-2 rounded-lg text-text-muted dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-2">
                    {DAYS.map((d) => (
                      <div
                        key={d}
                        className="text-center text-[11px] font-semibold uppercase tracking-wider text-text-muted dark:text-slate-500 py-1"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Date cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarCells.map((date, i) => {
                      if (!date) {
                        return <div key={`empty-${i}`} className="aspect-square" />;
                      }

                      const disabled = isBeforeToday(date) || isWeekend(date);
                      const isToday = isSameDay(date, today);
                      const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;

                      return (
                        <button
                          key={date.toISOString()}
                          disabled={disabled}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedTime(null);
                          }}
                          className={`
                            relative aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                            ${disabled
                              ? "text-slate-300 dark:text-white/15 cursor-not-allowed"
                              : isSelected
                                ? "bg-gradient-to-br from-primary to-purple-400 text-white shadow-md shadow-primary/30 scale-105"
                                : isToday
                                  ? "ring-2 ring-primary/50 text-primary font-bold hover:bg-primary/10 dark:hover:bg-primary/15"
                                  : "text-text-main dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                            }
                          `}
                        >
                          {date.getDate()}
                          {isToday && !isSelected && (
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─ Time Slots ─ */}
                <AnimatePresence mode="wait">
                  {selectedDate && (
                    <motion.div
                      key="time-slots"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      {/* Morning */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-slate-200/70 dark:bg-white/10" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-slate-500">
                            Morning
                          </span>
                          <div className="h-px flex-1 bg-slate-200/70 dark:bg-white/10" />
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {MORNING_SLOTS.map((slot) => (
                            <TimeSlotButton
                              key={slot}
                              time={slot}
                              isSelected={selectedTime === slot}
                              onClick={() => setSelectedTime(slot)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Afternoon */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-slate-200/70 dark:bg-white/10" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-slate-500">
                            Afternoon
                          </span>
                          <div className="h-px flex-1 bg-slate-200/70 dark:bg-white/10" />
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {AFTERNOON_SLOTS.map((slot) => (
                            <TimeSlotButton
                              key={slot}
                              time={slot}
                              isSelected={selectedTime === slot}
                              onClick={() => setSelectedTime(slot)}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─ Selection summary ─ */}
                <AnimatePresence mode="wait">
                  {canConfirm && (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-400/20 text-green-700 dark:text-green-400 text-sm"
                    >
                      <CheckCircle2 size={18} className="shrink-0" />
                      <span>
                        <b>{formattedDate}</b> at <b>{selectedTime}</b> — Ready to book!
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="shrink-0 border-t border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-white/[0.02] backdrop-blur-md px-6 py-4">
              <div className="flex items-center gap-3">
                {/* Price summary */}
                <div className="flex-1 hidden sm:block">
                  {canConfirm ? (
                    <p className="text-sm text-text-muted dark:text-slate-400">
                      <span className="font-bold text-text-main dark:text-white text-lg">
                        ${mentor.hourlyRate}
                      </span>{" "}
                      for 1-hour session
                    </p>
                  ) : (
                    <p className="text-sm text-text-muted dark:text-slate-400">
                      Select a date and time to continue
                    </p>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold border border-slate-200 dark:border-white/10 text-text-main dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedDate && selectedTime) {
                      onConfirm(mentor, selectedDate, selectedTime);
                    }
                  }}
                  disabled={!canConfirm}
                  className={`
                    flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all
                    ${canConfirm
                      ? "bg-gradient-to-r from-primary to-purple-400 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
                      : "bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    }
                  `}
                >
                  <CheckCircle2 size={16} />
                  Confirm Booking
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Time Slot Button                                                   */
/* ------------------------------------------------------------------ */
function TimeSlotButton({
  time,
  isSelected,
  onClick,
}: {
  time: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        rounded-xl px-3 py-2.5 text-sm font-medium transition-all border
        ${isSelected
          ? "bg-gradient-to-r from-primary to-purple-400 text-white border-transparent shadow-md shadow-primary/25 scale-[1.03]"
          : "border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] text-text-main dark:text-slate-300 hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 dark:hover:border-primary/30"
        }
      `}
    >
      {time}
    </button>
  );
}
