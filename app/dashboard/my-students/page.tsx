"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Brain,
  Calendar,
  MailWarning,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  MessageCircle,
  CalendarPlus,
  ClipboardList,
  BadgeCheck,
  Trophy,
  Flame,
  Star,
  Zap,
  Crown,
} from "lucide-react";
import AssignTaskModal from "@/components/modals/AssignTaskModal";

/* ────────────────────────────────────────────────
   Types & Mock Data
   ──────────────────────────────────────────────── */

interface Student {
  id: string;
  name: string;
  title: string;
  avatar: string;
  initials: string;
  online: boolean;
  weeklyGoalProgress: number;
  focusScore: number;
  badges: { icon: React.ReactNode; label: string }[];
  joinedWeeksAgo: number;
}

const STUDENTS: Student[] = [
  {
    id: "s1",
    name: "Aria Chen",
    title: "Master Scholar",
    avatar: "",
    initials: "AC",
    online: true,
    weeklyGoalProgress: 85,
    focusScore: 92,
    badges: [
      { icon: <BadgeCheck size={14} />, label: "Verified" },
      { icon: <Trophy size={14} />, label: "Top 10" },
      { icon: <Flame size={14} />, label: "7-day Streak" },
    ],
    joinedWeeksAgo: 8,
  },
  {
    id: "s2",
    name: "Marcus Lee",
    title: "Rising Star",
    avatar: "",
    initials: "ML",
    online: true,
    weeklyGoalProgress: 68,
    focusScore: 84,
    badges: [
      { icon: <Star size={14} />, label: "Star Learner" },
      { icon: <Zap size={14} />, label: "Quick Finisher" },
    ],
    joinedWeeksAgo: 3,
  },
  {
    id: "s3",
    name: "Priya Patel",
    title: "Focus Champion",
    avatar: "",
    initials: "PP",
    online: false,
    weeklyGoalProgress: 94,
    focusScore: 97,
    badges: [
      { icon: <Crown size={14} />, label: "Elite" },
      { icon: <Trophy size={14} />, label: "Top 3" },
      { icon: <Flame size={14} />, label: "30-day Streak" },
    ],
    joinedWeeksAgo: 16,
  },
  {
    id: "s4",
    name: "Jake Rivera",
    title: "Curious Mind",
    avatar: "",
    initials: "JR",
    online: false,
    weeklyGoalProgress: 42,
    focusScore: 71,
    badges: [
      { icon: <BadgeCheck size={14} />, label: "Verified" },
    ],
    joinedWeeksAgo: 1,
  },
  {
    id: "s5",
    name: "Sophie Kim",
    title: "Knowledge Seeker",
    avatar: "",
    initials: "SK",
    online: true,
    weeklyGoalProgress: 77,
    focusScore: 89,
    badges: [
      { icon: <Star size={14} />, label: "Star Learner" },
      { icon: <Flame size={14} />, label: "14-day Streak" },
    ],
    joinedWeeksAgo: 6,
  },
  {
    id: "s6",
    name: "David Nguyen",
    title: "Grind Master",
    avatar: "",
    initials: "DN",
    online: true,
    weeklyGoalProgress: 91,
    focusScore: 95,
    badges: [
      { icon: <Crown size={14} />, label: "Elite" },
      { icon: <Trophy size={14} />, label: "Top 5" },
      { icon: <Zap size={14} />, label: "Speed Demon" },
    ],
    joinedWeeksAgo: 12,
  },
  {
    id: "s7",
    name: "Emma Watson",
    title: "Bookworm",
    avatar: "",
    initials: "EW",
    online: false,
    weeklyGoalProgress: 56,
    focusScore: 78,
    badges: [
      { icon: <BadgeCheck size={14} />, label: "Verified" },
      { icon: <Star size={14} />, label: "Star Learner" },
    ],
    joinedWeeksAgo: 4,
  },
  {
    id: "s8",
    name: "Liam Torres",
    title: "Night Owl",
    avatar: "",
    initials: "LT",
    online: true,
    weeklyGoalProgress: 73,
    focusScore: 82,
    badges: [
      { icon: <Flame size={14} />, label: "10-day Streak" },
    ],
    joinedWeeksAgo: 2,
  },
];

/* ────────────────────────────────────────────────
   Analytics Widget Data
   ──────────────────────────────────────────────── */

