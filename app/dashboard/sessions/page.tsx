"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  Settings,
  Star,
  TrendingUp,
  User,
} from "lucide-react";

type EventColor = "emerald" | "purple" | "blue";
type SessionStatus = "pending" | "accepted" | "declined" | "rejected" | "completed";
type RequestAction = "accepted" | "declined";

type PopulatedStudent = {
  _id?: string;
  name?: string;
  image?: string;
  email?: string;
};

type MentorSession = {
  _id: string;
  studentId?: PopulatedStudent | string;
  subject: string;
  scheduledAt: string;
  duration: number;
  status: SessionStatus;
  roomId?: string;
};

type MentorStats = {
  totalEarnings: number;
  rating: number;
  uniqueStudentsTaught: number;
  upcomingSessions: number;
};

type TimelineEvent = {
  id: string;
  title: string;
  time: string;
  color: EventColor;
  student: string;
};

const START_HOUR = 8;
const END_HOUR = 18;

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

function getStudent(session: MentorSession): PopulatedStudent {
  return typeof session.studentId === "object" && session.studentId !== null
    ? session.studentId
    : {};
}

function getStudentName(session: MentorSession) {
  return getStudent(session).name || "Student";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${suffix}`;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeRange(session: MentorSession) {
  const start = new Date(session.scheduledAt);
  if (Number.isNaN(start.getTime())) return "Time TBD";

  const end = new Date(start.getTime() + session.duration * 60 * 1000);
  return `${formatTime(start.toISOString())} - ${formatTime(end.toISOString())}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMonday(date: Date) {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekDays() {
  const monday = getMonday(new Date());

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      name: date.toLocaleDateString("en-US", { weekday: "short" }),
      date: date.getDate(),
      dateObj: date,
      isToday: isSameDay(date, new Date()),
    };
  });
}

function getSessionColor(session: MentorSession): EventColor {
  if (session.status === "completed") return "emerald";
  if (session.subject.toLowerCase().includes("math")) return "purple";
  return "blue";
}

function buildTimelineGrid(sessions: MentorSession[], weekDays: ReturnType<typeof getWeekDays>) {
  const rows = END_HOUR - START_HOUR + 1;
  const grid: Array<Array<TimelineEvent | null>> = Array.from({ length: rows }, () =>
    Array.from({ length: 5 }, () => null)
  );

  sessions
    .filter((session) => session.status === "accepted" || session.status === "completed")
    .forEach((session) => {
      const scheduledAt = new Date(session.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) return;

      const dayIndex = weekDays.findIndex((day) => isSameDay(day.dateObj, scheduledAt));
      const rowIndex = scheduledAt.getHours() - START_HOUR;

      if (dayIndex < 0 || rowIndex < 0 || rowIndex >= rows) return;

      grid[rowIndex][dayIndex] = {
        id: session._id,
        title: session.subject,
        time: formatTimeRange(session),
        color: getSessionColor(session),
        student: getStudentName(session),
      };
    });

  return grid;
}

function StatCard({
  label,
  value,
  icon: Icon,
  i,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  i: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08 }}
      className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-dark"
    >
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {value}
        </span>
        <span className="flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.div>
  );
}

function TimelineCell({
  event,
  isToday,
}: {
  event: TimelineEvent | null;
  isToday: boolean;
}) {
  const todayBg = isToday ? "bg-primary/5 dark:bg-primary/5" : "";
  const colors = event ? colorMap[event.color] : null;

  return (
    <div
      className={`relative h-24 border-b border-r border-slate-200 dark:border-slate-800 ${todayBg} ${
        event ? "p-1" : ""
      }`}
    >
      {event && colors && (
        <Link
          href={`/dashboard/sessions/${event.id}/prep`}
          className={`block h-full w-full rounded-md border p-2 transition-all hover:shadow-md ${colors.bg} ${colors.border} ${colors.ring}`}
        >
          <p className={`truncate text-xs font-bold ${colors.title}`}>
            {event.title}
          </p>
          <p className={`mt-0.5 text-[10px] ${colors.sub}`}>{event.time}</p>
          <div className="mt-1 flex items-center gap-1">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-200 dark:bg-blue-700">
              <User className="h-2.5 w-2.5 text-blue-600 dark:text-blue-300" />
            </div>
            <p className={`truncate text-[10px] ${colors.sub}`}>{event.student}</p>
          </div>
        </Link>
      )}
    </div>
  );
}

