"use client";

import React, { useState } from "react";
import Link from "next/link"; // <-- Added this line
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  TrendingUp,
  Star,
  ChevronLeft,
  ChevronRight,
  Video,
  Clock,
  User,
  Award,
  Settings,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════ */
/* TYPES                                                              */
/* ═══════════════════════════════════════════════════════════════════ */

type EventColor = "emerald" | "purple" | "blue";

interface TimelineEvent {
  title: string;
  time: string;
  color: EventColor;
  student?: string;
}

interface AgendaSession {
  id: number;
  title: string;
  student: string;
  avatar: string;
  time: string;
  timeEnd?: string;
  endingIn?: string;
  isActive?: boolean;
}

interface PendingRequest {
  id: number;
  title: string;
  student: string;
  duration: string;
}

/* ═══════════════════════════════════════════════════════════════════ */
/* MOCK DATA                                                          */
/* ═══════════════════════════════════════════════════════════════════ */

const stats = [
  { label: "Total Sessions", value: "42", trend: "12%", icon: TrendingUp },
  { label: "Hours Mentored", value: "85h", trend: "5%", icon: TrendingUp },
  { label: "Student Rating", value: "4.9", trend: "+0.1", icon: Star },
];

/* Days header: name + date, with Tue as "today" */
const weekDays = [
  { name: "Mon", date: 23 },
  { name: "Tue", date: 24, isToday: true },
  { name: "Wed", date: 25 },
  { name: "Thu", date: 26 },
  { name: "Fri", date: 27 },
];

/* Grid events mapped by [hourIndex][dayIndex] — null = empty cell */
type CellData = TimelineEvent | null;

const timelineGrid: CellData[][] = [
  // 9 AM row  — Mon, Tue, Wed, Thu, Fri
  [
    { title: "Math: Calculus", time: "9:00 - 10:00", color: "emerald" },
    null,
    { title: "Python Basics", time: "9:00 - 10:30", color: "purple" },
    null,
    { title: "Math: Algebra", time: "9:00 - 10:00", color: "emerald" },
  ],
  // 10 AM row
  [
    null,
    {
      title: "Physics: Mechanics",
      time: "10:00 - 11:00",
      color: "blue",
      student: "Alice M.",
    },
    null,
    { title: "Java Advanced", time: "10:00 - 11:30", color: "purple" },
    null,
  ],
  // 11 AM row
  [
    { title: "Web Dev: React", time: "11:00 - 12:00", color: "purple" },
    null,
    { title: "Math: Geometry", time: "11:00 - 12:00", color: "emerald" },
    null,
    { title: "Physics: Optics", time: "11:00 - 12:00", color: "blue" },
  ],
];

const hourLabels = ["9 AM", "10 AM", "11 AM", "12 PM"];

const agendaSessions: AgendaSession[] = [
  {
    id: 1,
    title: "Physics: Mechanics",
    student: "Alice M.",
    avatar: "AM",
    time: "10:00 AM",
    timeEnd: "11:00 AM",
    endingIn: "Ending in 15m",
    isActive: true,
  },
  {
    id: 2,
    title: "Math: Trig",
    student: "Tom H.",
    avatar: "TH",
    time: "2:00 PM",
  },
  {
    id: 3,
    title: "Coding: React",
    student: "Sarah J.",
    avatar: "SJ",
    time: "4:30 PM",
  },
];

const initialRequests: PendingRequest[] = [
  {
    id: 1,
    title: "Intro to Physics",
    student: "Mike T.",
    duration: "45m",
  },
  {
    id: 2,
    title: "Calculus Review",
    student: "Jen L.",
    duration: "60m",
  },
];

/* ═══════════════════════════════════════════════════════════════════ */
/* COLOR MAP                                                          */
/* ═══════════════════════════════════════════════════════════════════ */

const colorMap: Record<
  EventColor,
  {
    bg: string;
    border: string;
    title: string;
    sub: string;
    ring: string;
  }
> = {
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    border: "border-emerald-200 dark:border-emerald-800/50",
    title: "text-emerald-800 dark:text-emerald-300",
    sub: "text-emerald-600 dark:text-emerald-400",
    ring: "hover:ring-2 hover:ring-emerald-400",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/40",
    border: "border-purple-200 dark:border-purple-800/50",
    title: "text-purple-800 dark:text-purple-300",
    sub: "text-purple-600 dark:text-purple-400",
    ring: "hover:ring-2 hover:ring-purple-400",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/40",
    border: "border-blue-200 dark:border-blue-800/50",
    title: "text-blue-800 dark:text-blue-300",
    sub: "text-blue-600 dark:text-blue-400",
    ring: "hover:ring-2 hover:ring-blue-400",
  },
};

