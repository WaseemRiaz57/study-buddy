"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Calendar,
  CalendarPlus,
  ClipboardList,
  Gift,
  Loader2,
  MailWarning,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import AssignTaskModal from "@/components/modals/AssignTaskModal";
import GiftCoinsModal from "@/components/modals/GiftCoinsModal";

interface Student {
  id: string;
  name: string;
  email: string;
  image: string;
  initials: string;
  lastActive: string | null;
}

interface StudentStats {
  totalActiveStudents: number;
  upcomingSessions: number;
  pendingRequests: number;
  pendingAssignments: number;
}

const EMPTY_STATS: StudentStats = {
  totalActiveStudents: 0,
  upcomingSessions: 0,
  pendingRequests: 0,
  pendingAssignments: 0,
};

function formatLastActive(value: string | null) {
  if (!value) return "No recent activity";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No recent activity";

  return `Active ${date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  })}`;
}

function getTodayDateInput() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

const cardItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function MyStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats>(EMPTY_STATS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [scheduleSubject, setScheduleSubject] = useState("");
  const [scheduleDate, setScheduleDate] = useState(getTodayDateInput());
  const [scheduleDuration, setScheduleDuration] = useState(60);
  const [isScheduling, setIsScheduling] = useState(false);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/mentor/students", {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load students.");
      }

      setStudents(Array.isArray(data?.students) ? data.students : []);
      setStats({
        ...EMPTY_STATS,
        ...(data?.stats || {}),
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load students."
      );
      setStudents([]);
      setStats(EMPTY_STATS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return students;

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
    );
  }, [searchQuery, students]);

  const openAssignModal = (student: Student) => {
    setSelectedStudent(student);
    setAssignModalOpen(true);
  };

  const openGiftModal = (student: Student) => {
    setSelectedStudent(student);
    setGiftModalOpen(true);
  };

  const openScheduleModal = (student: Student) => {
    setSelectedStudent(student);
    setScheduleSubject("");
    setScheduleDate(getTodayDateInput());
    setScheduleDuration(60);
    setScheduleModalOpen(true);
  };

  const handleSchedule = async () => {
    if (!selectedStudent || !scheduleSubject.trim() || !scheduleDate) return;

    try {
      setIsScheduling(true);
      const response = await fetch("/api/mentor/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          subject: scheduleSubject.trim(),
          scheduledAt: new Date(scheduleDate).toISOString(),
          duration: scheduleDuration,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to schedule session.");
      }

      toast.success(data?.message || "Session scheduled successfully.");
      setScheduleModalOpen(false);
      await fetchStudents();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to schedule session."
      );
    } finally {
      setIsScheduling(false);
    }
  };

  const statsCards = [
    {
      label: "Total Active Students",
      value: stats.totalActiveStudents,
      change: "Connected learners",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Pending Assignments",
      value: stats.pendingAssignments,
      change: "Waiting on students",
      icon: ClipboardList,
      color: "text-teal-600 dark:text-teal-400",
    },
    {
      label: "Upcoming Sessions",
      value: stats.upcomingSessions,
      change: "Scheduled ahead",
      icon: Calendar,
      color: "text-[#7C3AED]",
    },
    {
      label: "Pending Requests",
      value: stats.pendingRequests,
      change: "Action required",
      icon: MailWarning,
      color: "text-red-600 dark:text-red-400",
      isBadge: true,
    },
  ];

  return (
    <main className="min-h-screen bg-background p-6 text-foreground transition-colors duration-300 dark:bg-[#191121] md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            My Students
          </h1>
          <p className="mt-1 text-muted-foreground">
            Monitor progress, assign tasks, and support your learners.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <motion.div
              key={stat.label}
              variants={cardItem}
              initial="initial"
              animate="animate"
              className="rounded-2xl border border-border bg-white/60 p-5 backdrop-blur-md dark:bg-white/5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-3xl font-extrabold text-foreground">
                    {isLoading ? "..." : stat.value}
                  </p>
                  {stat.isBadge ? (
                    <span className="mt-1.5 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-400">
                      {stat.change}
                    </span>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {stat.change}
                    </p>
                  )}
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 ${stat.color}`}
                >
                  <stat.icon size={22} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search students..."
              className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:ring-2 focus:ring-purple-500/30 dark:bg-white/5"
            />
          </div>

          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-[#7C3AED]/50 dark:bg-white/5">
              <SlidersHorizontal size={16} className="text-muted-foreground" />
              Filter
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-[#7C3AED]/50 dark:bg-white/5">
              <ArrowUpDown size={16} className="text-muted-foreground" />
              Sort
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={34} className="animate-spin text-[#7C3AED]" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center">
            <Users
              size={48}
              className="mx-auto mb-4 text-muted-foreground/40"
            />
            <p className="text-lg font-semibold text-muted-foreground">
              No students found
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Connected students appear after an accepted or completed session.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredStudents.map((student) => (
              <motion.div
                key={student.id}
                variants={cardItem}
                initial="initial"
                animate="animate"
                whileHover={{ y: -4 }}
                className="overflow-hidden rounded-2xl border border-border bg-white/60 backdrop-blur-md transition-shadow duration-300 hover:shadow-xl hover:shadow-purple-500/5 dark:bg-white/5"
              >
                <div className="p-5">
                  <div className="flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] text-sm font-bold text-white shadow-lg shadow-purple-500/15">
                        {student.image ? (
                          <img
                            src={student.image}
                            alt={student.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          student.initials
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-foreground">
                        {student.name}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-border/70 bg-white/50 p-3 text-xs text-muted-foreground dark:bg-white/5">
                    {formatLastActive(student.lastActive)}
                  </div>
                </div>

                <div className="flex items-center divide-x divide-border border-t border-border">
                  <button
                    onClick={() =>
                      router.push(`/dashboard/messages?user=${student.id}`)
                    }
                    className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-purple-50 hover:text-[#7C3AED] dark:hover:bg-purple-500/10"
                    title="Message"
                  >
                    <MessageCircle size={15} />
                    <span className="hidden sm:inline">Message</span>
                  </button>
                  <button
                    onClick={() => openScheduleModal(student)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-purple-50 hover:text-[#7C3AED] dark:hover:bg-purple-500/10"
                    title="Schedule Session"
                  >
                    <CalendarPlus size={15} />
                    <span className="hidden sm:inline">Schedule</span>
                  </button>
                  <button
                    onClick={() => openAssignModal(student)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-purple-50 hover:text-[#7C3AED] dark:hover:bg-purple-500/10"
                    title="Assign Task"
                  >
                    <ClipboardList size={15} />
                    <span className="hidden sm:inline">Assign</span>
                  </button>
                  <button
                    onClick={() => openGiftModal(student)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-purple-50 hover:text-[#7C3AED] dark:hover:bg-purple-500/10"
                    title="Gift Coins"
                  >
                    <Gift size={15} />
                    <span className="hidden sm:inline">Gift</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AssignTaskModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        studentId={selectedStudent?.id ?? ""}
        studentName={selectedStudent?.name ?? ""}
      />

      <GiftCoinsModal
        isOpen={giftModalOpen}
        onClose={() => setGiftModalOpen(false)}
        recipientId={selectedStudent?.id ?? ""}
        recipientName={selectedStudent?.name ?? ""}
      />

      {scheduleModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#191121]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Schedule Session
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Book a new session with{" "}
                  <span className="font-semibold text-[#7C3AED]">
                    {selectedStudent.name}
                  </span>
                  .
                </p>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-white/10"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Subject
                </label>
                <input
                  value={scheduleSubject}
                  onChange={(event) => setScheduleSubject(event.target.value)}
                  placeholder="e.g. Calculus review"
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-500/30 dark:border-white/10 dark:bg-white/5"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(event) => setScheduleDate(event.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-500/30 dark:border-white/10 dark:bg-white/5"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Duration
                </label>
                <select
                  value={scheduleDuration}
                  onChange={(event) => setScheduleDuration(Number(event.target.value))}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-500/30 dark:border-white/10 dark:bg-white/5"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSchedule()}
                disabled={isScheduling || !scheduleSubject.trim() || !scheduleDate}
                className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isScheduling ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CalendarPlus size={16} />
                )}
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