const ANALYTICS = [
  {
    label: "Total Active Students",
    value: "24",
    change: "+3 this week",
    icon: Users,
    orbColor: "bg-blue-500/30 dark:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Avg. Focus Score",
    value: "88%",
    change: "+2.4%",
    icon: Brain,
    orbColor: "bg-teal-500/30 dark:bg-teal-500/20",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    label: "Upcoming Sessions",
    value: "5",
    change: "Today",
    icon: Calendar,
    orbColor: "bg-purple-500/30 dark:bg-purple-500/20",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    label: "Pending Requests",
    value: "2",
    change: "Action Required",
    icon: MailWarning,
    orbColor: "bg-red-500/30 dark:bg-red-500/20",
    iconColor: "text-red-600 dark:text-red-400",
    isBadge: true,
  },
];

/* ────────────────────────────────────────────────
   Progress Bar Colors
   ──────────────────────────────────────────────── */

function progressBarColor(pct: number) {
  if (pct >= 80) return "from-emerald-500 to-teal-400";
  if (pct >= 50) return "from-amber-500 to-yellow-400";
  return "from-rose-500 to-pink-400";
}

/* ────────────────────────────────────────────────
   Container Animations
   ──────────────────────────────────────────────── */

const container = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const cardItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/* ────────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────────── */

export default function MyStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = STUDENTS.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openAssignModal = (student: Student) => {
    setSelectedStudent(student);
    setAssignModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-background dark:bg-[#191121] text-foreground p-6 md:p-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ─── Page Header ─── */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            My Students
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor progress, assign tasks, and support your learners.
          </p>
        </div>

        {/* ─── Analytics Widgets ─── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={container}
          initial="initial"
          animate="animate"
        >
          {ANALYTICS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={cardItem}
              className="relative overflow-hidden rounded-2xl border border-border bg-white/60 dark:bg-white/5 backdrop-blur-md p-5 group"
            >
              {/* Glowing orb */}
              <div
                className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity ${stat.orbColor}`}
              />

              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-extrabold mt-1 text-foreground">
                    {stat.value}
                  </p>
                  {stat.isBadge ? (
                    <span className="inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400">
                      {stat.change}
                    </span>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  )}
                </div>
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/10 ${stat.iconColor}`}
                >
                  <stat.icon size={22} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── Search & Controls ─── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>

          {/* Filter & Sort */}
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-sm font-medium text-foreground hover:border-primary/50 transition-colors">
              <SlidersHorizontal size={16} className="text-muted-foreground" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-sm font-medium text-foreground hover:border-primary/50 transition-colors">
              <ArrowUpDown size={16} className="text-muted-foreground" />
              Sort
            </button>
          </div>
        </div>

        {/* ─── Student Grid ─── */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5"
          variants={container}
          initial="initial"
          animate="animate"
        >
          {filteredStudents.map((student) => (
            <motion.div
              key={student.id}
              variants={cardItem}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-border bg-white/60 dark:bg-white/5 backdrop-blur-md overflow-hidden transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10"
            >
              {/* Card Body */}
              <div className="p-5">
                {/* Avatar + Info */}
                <div className="flex items-center gap-3.5">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/80 to-purple-600/80 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/15">
                      {student.initials}
                    </div>
                    {/* Online indicator */}
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#191121] ${
                        student.online
                          ? "bg-emerald-500"
                          : "bg-slate-400 dark:bg-slate-600"
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">
                      {student.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {student.title}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Weekly Goal
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {student.weeklyGoalProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${progressBarColor(student.weeklyGoalProgress)}`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${student.weeklyGoalProgress}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 mt-3.5">
                  {student.badges.map((badge, i) => (
                    <div
                      key={i}
                      title={badge.label}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-default"
                    >
                      {badge.icon}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center border-t border-border divide-x divide-border">
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  title="Message"
                >
                  <MessageCircle size={15} />
                  <span className="hidden sm:inline">Message</span>
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  title="Schedule Session"
                >
                  <CalendarPlus size={15} />
                  <span className="hidden sm:inline">Schedule</span>
                </button>
                <button
                  onClick={() => openAssignModal(student)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  title="Assign Task"
                >
                  <ClipboardList size={15} />
                  <span className="hidden sm:inline">Assign</span>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty state */}
        {filteredStudents.length === 0 && (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">
              No students found
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try adjusting your search query.
            </p>
          </div>
        )}
      </div>

      {/* ─── Assign Task Modal ─── */}
      <AssignTaskModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        studentName={selectedStudent?.name ?? ""}
      />
    </main>
  );
}