/* ═══════════════════════════════════════════════════════════════════ */
/* SUB-COMPONENTS                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

/** Stat card */
function StatCard({
  stat,
  i,
}: {
  stat: (typeof stats)[number];
  i: number;
}) {
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08 }}
      className="p-5 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1"
    >
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {stat.label}
      </span>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {stat.value}
        </span>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
          <Icon className="w-3.5 h-3.5" />
          {stat.trend}
        </span>
      </div>
    </motion.div>
  );
}

/** Single timeline cell */
function TimelineCell({
  event,
  isToday,
  showTimeLine,
}: {
  event: CellData;
  isToday: boolean;
  showTimeLine: boolean;
}) {
  const todayBg = isToday ? "bg-primary/5 dark:bg-primary/5" : "";
  const c = event ? colorMap[event.color] : null;

  return (
    <div
      className={`border-r border-b border-slate-200 dark:border-slate-800 h-24 relative ${todayBg} ${
        event ? "p-1" : ""
      }`}
    >
      {/* Current time indicator */}
      {showTimeLine && (
        <div className="absolute top-1/2 left-0 w-full border-t-2 border-red-500 z-20 flex items-center pointer-events-none">
          <div className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
        </div>
      )}

      {event && c && (
        <div
          className={`w-full h-full ${c.bg} border ${c.border} rounded-md p-2 ${c.ring} hover:shadow-md transition-all cursor-pointer`}
        >
          <p className={`text-xs font-bold ${c.title} truncate`}>
            {event.title}
          </p>
          {event.time && (
            <p className={`text-[10px] ${c.sub} mt-0.5`}>{event.time}</p>
          )}
          {event.student && (
            <div className="flex items-center gap-1 mt-1">
              <div className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center">
                <User className="w-2.5 h-2.5 text-blue-600 dark:text-blue-300" />
              </div>
              <p className={`text-[10px] ${c.sub}`}>{event.student}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Active-now agenda card with shimmer join button */
function ActiveSessionCard({ session }: { session: AgendaSession }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-surface-dark dark:to-slate-900 rounded-xl p-4 border border-primary/30 shadow-lg ring-1 ring-primary/20"
    >
      {/* NOW badge */}
      <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-xs font-bold rounded-bl-lg">
        NOW
      </div>

      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary p-0.5 flex items-center justify-center bg-primary/10 dark:bg-primary/20">
            <span className="text-sm font-bold text-primary">
              {session.avatar}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-surface-dark rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Award className="w-3 h-3 text-amber-500" />
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            {session.title}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {session.student} • Scholar
          </p>
        </div>
      </div>

      {/* Time info */}
      <div className="flex items-center gap-2 mb-4 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-lg">
        <Clock className="w-4 h-4 text-primary" />
        <span>
          {session.time} - {session.timeEnd}
        </span>
        <span className="mx-1 text-slate-300">|</span>
        <span className="font-medium text-red-500">{session.endingIn}</span>
      </div>

      {/* 👇 Added Link here to navigate to Prep Room */}
      <Link href={`/dashboard/sessions/${session.id}/prep`} className="block w-full">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="relative w-full py-2.5 bg-primary text-white font-bold rounded-lg overflow-hidden group hover:shadow-lg hover:shadow-primary/40 transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer-slide_2s_infinite]" />
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Video className="w-5 h-5" />
            Join Session
          </span>
        </motion.button>
      </Link>
    </motion.div>
  );
}

/** Upcoming session card */
function UpcomingCard({
  session,
  faded,
}: {
  session: AgendaSession;
  faded?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors ${
        faded ? "opacity-80" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
            {session.avatar}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {session.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {session.student}
            </p>
          </div>
        </div>
        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded">
          {session.time}
        </span>
      </div>

      {!faded && (
        <div className="flex gap-2">
          {/* 👇 Added Link here to navigate to Prep Room */}
          <Link href={`/dashboard/sessions/${session.id}/prep`} className="flex-1">
            <button className="w-full py-1.5 text-xs font-bold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded transition-colors">
              View Prep
            </button>
          </Link>
        </div>
      )}
    </motion.div>
  );
}

/** Pending request card */
function RequestCard({
  req,
  onAccept,
  onReschedule,
}: {
  req: PendingRequest;
  onAccept: () => void;
  onReschedule: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {req.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Requested by {req.student}
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
          {req.duration}
        </span>
      </div>
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAccept}
          className="flex-1 py-1.5 bg-primary text-white text-xs font-bold rounded hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/20"
        >
          Accept
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onReschedule}
          className="flex-1 py-1.5 bg-transparent border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Reschedule
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* MAIN PAGE                                                          */
/* ═══════════════════════════════════════════════════════════════════ */

export default function SessionsPage() {
  const [requests, setRequests] = useState(initialRequests);

  const dismiss = (id: number) =>
    setRequests((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <main className="w-full max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8">
        {/* ─── Page Header ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Session Command
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
              Manage your mentorship schedule and incoming requests.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            
            {/* 👇 LINK TO AVAILABILITY SETTINGS ADDED HERE 👇 */}
            <Link href="/dashboard/sessions/availability">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center p-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm tooltip-trigger relative group"
              >
                <Settings className="w-[18px] h-[18px]" />
                {/* Tooltip */}
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Availability Settings
                </span>
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Calendar className="w-[18px] h-[18px]" />
              Sync Calendar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              <Plus className="w-[18px] h-[18px]" />
              New Session
            </motion.button>
          </div>
        </motion.div>

        {/* ─── Dashboard 12-col Grid ────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* ── LEFT: Stats + Timeline (8 cols) ──────────────────── */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((s, i) => (
                <StatCard key={s.label} stat={s} i={i} />
              ))}
            </div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px] h-full"
            >
              {/* Timeline header bar */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Weekly Timeline
                </h2>
                <div className="flex gap-2 items-center">
                  <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-2">
                    Oct 23 – 29
                  </span>
                  <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable grid */}
              <div className="flex-1 overflow-auto timeline-scroll relative">
                <div className="min-w-[800px] grid grid-cols-[80px_repeat(5,1fr)]">
                  {/* ── Header row ─────────────────────────────────── */}
                  <div className="sticky top-0 z-10 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 py-3" />
                  {weekDays.map((d) => (
                    <div
                      key={d.name}
                      className={`sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 py-3 text-center ${
                        d.isToday
                          ? "text-primary font-bold bg-primary/5 dark:bg-primary/10"
                          : "text-slate-700 dark:text-slate-300 font-bold bg-white dark:bg-surface-dark"
                      }`}
                    >
                      <span className="text-sm">{d.name}</span>
                      <span
                        className={`block text-xs font-normal ${
                          d.isToday
                            ? "text-primary/70"
                            : "text-slate-400"
                        }`}
                      >
                        {d.date}
                      </span>
                    </div>
                  ))}

                  {/* ── Hour rows 9-11 AM ──────────────────────────── */}
                  {hourLabels.slice(0, 3).map((label, rowIdx) => (
                    <React.Fragment key={label}>
                      {/* Hour label */}
                      <div className="border-r border-slate-200 dark:border-slate-800 text-xs text-slate-400 font-medium py-3 px-2 text-right -mt-2.5">
                        {label}
                      </div>

                      {/* 5 day cells */}
                      {weekDays.map((day, colIdx) => (
                        <TimelineCell
                          key={`${rowIdx}-${colIdx}`}
                          event={timelineGrid[rowIdx]?.[colIdx] ?? null}
                          isToday={!!day.isToday}
                          showTimeLine={
                            /* show the red line on Tue 10 AM cell */
                            !!day.isToday && rowIdx === 1
                          }
                        />
                      ))}
                    </React.Fragment>
                  ))}

                  {/* ── 12 PM — Lunch Break row ────────────────────── */}
                  <div className="border-r border-slate-200 dark:border-slate-800 text-xs text-slate-400 font-medium py-3 px-2 text-right -mt-2.5">
                    12 PM
                  </div>
                  <div className="col-span-5 border-b border-slate-200 dark:border-slate-800 h-24 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      Lunch Break
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT: Agenda + Requests (4 cols) ────────────────── */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            {/* Today's Agenda */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-4 flex flex-col h-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Today&apos;s Agenda
                </h3>
                <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  View All
                </button>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                {agendaSessions.map((s, idx) =>
                  s.isActive ? (
                    <ActiveSessionCard key={s.id} session={s} />
                  ) : (
                    <UpcomingCard
                      key={s.id}
                      session={s}
                      faded={idx === agendaSessions.length - 1}
                    />
                  )
                )}
              </div>
            </motion.div>

            {/* Pending Requests */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-bold">
                  {requests.length}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Pending Requests
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {requests.map((r) => (
                    <RequestCard
                      key={r.id}
                      req={r}
                      onAccept={() => dismiss(r.id)}
                      onReschedule={() => dismiss(r.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}