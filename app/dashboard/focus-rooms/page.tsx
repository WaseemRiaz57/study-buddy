"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  CloudRain,
  Coffee,
  Radio,
  Plus,
  Trash2,
  ListTodo,
  Music,
  CheckCircle2,
  Circle,
  Sparkles,
  Flame,
  Check,
  BarChart3,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface SoundChannel {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  volume: number;
}

interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: "High" | "Med" | "Low";
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const POMODORO_SECONDS = 25 * 60;

const WEEKLY_DATA = [
  { day: "M", hours: 2, pct: 40 },
  { day: "T", hours: 3, pct: 60 },
  { day: "W", hours: 5.5, pct: 85 },
  { day: "T", hours: 2.5, pct: 50 },
  { day: "F", hours: 0, pct: 10 },
];

const DEFAULT_TASKS: Task[] = [
  { id: "1", text: "Linear Algebra Quiz", done: false, priority: "High" },
  { id: "2", text: "Read Chapter 4 — Physics II", done: false, priority: "Med" },
  { id: "3", text: "Submit Lab Report", done: false, priority: "Low" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function FocusRoomsPage() {
  /* ---- Timer ---- */
  const [timeLeft, setTimeLeft] = useState(POMODORO_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- Sounds ---- */
  const [sounds, setSounds] = useState<SoundChannel[]>([
    { id: "rain", label: "Rain", icon: <CloudRain size={18} />, enabled: false, volume: 50 },
    { id: "cafe", label: "Café", icon: <Coffee size={18} />, enabled: false, volume: 50 },
    { id: "white", label: "White Noise", icon: <Radio size={18} />, enabled: false, volume: 50 },
  ]);

  /* ---- Tasks ---- */
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [newTask, setNewTask] = useState("");

  /* ---- Tab ---- */
  const [activeTab, setActiveTab] = useState<"sounds" | "tasks">("tasks");

  /* ---- Timer logic ---- */
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearTimer();
            setIsRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return clearTimer;
  }, [isRunning, timeLeft, clearTimer]);

  const toggleTimer = () => {
    if (timeLeft === 0) return;
    setIsRunning((r) => !r);
  };
  const resetTimer = () => {
    clearTimer();
    setIsRunning(false);
    setTimeLeft(POMODORO_SECONDS);
  };

  /* ---- Derived values ---- */
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  const progress = ((POMODORO_SECONDS - timeLeft) / POMODORO_SECONDS) * 100;
  const circumference = 2 * Math.PI * 46; // r = 46% in viewBox 100

  /* ---- Sound helpers ---- */
  const toggleSound = (id: string) =>
    setSounds((p) => p.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  const setVolume = (id: string, v: number) =>
    setSounds((p) => p.map((s) => (s.id === id ? { ...s, volume: v } : s)));

  /* ---- Task helpers ---- */
  const addTask = () => {
    const text = newTask.trim();
    if (!text) return;
    setTasks((p) => [...p, { id: crypto.randomUUID(), text, done: false, priority: "Med" }]);
    setNewTask("");
  };
  const toggleTask = (id: string) =>
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const removeTask = (id: string) =>
    setTasks((p) => p.filter((t) => t.id !== id));

  const priorityStyles: Record<string, string> = {
    High: "bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-400",
    Med: "bg-blue-100 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400",
    Low: "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* ---- Background orbs ---- */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-mint-whisper dark:bg-purple-900/20 blur-[100px]" />
      </div>

      <div className="px-4 md:px-10 pt-8 pb-24 max-w-6xl mx-auto">
        {/* ============================================================ */}
        {/*  HERO — Current Focus + Timer                                 */}
        {/* ============================================================ */}
        <section className="flex flex-col items-center justify-center mb-16 relative">
          {/* Zen mode button */}
          <div className="absolute top-0 right-0 hidden lg:block">
            <button className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-sm text-text-muted dark:text-slate-400 hover:text-primary transition-colors">
              <Sparkles size={16} />
              Zen Mode
            </button>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-text-main dark:text-white mb-2 text-center tracking-tight">
            Current Focus
          </h1>
          <p className="text-text-muted dark:text-slate-400 mb-12 flex items-center gap-2 bg-white/40 dark:bg-white/[0.06] px-4 py-1.5 rounded-full border border-white/50 dark:border-white/10 text-sm">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Advanced Calculus: Integration Techniques
          </p>

          {/* ---- Massive Circular Timer ---- */}
          <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center mb-12">
            {/* Outer glow */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-700
                ${isRunning
                  ? "bg-gradient-to-tr from-primary/15 to-purple-300/20 dark:from-primary/20 dark:to-purple-500/15 blur-2xl scale-110"
                  : "bg-gradient-to-tr from-primary/5 to-purple-200/20 dark:from-primary/5 dark:to-purple-400/10 blur-2xl"
                }`}
            />

            {/* SVG ring */}
            <svg className="w-full h-full -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
              {/* Glass fill */}
              <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.2)" className="dark:fill-white/[0.04] dark:stroke-white/20" stroke="white" strokeWidth="0.5" />
              {/* Track */}
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(140,48,232,0.08)" strokeWidth="1.5" className="dark:stroke-purple-500/10" />
              {/* Progress */}
              <circle
                cx="50" cy="50" r="46"
                fill="none"
                stroke="url(#timerGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress / 100)}
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8c30e8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl md:text-8xl font-light tracking-tighter text-text-main dark:text-white drop-shadow-sm font-mono">
                {minutes}:{seconds}
              </span>
              <span className="text-sm text-primary/60 dark:text-purple-400/60 uppercase tracking-[0.2em] mt-2">
                {isRunning ? "Focusing…" : timeLeft === 0 ? "Session Complete" : "Pomodoro"}
              </span>
            </div>
          </div>

          {/* ---- Timer Controls ---- */}
          <div className="flex gap-6 items-center">
            <button
              onClick={resetTimer}
              className="w-14 h-14 rounded-full bg-white/60 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/10 text-text-muted dark:text-slate-400 hover:text-primary flex items-center justify-center transition-all shadow-[0_8px_32px_rgba(140,48,232,0.1)] border border-white/50 dark:border-white/10"
            >
              <RotateCcw size={20} />
            </button>

            <button
              onClick={toggleTimer}
              disabled={timeLeft === 0}
              className={`h-16 px-10 rounded-2xl text-white font-semibold text-lg flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed
                ${isRunning
                  ? "bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/15 text-text-main dark:text-white shadow-lg"
                  : "bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1"
                }`}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? "Pause" : "Start Session"}
            </button>

            <button className="w-14 h-14 rounded-full bg-white/60 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/10 text-text-muted dark:text-slate-400 hover:text-primary flex items-center justify-center transition-all shadow-[0_8px_32px_rgba(140,48,232,0.1)] border border-white/50 dark:border-white/10">
              <Settings size={20} />
            </button>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  DASHBOARD GRID                                               */}
        {/* ============================================================ */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* ---- Card 1: AI Notes ---- */}
          <div className="glass-panel bg-gradient-to-br from-white/60 via-lavender-mist/30 to-mint-whisper/30 dark:from-white/[0.03] dark:via-purple-900/10 dark:to-transparent rounded-2xl p-6 hover-tilt relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <Sparkles size={28} className="text-primary dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-1">Recent AI Notes</h3>
            <p className="text-xs text-text-muted dark:text-slate-500 mb-6 uppercase tracking-wider">Generated 2h ago</p>

            <div className="space-y-4">
              {/* Note 1 */}
              <div className="bg-white/40 dark:bg-white/[0.04] p-4 rounded-xl border border-white/60 dark:border-white/[0.08] hover:bg-white/60 dark:hover:bg-white/[0.07] transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm text-primary dark:text-purple-400">Integration by Parts</span>
                  <span className="text-[10px] bg-primary/10 text-primary dark:bg-purple-500/20 dark:text-purple-300 px-2 py-0.5 rounded-full">Summary</span>
                </div>
                <p className="text-sm text-text-muted dark:text-slate-400 leading-relaxed line-clamp-2">
                  The formula for integration by parts is derived from the product rule of differentiation...
                </p>
              </div>
              {/* Note 2 */}
              <div className="bg-white/40 dark:bg-white/[0.04] p-4 rounded-xl border border-white/60 dark:border-white/[0.08] hover:bg-white/60 dark:hover:bg-white/[0.07] transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm text-primary dark:text-purple-400">Definite Integrals</span>
                  <span className="text-[10px] bg-mint-whisper text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 px-2 py-0.5 rounded-full">Flashcards</span>
                </div>
                <p className="text-sm text-text-muted dark:text-slate-400 leading-relaxed line-clamp-2">
                  Key concepts for calculating area under curves using Riemann sums.
                </p>
              </div>
            </div>
          </div>

          {/* ---- Card 2: Upcoming Tasks ---- */}
          <div className="glass-panel bg-gradient-to-br from-white/60 to-lavender-mist/40 dark:from-white/[0.03] dark:to-purple-900/5 rounded-2xl p-6 hover-tilt flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-text-main dark:text-white">Upcoming Tasks</h3>
              <button className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors">
                <Plus size={20} />
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {tasks.map((task, i) => (
                <div key={task.id}>
                  <div className="flex items-center gap-3 group">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="w-5 h-5 rounded-md border-2 border-primary/30 dark:border-purple-500/30 flex items-center justify-center cursor-pointer group-hover:border-primary dark:group-hover:border-purple-400 transition-colors shrink-0"
                    >
                      {task.done && <Check size={12} className="text-primary dark:text-purple-400" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium group-hover:text-primary dark:group-hover:text-purple-400 transition-colors ${task.done ? "line-through text-text-muted dark:text-slate-500" : "text-text-main dark:text-white"}`}>
                        {task.text}
                      </p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${priorityStyles[task.priority]}`}>
                      {task.priority.charAt(0) === "H" ? "High" : task.priority.charAt(0) === "M" ? "Med" : "Low"}
                    </div>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {i < tasks.length - 1 && (
                    <div className="h-px w-full bg-primary/5 dark:bg-white/[0.04] mt-3" />
                  )}
                </div>
              ))}
            </div>

            {/* Add inline */}
            <form
              onSubmit={(e) => { e.preventDefault(); addTask(); }}
              className="flex gap-2 mt-4 pt-4 border-t border-primary/5 dark:border-white/[0.06]"
            >
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a task…"
                className="flex-1 bg-white/40 dark:bg-white/[0.04] border border-white/60 dark:border-white/[0.08] rounded-xl px-3 py-2 text-sm text-text-main dark:text-white placeholder:text-text-muted dark:placeholder:text-slate-500 outline-none focus:border-primary/40 dark:focus:border-purple-500/40 transition-all"
              />
              <button
                type="submit"
                disabled={!newTask.trim()}
                className="p-2 rounded-xl bg-primary hover:bg-primary-soft text-white transition-colors disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </form>
          </div>

          {/* ---- Card 3: Ambience & Stats ---- */}
          <div className="flex flex-col gap-6">
            {/* Sound Mixer mini */}
            <div className="glass-panel bg-white/40 dark:bg-white/[0.03] rounded-2xl p-5 hover-tilt border border-white/60 dark:border-white/[0.08]">
              <div className="flex items-center gap-2 mb-4">
                <Music size={16} className="text-primary dark:text-purple-400" />
                <h4 className="font-bold text-text-main dark:text-white text-sm">Ambient Sounds</h4>
              </div>

              <div className="space-y-3">
                {sounds.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className={`${s.enabled ? "text-primary dark:text-purple-400" : "text-text-muted dark:text-slate-500"} transition-colors`}>
                      {s.icon}
                    </span>
                    <span className="text-sm text-text-main dark:text-slate-300 flex-1 font-medium">{s.label}</span>

                    {/* Volume slider (visible when enabled) */}
                    {s.enabled && (
                      <input
                        type="range" min={0} max={100} value={s.volume}
                        onChange={(e) => setVolume(s.id, Number(e.target.value))}
                        className="w-16 h-1 rounded-full appearance-none bg-gray-200 dark:bg-white/10 accent-primary cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow"
                      />
                    )}

                    {/* Toggle */}
                    <button
                      onClick={() => toggleSound(s.id)}
                      className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0
                        ${s.enabled ? "bg-primary" : "bg-gray-200 dark:bg-white/10"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                        ${s.enabled ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Focus Chart */}
            <div className="glass-panel bg-white/40 dark:bg-white/[0.03] rounded-2xl p-6 hover-tilt flex-1 border border-white/60 dark:border-white/[0.08] flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-primary dark:text-purple-400" />
                <h3 className="font-bold text-text-main dark:text-white">Weekly Focus</h3>
              </div>

              <div className="flex items-end gap-2 h-24 mb-2">
                {WEEKLY_DATA.map((d, i) => {
                  const isToday = i === 2;
                  return (
                    <div key={i} className="w-1/5 relative group">
                      <div
                        className={`rounded-t-lg transition-colors cursor-pointer
                          ${isToday
                            ? "bg-primary shadow-lg shadow-primary/20"
                            : d.pct > 10
                              ? "bg-primary/20 dark:bg-purple-500/20 hover:bg-primary/40 dark:hover:bg-purple-500/30"
                              : "bg-gray-200 dark:bg-white/[0.06] hover:bg-gray-300 dark:hover:bg-white/10"
                          }`}
                        style={{ height: `${d.pct}%` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-text-main dark:bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {d.hours}h
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-text-muted dark:text-slate-500 px-1">
                {WEEKLY_DATA.map((d, i) => (
  <span key={i}>{d.day}</span>
))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================ */}
      {/*  FOOTER XP BAR                                                 */}
      {/* ============================================================ */}
      <footer className="fixed bottom-0 left-0 w-full glass-panel border-t border-white/60 dark:border-white/[0.06] py-3 px-6 z-40 backdrop-blur-xl bg-white/80 dark:bg-white/[0.03]">
        <div className="flex items-center gap-4 w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-1.5 shrink-0 hidden sm:flex">
            <Flame size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary whitespace-nowrap">Level 14</span>
          </div>
          <div className="relative flex-1 h-1.5 bg-gray-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-[72%] shimmer-bg rounded-full shadow-[0_0_10px_rgba(140,48,232,0.6)]" />
          </div>
          <span className="text-xs text-text-muted dark:text-slate-500 whitespace-nowrap">2,450 / 3,000 XP</span>
        </div>
      </footer>
    </div>
  );
}
