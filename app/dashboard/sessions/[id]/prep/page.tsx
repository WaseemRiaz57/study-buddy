"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; // <-- Added this line for navigation
import { useParams } from "next/navigation";
import {
  Flag,
  Paperclip,
  FileText,
  Download,
  History,
  Save,
  RefreshCw,
  Mic,
  Video,
  Rocket,
  ChevronLeft,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════ */
/* TYPES & MOCK DATA                                                  */
/* ═══════════════════════════════════════════════════════════════════ */

interface Goal {
  id: number;
  text: string;
}

interface Attachment {
  id: number;
  name: string;
  size: string;
  type: "pdf" | "doc";
}

const studentInfo = {
  name: "Sarah J.",
  subject: "Calculus III",
  sessionNum: 4,
  avatar: "SJ",
};

const goals: Goal[] = [
  { id: 1, text: "Review Midterm problems 4-10 (Vector Fields)" },
  { id: 2, text: "Clarify divergence theorem concepts" },
];

const attachments: Attachment[] = [
  { id: 1, name: "Midterm_Review.pdf", size: "2.4 MB", type: "pdf" },
  { id: 2, name: "Homework_4_Set.docx", size: "1.1 MB", type: "doc" },
];

const lastSessionNotes = {
  body: "Sarah struggled slightly with partial derivatives. We spent extra time on the chain rule.",
  action: "Action item: Start with a quick warm-up problem.",
};

const quickPrompts = ["Icebreaker", "Review Qs", "Wrap-up"];

/* ═══════════════════════════════════════════════════════════════════ */
/* COUNTDOWN HOOK                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

function useCountdown(initialMinutes: number, initialSeconds: number) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev === 0) {
          if (minutes === 0) {
            clearInterval(timer);
            return 0;
          }
          setMinutes((m) => m - 1);
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [minutes]);

  return {
    display: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    minutes,
    seconds,
  };
}

/* ═══════════════════════════════════════════════════════════════════ */
/* SUB-COMPONENTS                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

/** Goal list item */
function GoalItem({ goal }: { goal: Goal }) {
  return (
    <li className="flex items-start gap-3 rounded-lg bg-slate-100 dark:bg-white/5 p-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
      <div className="mt-0.5 h-4 w-4 shrink-0 rounded border border-primary/50 bg-primary/20" />
      <span className="leading-relaxed">{goal.text}</span>
    </li>
  );
}

/** Attachment card */
function AttachmentCard({ attachment }: { attachment: Attachment }) {
  const colors =
    attachment.type === "pdf"
      ? "bg-red-500/20 text-red-400"
      : "bg-blue-500/20 text-blue-400";

  return (
    <a
      href="#"
      className="group flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] p-3 transition-all hover:bg-slate-100 dark:hover:bg-white/5 hover:border-primary/30"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded ${colors}`}
        >
          <FileText className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
            {attachment.name}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{attachment.size}</span>
        </div>
      </div>
      <Download className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-primary" />
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* MAIN PAGE                                                          */
/* ═══════════════════════════════════════════════════════════════════ */

export default function PrepRoomPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const { display, minutes, seconds } = useCountdown(4, 23);
  const [scratchpad, setScratchpad] = useState("");

  const mins = display.split(":")[0];
  const secs = display.split(":")[1];

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-primary selection:text-white overflow-x-hidden">
      {/* ── Ambient background glows ───────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-[100px] animate-pulse-slow" />
        <div
          className="absolute bottom-1/3 right-1/4 h-96 w-96 rounded-full bg-pink-500/10 blur-[120px] animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        />
        {/* Floating particles */}
        <div
          className="absolute top-[15%] left-[10%] h-1 w-1 rounded-full bg-white/30 animate-float"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute top-[45%] right-[20%] h-1.5 w-1.5 rounded-full bg-primary/40 animate-float"
          style={{ animationDuration: "12s", animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-[20%] left-[30%] h-2 w-2 rounded-full bg-pink-500/30 animate-float"
          style={{ animationDuration: "10s", animationDelay: "3s" }}
        />
      </div>

      {/* ── Top bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/sessions"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-pink-500 text-white shadow-lg shadow-primary/20">
            <Rocket className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Session Prep Room
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">
            Session #{sessionId}
          </span>
        </div>
      </header>

      {/* ── Main 3-column grid ─────────────────────────────────── */}
      <main className="relative flex flex-grow flex-col items-center justify-center p-4 lg:p-6">
        <div className="relative z-10 grid w-full max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* ── LEFT: Student Context ────────────────────────────── */}
          <section className="flex flex-col overflow-hidden rounded-2xl lg:col-span-3 lg:min-h-[400px] bg-slate-50/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            {/* Student header */}
            <div className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/5 p-4">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0">
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-purple-700 ring-2 ring-primary/50 flex items-center justify-center text-xl font-bold">
                    {studentInfo.avatar}
                  </div>
                  <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 bg-green-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {studentInfo.name}
                  </h2>
                  <p className="text-sm text-primary/80">
                    {studentInfo.subject} • Session #{studentInfo.sessionNum}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex flex-col gap-6 overflow-y-auto p-4">
              {/* Goals */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Flag className="w-3.5 h-3.5" />
                  Today&apos;s Goals
                </div>
                <ul className="space-y-3">
                  {goals.map((g) => (
                    <GoalItem key={g.id} goal={g} />
                  ))}
                </ul>
              </div>

              {/* Attachments */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Paperclip className="w-3.5 h-3.5" />
                  Attachments
                </div>
                <div className="space-y-2">
                  {attachments.map((a) => (
                    <AttachmentCard key={a.id} attachment={a} />
                  ))}
                </div>
              </div>

              {/* Last session notes */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <History className="w-3.5 h-3.5" />
                  Last Session Notes
                </div>
                <div className="rounded-lg bg-slate-100 dark:bg-black/20 p-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  <p className="mb-2">{lastSessionNotes.body}</p>
                  <p className="italic text-slate-400 dark:text-slate-500">
                    {lastSessionNotes.action}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── CENTER: Countdown & Launch ────────────────────────── */}
          <section className="flex flex-col items-center justify-center py-10 lg:col-span-6 lg:py-0">
            {/* Session ready badge */}
            <div className="mb-2 flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-4 py-1.5 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Session Ready
              </span>
            </div>

            {/* Massive countdown */}
            <h1 className="mb-2 text-center text-6xl font-bold leading-none tracking-tight text-slate-900 dark:text-white lg:text-7xl"
                style={{ textShadow: "0 0 20px rgba(140, 48, 232, 0.5)" }}>
              {mins}
              <span className="animate-pulse text-slate-400 dark:text-slate-500">:</span>
              {secs}
            </h1>

            <p className="mb-8 text-xl font-light text-slate-500 dark:text-slate-400">
              until session starts
            </p>

            {/* 👇 LINK TO LIVE CLASSROOM ADDED HERE */}
            <Link href={`/dashboard/sessions/${sessionId}/live`} className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-pink-500 opacity-70 blur-lg transition duration-200 group-hover:opacity-100 group-hover:blur-xl" />
              <button className="relative flex h-14 min-w-[280px] cursor-pointer items-center justify-center gap-4 overflow-hidden rounded-full bg-gradient-to-r from-primary to-pink-500 px-8 text-lg font-bold text-white shadow-2xl transition-transform active:scale-95">
                {/* Shimmer overlay */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer-slide_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative z-10 tracking-wide">
                  Launch Virtual Classroom
                </span>
                <Rocket className="relative z-10 w-6 h-6" />
              </button>
            </Link>

            {/* Audio/Video check buttons */}
            <div className="mt-8 flex gap-4">
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white">
                <Mic className="w-4 h-4" />
                Check Audio
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white">
                <Video className="w-4 h-4" />
                Test Video
              </button>
            </div>
          </section>

          {/* ── RIGHT: Private Scratchpad ─────────────────────────── */}
          <section className="flex flex-col overflow-hidden rounded-2xl lg:col-span-3 lg:min-h-[400px] bg-slate-50/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/5 p-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Talking Points
              </h2>
              <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                Private
              </span>
            </div>

            {/* Textarea */}
            <div className="relative flex-grow p-4">
              <textarea
                value={scratchpad}
                onChange={(e) => setScratchpad(e.target.value)}
                className="h-full w-full resize-none rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-black/20 p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:bg-slate-100 dark:focus:bg-black/30 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={`• Ask about the difficulty of problem #4\n• Remember to praise her progress on partial derivatives\n• Mention the upcoming mock exam next Tuesday...`}
              />
              {/* Save FAB */}
              <button className="absolute bottom-8 right-8 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-transform hover:scale-110 hover:bg-primary/90">
                <Save className="w-5 h-5" />
              </button>
            </div>

            {/* Quick prompts */}
            <div className="bg-slate-100 dark:bg-white/5 p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="uppercase tracking-wider">
                    Quick Prompts
                  </span>
                  <RefreshCw className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() =>
                        setScratchpad((prev) =>
                          prev ? `${prev}\n• ${prompt}` : `• ${prompt}`
                        )
                      }
                      className="rounded-full border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ── Footer Status Bar ──────────────────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 flex items-center justify-between border-t border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-slate-900/90 px-4 py-2 text-xs text-slate-500 dark:text-slate-400 backdrop-blur-md z-40">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            System Status: Optimal
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">Connection: 45ms Latency</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300">
            Help Center
          </a>
          <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300">
            Report Issue
          </a>
        </div>
      </footer>
    </div>
  );
}