function AgendaCard({ session }: { session: MentorSession }) {
  const studentName = getStudentName(session);
  const student = getStudent(session);
  const initials = getInitials(studentName) || "ST";
  const scheduledAt = new Date(session.scheduledAt);
  const endAt = new Date(scheduledAt.getTime() + session.duration * 60 * 1000);
  const isActive = scheduledAt <= new Date() && endAt > new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 transition-colors ${
        isActive
          ? "border-primary/30 bg-gradient-to-br from-white to-slate-50 shadow-lg ring-1 ring-primary/20 dark:from-surface-dark dark:to-slate-900"
          : "border-slate-200 bg-white hover:border-primary/50 dark:border-slate-700 dark:bg-surface-dark"
      }`}
    >
      {isActive && (
        <div className="mb-3 inline-flex rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white">
          NOW
        </div>
      )}

      <div className="mb-4 flex items-start gap-4">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-primary/10 p-0.5 dark:bg-primary/20">
            {student.image ? (
              <Image
                src={student.image}
                alt={studentName}
                width={48}
                height={48}
                unoptimized
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-primary">{initials}</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-surface-dark">
            <Award className="h-3 w-3 text-amber-500" />
          </div>
        </div>

        <div className="min-w-0">
          <h4 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
            {session.subject}
          </h4>
          <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <User className="h-3.5 w-3.5" />
            {studentName}
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-slate-100 p-2 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
        <Clock className="h-4 w-4 text-primary" />
        <span>{formatTimeRange(session)}</span>
      </div>

      <div className="flex gap-2">
        <Link href={`/dashboard/sessions/${session._id}/prep`} className="flex-1">
          <button className="w-full rounded py-2 text-xs font-bold text-primary border border-primary/20 bg-primary/5 transition-colors hover:bg-primary/10">
            View Prep
          </button>
        </Link>
        {session.status === "accepted" ? (
          <Link href={`/dashboard/study-rooms/${session._id}`} className="flex-1">
            <button className="w-full rounded bg-primary py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90">
              Join Room
            </button>
          </Link>
        ) : (
          <button
            disabled
            className="flex-1 rounded bg-slate-200 py-2 text-xs font-bold text-slate-400 dark:bg-slate-800"
          >
            Join Room
          </button>
        )}
      </div>
    </motion.div>
  );
}

function RequestCard({
  session,
  respondingActionKey,
  onRespond,
}: {
  session: MentorSession;
  respondingActionKey: string;
  onRespond: (id: string, status: RequestAction) => void;
}) {
  const studentName = getStudentName(session);
  const acceptingKey = `${session._id}-accepted`;
  const decliningKey = `${session._id}-declined`;
  const isResponding = respondingActionKey.startsWith(`${session._id}-`);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700/50 dark:bg-slate-800/50"
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {session.subject}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Requested by {studentName}
          </p>
        </div>
        <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
          {session.duration}m
        </span>
      </div>
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onRespond(session._id, "accepted")}
          disabled={isResponding}
          className="flex flex-1 items-center justify-center gap-2 rounded bg-[#7C3AED] py-1.5 text-xs font-bold text-white transition-all hover:bg-purple-700 hover:shadow-md hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {respondingActionKey === acceptingKey && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Accept
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onRespond(session._id, "declined")}
          disabled={isResponding}
          className="flex flex-1 items-center justify-center gap-2 rounded border border-slate-300 bg-transparent py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-300"
        >
          {respondingActionKey === decliningKey && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Decline
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [dashboardStats, setDashboardStats] = useState<MentorStats>({
    totalEarnings: 0,
    rating: 0,
    uniqueStudentsTaught: 0,
    upcomingSessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [respondingActionKey, setRespondingActionKey] = useState("");

  const weekDays = useMemo(() => getWeekDays(), []);
  const hourLabels = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => formatHour(START_HOUR + index)),
    []
  );

  useEffect(() => {
    let isActive = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        const [sessionsResponse, statsResponse] = await Promise.all([
          fetch("/api/mentor/sessions"),
          fetch("/api/mentor/dashboard/stats"),
        ]);

        const [sessionsData, statsData] = await Promise.all([
          sessionsResponse.json().catch(() => null),
          statsResponse.json().catch(() => null),
        ]);

        if (!sessionsResponse.ok) {
          throw new Error(sessionsData?.message || "Failed to load mentor sessions.");
        }

        if (!statsResponse.ok) {
          throw new Error(statsData?.message || "Failed to load mentor stats.");
        }

        if (isActive) {
          setSessions(sessionsData as MentorSession[]);
          setDashboardStats({
            totalEarnings: Number(statsData?.totalEarnings ?? 0),
            rating: Number(statsData?.rating ?? 0),
            uniqueStudentsTaught: Number(statsData?.uniqueStudentsTaught ?? 0),
            upcomingSessions: Number(statsData?.upcomingSessions ?? 0),
          });
        }
      } catch (error) {
        if (isActive) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load sessions."
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isActive = false;
    };
  }, []);

  const topStats = useMemo(() => {
    const totalSessions = sessions.length;
    const hoursMentored = sessions
      .filter((session) => session.status === "completed")
      .reduce((sum, session) => sum + session.duration / 60, 0);

    return [
      {
        label: "Total Sessions",
        value: isLoading ? "..." : String(totalSessions),
        icon: TrendingUp,
      },
      {
        label: "Hours Mentored",
        value: isLoading ? "..." : `${hoursMentored.toFixed(1)}h`,
        icon: TrendingUp,
      },
      {
        label: "Student Rating",
        value: isLoading ? "..." : dashboardStats.rating.toFixed(1),
        icon: Star,
      },
    ];
  }, [dashboardStats.rating, isLoading, sessions]);

  const timelineGrid = useMemo(
    () => buildTimelineGrid(sessions, weekDays),
    [sessions, weekDays]
  );

  const todaysAgenda = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.status === "accepted" && isSameDay(new Date(session.scheduledAt), new Date())
      ),
    [sessions]
  );

  const pendingRequests = useMemo(
    () => sessions.filter((session) => session.status === "pending"),
    [sessions]
  );

  async function handleRespond(sessionId: string, nextStatus: RequestAction) {
    const nextActionKey = `${sessionId}-${nextStatus}`;

    try {
      setRespondingActionKey(nextActionKey);

      const response = await fetch(`/api/sessions/${sessionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Failed to respond to session.");
      }

      setSessions((currentSessions) =>
        currentSessions.map((session) =>
          session._id === sessionId ? (result?.session as MentorSession) : session
        )
      );

      toast.success(nextStatus === "accepted" ? "Session Accepted!" : "Session Declined.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to respond to session."
      );
    } finally {
      setRespondingActionKey("");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
              Session Command
            </h1>
            <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
              Manage your mentorship schedule and incoming requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/sessions/availability">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-surface-dark dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Settings className="h-[18px] w-[18px]" />
                <span className="pointer-events-none absolute -bottom-10 left-1/2 w-max -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-white dark:text-black">
                  Availability Settings
                </span>
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-surface-dark dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Calendar className="h-[18px] w-[18px]" />
              Sync Calendar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
            >
              <Plus className="h-[18px] w-[18px]" />
              New Session
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="flex flex-col gap-6 xl:col-span-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {topStats.map((stat, index) => (
                <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} i={index} />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-surface-dark"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/20">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                  <Calendar className="h-5 w-5 text-primary" />
                  Weekly Timeline
                </h2>
                <div className="flex items-center gap-2">
                  <button className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="px-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    This Week
                  </span>
                  <button className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="timeline-scroll relative flex-1 overflow-auto">
                <div className="grid min-w-[900px] grid-cols-[80px_repeat(5,1fr)]">
                  <div className="sticky top-0 z-10 border-b border-slate-200 bg-white py-3 dark:border-slate-800 dark:bg-surface-dark" />
                  {weekDays.map((day) => (
                    <div
                      key={day.name}
                      className={`sticky top-0 z-10 border-b border-slate-200 py-3 text-center dark:border-slate-800 ${
                        day.isToday
                          ? "bg-primary/5 font-bold text-primary dark:bg-primary/10"
                          : "bg-white font-bold text-slate-700 dark:bg-surface-dark dark:text-slate-300"
                      }`}
                    >
                      <span className="text-sm">{day.name}</span>
                      <span className={`block text-xs font-normal ${day.isToday ? "text-primary/70" : "text-slate-400"}`}>
                        {day.date}
                      </span>
                    </div>
                  ))}

                  {hourLabels.map((label, rowIndex) => (
                    <div key={label} className="contents">
                      <div className="-mt-2.5 border-r border-slate-200 px-2 py-3 text-right text-xs font-medium text-slate-400 dark:border-slate-800">
                        {label}
                      </div>
                      {weekDays.map((day, columnIndex) => (
                        <TimelineCell
                          key={`${rowIndex}-${columnIndex}`}
                          event={timelineGrid[rowIndex]?.[columnIndex] ?? null}
                          isToday={day.isToday}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col gap-6 xl:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-surface-dark"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Today&apos;s Agenda
                </h3>
                <button className="text-sm font-medium text-primary transition-colors hover:text-primary/80">
                  View All
                </button>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Loading agenda...
                  </div>
                ) : todaysAgenda.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700">
                    No accepted sessions scheduled for today.
                  </div>
                ) : (
                  todaysAgenda.map((session) => (
                    <AgendaCard key={session._id} session={session} />
                  ))
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-md backdrop-blur-sm dark:border-slate-800 dark:bg-surface-dark/80"
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  {pendingRequests.length}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Pending Requests
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                {isLoading ? (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800/50">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Loading requests...
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800/50">
                    No pending requests.
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {pendingRequests.map((session) => (
                      <RequestCard
                        key={session._id}
                        session={session}
                        respondingActionKey={respondingActionKey}
                        onRespond={handleRespond}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
