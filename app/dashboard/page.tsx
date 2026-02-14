"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  GraduationCap,
  Home,
  Play,
  Search,
  Timer,
  Users,
  Zap,
} from "lucide-react";

const navItems = [
  {
    label: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Focus Rooms",
    href: "/focus-rooms",
    icon: Timer,
  },
  {
    label: "Study Groups",
    href: "/study-groups",
    icon: Users,
  },
  {
    label: "Mentors",
    href: "/mentors",
    icon: GraduationCap,
  },
];

const rooms = [
  {
    name: "Obsidian Lab",
    focus: "Quantum Mechanics",
    members: "12 peers",
  },
  {
    name: "Moonlit Archive",
    focus: "Literature synthesis",
    members: "8 peers",
  },
  {
    name: "Signal Forge",
    focus: "AI Notes cleanup",
    members: "6 peers",
  },
];

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row">
        <aside className="glass-panel w-full rounded-3xl p-6 lg:w-64">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">StudyBuddy</p>
              <p className="text-xs text-slate-600 dark:text-gray-400">
                Command Center
              </p>
            </div>
          </div>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                    item.href === "/dashboard"
                      ? "bg-white/70 text-foreground dark:bg-white/10"
                      : "text-slate-700 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="flex-1 space-y-6">
          <header className="glass-panel rounded-3xl p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 dark:border-white/10 dark:bg-white/5">
                <Search className="h-4 w-4 text-slate-600 dark:text-gray-400" />
                <input
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500 dark:placeholder:text-gray-500"
                  placeholder="Search sessions, rooms, mentors"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs text-slate-600 dark:text-gray-400">Daily XP</p>
                  <p className="text-sm font-semibold">420 / 600</p>
                </div>
                <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                  <div className="h-full w-3/4 bg-primary" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-gray-200">
                  NR
                </div>
              </div>
            </div>
          </header>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 lg:grid-cols-3"
          >
            <motion.div variants={cardVariants} className="glass-panel rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-gray-400">
                Focus ritual
              </p>
              <h2 className="mt-3 text-2xl font-semibold">Start Focus Session</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">
                Activate your ritual timer and set the mood for the next 50 minutes.
              </p>
              <button
                type="button"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
              >
                <Play className="h-4 w-4" />
                Launch
              </button>
            </motion.div>

            <motion.div variants={cardVariants} className="glass-panel rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-gray-400">
                Stats
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold">Current Level</p>
                  <p className="text-xs text-slate-600 dark:text-gray-400">Level 7</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">XP to Next Level</p>
                  <p className="text-xs text-slate-600 dark:text-gray-400">180 XP</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Study Streak</p>
                  <p className="text-xs text-slate-600 dark:text-gray-400">5 days</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={cardVariants} className="glass-panel rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-gray-400">
                Active rooms
              </p>
              <div className="mt-4 space-y-4">
                {rooms.map((room) => (
                  <div
                    key={room.name}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <div>
                      <p className="text-sm font-semibold">{room.name}</p>
                      <p className="text-xs text-slate-600 dark:text-gray-400">
                        {room.focus} · {room.members}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
