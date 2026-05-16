"use client";
import { toast } from "sonner";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, RotateCcw, Settings, CloudRain, Coffee, Radio, Plus, Trash2,
  Music, CheckCircle2, Circle, Sparkles, Flame, Check, BarChart3, X // 👈 X import add kiya
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface SoundChannel {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  volume: number;
  file: string; 
}

interface Task {
  _id: string;
  text: string;
  done: boolean;
  priority: "High" | "Med" | "Low";
  source?: "task" | "assignment";
  dueDate?: string | null;
  mentorName?: string;
}

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */
const WEEKLY_DATA = [
  { day: "M", hours: 2, pct: 40 },
  { day: "T", hours: 3, pct: 60 },
  { day: "W", hours: 5.5, pct: 85 },
  { day: "T", hours: 2.5, pct: 50 },
  { day: "F", hours: 0, pct: 10 },
];

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */
export default function FocusRoomsPage() {
  /* ---- Settings Logic (New) ---- */
  const [focusDuration, setFocusDuration] = useState(25); // 👈 Default 25 mins
  const [showSettings, setShowSettings] = useState(false); // 👈 Modal dikhane ke liye

  /* ---- Timer ---- */
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- XP & Progress State ---- */
  const [userLevel, setUserLevel] = useState(1);
  const [userXp, setUserXp] = useState(0);

  /* ---- 🎵 Audio Engine Refs 🎵 ---- */
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  /* ---- Sounds ---- */
  const [sounds, setSounds] = useState<SoundChannel[]>([
    { id: "rain", label: "Rainy Lofi", icon: <CloudRain size={18} />, enabled: false, volume: 50, file: "/sounds/rain.mp3" },
    { id: "cafe", label: "Café Jazz", icon: <Coffee size={18} />, enabled: false, volume: 50, file: "/sounds/cafe.mp3" },
    { id: "white", label: "Deep Focus", icon: <Radio size={18} />, enabled: false, volume: 50, file: "/sounds/white-noise.mp3" },
  ]);

  /* ---- Tasks ---- */
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"High" | "Med" | "Low">("Med"); 
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const taskInputRef = useRef<HTMLInputElement>(null);

  /* ------------------------------------------------------------------ */
  /* 🎵 Audio Logic                                                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const refs = audioRefs.current;
    sounds.forEach((s) => {
      if (!refs[s.id]) {
        const audio = new Audio(s.file);
        audio.loop = true;
        audio.preload = "auto";
        audio.onerror = () => console.warn(`Failed to load audio: ${s.file}`);
        refs[s.id] = audio;
      }
    });

    return () => {
      Object.values(refs).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioRefs.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sounds.forEach((s) => {
      const audio = audioRefs.current[s.id];
      if (audio) {
        audio.volume = s.volume / 100;
        if (s.enabled) {
          audio.play().catch(() => console.log("User interaction required"));
        } else {
          audio.pause();
        }
      }
    });
  }, [sounds]);

  /* ---- DB SE TASKS AUR PROGRESS MANGWANA ---- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resTasks, resAssignments, resProgress] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/student/assignments"),
          fetch("/api/focus"),
        ]);

        let personalTasks: Task[] = [];
        if (resTasks.ok) {
          const data = await resTasks.json();
          personalTasks = Array.isArray(data)
            ? data.map((task) => ({ ...task, source: "task" as const }))
            : [];
        } else {
          toast.error("Failed to load tasks.");
        }

        let mentorAssignments: Task[] = [];
        if (resAssignments.ok) {
          const data = await resAssignments.json();
          const assignments = Array.isArray(data?.assignments)
            ? data.assignments
            : [];
          mentorAssignments = assignments.map((assignment: any) => ({
            _id: String(assignment.id),
            text: assignment.title || "Mentor assignment",
            done: false,
            priority: "High" as const,
            source: "assignment" as const,
            dueDate: assignment.dueDate || null,
            mentorName: assignment?.mentor?.name || "Mentor",
          }));
        } else {
          toast.error("Failed to load mentor assignments.");
        }

        setTasks([...mentorAssignments, ...personalTasks]);

        if (resProgress.ok) {
          const data = await resProgress.json();
          setUserLevel(data.level || 1);
          setUserXp(data.xp || 0);
        } else {
          toast.error("Failed to load XP progress.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Network error while loading data.");
      } finally {
        setIsLoadingTasks(false);
      }
    };
    fetchData();
  }, []);

  /* ---- Timer & Session Logic ---- */
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleSessionComplete = useCallback(async () => {
    const minutesFocused = focusDuration; // 👈 Dynamic minutes update

    try {
      const res = await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes: minutesFocused }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserLevel(data.progress.level);
        setUserXp(data.progress.xp);
        toast.success(`Focus Session Complete! You earned ${data.earnedXp} XP!`, {
          icon: '🎉',
          duration: 4000,
        });
      } else {
        toast.error("Failed to save focus session.");
      }
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error("Network error while saving session.");
    }
  }, [focusDuration]); // 👈 Dependency add ki

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return clearTimer;
  }, [isRunning, clearTimer]);

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      clearTimer();
      setIsRunning(false);
      handleSessionComplete();
    }
  }, [timeLeft, isRunning, clearTimer, handleSessionComplete]);

  const toggleTimer = () => {
    if (timeLeft === 0) return;
    setIsRunning((r) => !r);
  };
  const resetTimer = () => {
    clearTimer();
    setIsRunning(false);
    setTimeLeft(focusDuration * 60); // 👈 Dynamic reset
  };

  /* ---- Derived values ---- */
  const minutesDisplay = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secondsDisplay = String(timeLeft % 60).padStart(2, "0");
  
  // 👈 Progress calculation dynamic ho gayi hai
  const totalSeconds = focusDuration * 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  
  const circumference = 2 * Math.PI * 46;
  const currentLevelXp = userXp % 1000;
  const xpProgressPct = (currentLevelXp / 1000) * 100;

  /* ---- Sound helpers ---- */
  const toggleSound = (id: string) =>
    setSounds((p) => p.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  const setVolume = (id: string, v: number) =>
    setSounds((p) => p.map((s) => (s.id === id ? { ...s, volume: v } : s)));

  /* ---- Task helpers ---- */
  const addTask = async () => {
    const text = newTask.trim();
    if (!text) return;

    const priority = newTaskPriority;
    const tempId = crypto.randomUUID();
    setTasks((p) => [...p, { _id: tempId, text, done: false, priority }]);
    setNewTask("");
    setNewTaskPriority("Med");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, priority }),
      });
      if (res.ok) {
        const savedTask = await res.json();
        setTasks((p) => p.map(t => t._id === tempId ? savedTask : t));
      } else {
        setTasks((p) => p.filter(t => t._id !== tempId));
        toast.error("Failed to save task.");
      }
    } catch (error) {
      setTasks((p) => p.filter(t => t._id !== tempId));
      toast.error("Network error while saving task.");
    }
  };

  const toggleTask = async (task: Task) => {
    setTasks((p) => p.map((t) => (t._id === task._id ? { ...t, done: !t.done } : t)));
    try {
      const res =
        task.source === "assignment"
          ? await fetch("/api/student/assignments", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: task._id, status: "completed" }),
            })
          : await fetch("/api/tasks", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: task._id, done: !task.done }),
            });
      if (!res.ok) {
        setTasks((p) => p.map((t) => (t._id === task._id ? { ...t, done: task.done } : t)));
        toast.error("Failed to update task.");
      } else if (task.source === "assignment") {
        setTasks((p) => p.filter((t) => t._id !== task._id));
        toast.success("Mentor assignment completed.");
      }
    } catch (error) {
      setTasks((p) => p.map((t) => (t._id === task._id ? { ...t, done: task.done } : t)));
      toast.error("Network error while updating task.");
    }
  };

  const removeTask = async (id: string) => {
    const task = tasks.find((item) => item._id === id);

    if (task?.source === "assignment") {
      toast.info("Mentor assignments can be completed, not deleted.");
      return;
    }

    const snapshot = tasks;
    setTasks((p) => p.filter((t) => t._id !== id));
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        setTasks(snapshot);
        toast.error("Failed to delete task.");
      }
    } catch (error) {
      setTasks(snapshot);
      toast.error("Network error while deleting task.");
    }
  };

  const priorityStyles: Record<string, string> = {
    High: "bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-400",
    Med: "bg-blue-100 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400",
    Low: "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-mint-whisper dark:bg-purple-900/20 blur-[100px]" />
      </div>

      <div className="px-4 md:px-10 pt-8 pb-24 max-w-6xl mx-auto">
        <section className="flex flex-col items-center justify-center mb-16 relative">
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

          <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center mb-12">
            <div
              className={`absolute inset-0 rounded-full transition-all duration-700
                ${isRunning
                  ? "bg-gradient-to-tr from-primary/15 to-purple-300/20 dark:from-primary/20 dark:to-purple-500/15 blur-2xl scale-110"
                  : "bg-gradient-to-tr from-primary/5 to-purple-200/20 dark:from-primary/5 dark:to-purple-400/10 blur-2xl"
                }`}
            />
            <svg className="w-full h-full -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.2)" className="dark:fill-white/[0.04] dark:stroke-white/20" stroke="white" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(140,48,232,0.08)" strokeWidth="1.5" className="dark:stroke-purple-500/10" />
              <circle
                cx="50" cy="50" r="46" fill="none" stroke="url(#timerGrad)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progressPercent / 100)} className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8c30e8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl md:text-8xl font-light tracking-tighter text-text-main dark:text-white drop-shadow-sm font-mono">
                {minutesDisplay}:{secondsDisplay}
              </span>
              <span className="text-sm text-primary/60 dark:text-purple-400/60 uppercase tracking-[0.2em] mt-2">
                {isRunning ? "Focusing…" : timeLeft === 0 ? "Session Complete" : "Pomodoro"}
              </span>
            </div>
          </div>

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
              className={`h-16 px-10 rounded-2xl font-semibold text-lg flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed
                ${isRunning
                  ? "bg-primary/10 dark:bg-white/10 hover:bg-primary/20 dark:hover:bg-white/15 text-primary dark:text-white shadow-sm"
                  : "bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1"
                }`}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? "Pause" : "Start Session"}
            </button>

            {/* 👇 Settings Button Functionality Attached */}
            <button 
              onClick={() => setShowSettings(true)}
              className="w-14 h-14 rounded-full bg-white/60 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/10 text-text-muted dark:text-slate-400 hover:text-primary flex items-center justify-center transition-all shadow-[0_8px_32px_rgba(140,48,232,0.1)] border border-white/50 dark:border-white/10"
            >
              <Settings size={20} />
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          
          <div className="glass-panel bg-gradient-to-br from-white/60 via-lavender-mist/30 to-mint-whisper/30 dark:from-white/[0.03] dark:via-purple-900/10 dark:to-transparent rounded-2xl p-6 hover-tilt relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <Sparkles size={28} className="text-primary dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-1">Recent AI Notes</h3>
            <p className="text-xs text-text-muted dark:text-slate-500 mb-6 uppercase tracking-wider">Generated 2h ago</p>

            <div className="space-y-4">
              <div className="bg-white/40 dark:bg-white/[0.04] p-4 rounded-xl border border-white/60 dark:border-white/[0.08] hover:bg-white/60 dark:hover:bg-white/[0.07] transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm text-primary dark:text-purple-400">Integration by Parts</span>
                  <span className="text-[10px] bg-primary/10 text-primary dark:bg-purple-500/20 dark:text-purple-300 px-2 py-0.5 rounded-full">Summary</span>
                </div>
                <p className="text-sm text-text-muted dark:text-slate-400 leading-relaxed line-clamp-2">
                  The formula for integration by parts is derived from the product rule of differentiation...
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel bg-gradient-to-br from-white/60 to-lavender-mist/40 dark:from-white/[0.03] dark:to-purple-900/5 rounded-2xl p-6 hover-tilt flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-text-main dark:text-white">Upcoming Tasks</h3>
              <button 
                onClick={() => {
                  if (!newTask.trim()) {
                    taskInputRef.current?.focus();
                  } else {
                    addTask();
                  }
                }}
                className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors flex items-center justify-center bg-primary/5 dark:bg-white/5"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {isLoadingTasks ? (
                <div className="text-sm text-center text-slate-500 py-4">Fetching tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-sm text-center text-slate-500 py-4">No tasks pending!</div>
              ) : (
                tasks.map((task, i) => (
                  <div key={task._id}>
                    <div className="flex items-center gap-3 group">
                      <button
                        onClick={() => toggleTask(task)}
                        className="w-5 h-5 rounded-md border-2 border-primary/30 dark:border-purple-500/30 flex items-center justify-center cursor-pointer group-hover:border-primary dark:group-hover:border-purple-400 transition-colors shrink-0"
                      >
                        {task.done && <Check size={12} className="text-primary dark:text-purple-400" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium group-hover:text-primary dark:group-hover:text-purple-400 transition-colors ${task.done ? "line-through text-text-muted dark:text-slate-500" : "text-text-main dark:text-white"}`}>
                          {task.text}
                        </p>
                        {task.source === "assignment" && (
                          <p className="mt-0.5 text-[11px] font-medium text-[#7C3AED]">
                            Assigned by {task.mentorName}
                            {task.dueDate
                              ? ` - Due ${new Date(task.dueDate).toLocaleDateString("en", {
                                  month: "short",
                                  day: "numeric",
                                })}`
                              : ""}
                          </p>
                        )}
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${priorityStyles[task.priority]}`}>
                        {task.priority.charAt(0) === "H" ? "High" : task.priority.charAt(0) === "M" ? "Med" : "Low"}
                      </div>
                      {task.source !== "assignment" && (
                        <button
                          onClick={() => removeTask(task._id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {i < tasks.length - 1 && (
                      <div className="h-px w-full bg-primary/5 dark:bg-white/[0.04] mt-3" />
                    )}
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); addTask(); }}
              className="flex gap-2 mt-4 pt-4 border-t border-primary/5 dark:border-white/[0.06]"
            >
              <input
                ref={taskInputRef}
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a task..."
                className="flex-1 bg-white/40 dark:bg-white/[0.04] border border-white/60 dark:border-white/[0.08] rounded-xl px-3 py-2 text-sm text-text-main dark:text-white placeholder:text-text-muted dark:placeholder:text-slate-500 outline-none focus:border-primary/40 dark:focus:border-purple-500/40 transition-all"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as "High" | "Med" | "Low")}
                className="bg-white/60 dark:bg-white/[0.04] border border-white/60 dark:border-white/[0.08] rounded-xl px-2 py-2 text-sm font-medium text-text-main dark:text-white outline-none focus:border-primary/40 transition-all cursor-pointer"
              >
                <option value="High" className="text-red-500 font-bold">High</option>
                <option value="Med" className="text-blue-500 font-bold">Med</option>
                <option value="Low" className="text-green-600 font-bold">Low</option>
              </select>
            </form>
          </div>

          <div className="flex flex-col gap-6">
            <div className="glass-panel bg-white/40 dark:bg-white/[0.03] rounded-2xl p-5 hover-tilt border border-white/60 dark:border-white/[0.08]">
              <div className="flex items-center gap-2 mb-4">
                <Music size={16} className="text-primary dark:text-purple-400" />
                <h4 className="font-bold text-text-main dark:text-white text-sm">Ambient Sounds</h4>
              </div>

              <div className="space-y-3">
                {sounds.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className={`${s.enabled ? "text-primary dark:text-purple-400" : "text-text-muted dark:text-slate-500"} transition-colors`}>{s.icon}</span>
                    <span className="text-sm text-text-main dark:text-slate-300 flex-1 font-medium">{s.label}</span>
                    {s.enabled && (
                      <input
                        type="range" min={0} max={100} value={s.volume}
                        onChange={(e) => setVolume(s.id, Number(e.target.value))}
                        className="w-16 h-1 rounded-full appearance-none bg-gray-200 dark:bg-white/10 accent-primary cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow"
                      />
                    )}
                    <button
                      onClick={() => toggleSound(s.id)}
                      className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${s.enabled ? "bg-primary" : "bg-gray-200 dark:bg-white/10"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${s.enabled ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

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
                        className={`rounded-t-lg transition-colors cursor-pointer ${isToday ? "bg-primary shadow-lg shadow-primary/20" : d.pct > 10 ? "bg-primary/20 dark:bg-purple-500/20 hover:bg-primary/40 dark:hover:bg-purple-500/30" : "bg-gray-200 dark:bg-white/[0.06] hover:bg-gray-300 dark:hover:bg-white/10"}`}
                        style={{ height: `${d.pct}%` }}
                      />
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-text-main dark:bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {d.hours}h
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-text-muted dark:text-slate-500 px-1">
                {WEEKLY_DATA.map((d, i) => (<span key={i}>{d.day}</span>))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="fixed bottom-0 left-0 w-full glass-panel border-t border-white/60 dark:border-white/[0.06] py-3 px-6 z-40 backdrop-blur-xl bg-white/80 dark:bg-white/[0.03]">
        <div className="flex items-center gap-4 w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-1.5 shrink-0 hidden sm:flex">
            <Flame size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary whitespace-nowrap">Level {userLevel}</span>
          </div>
          
          <div className="relative flex-1 h-1.5 bg-gray-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full shimmer-bg rounded-full shadow-[0_0_10px_rgba(140,48,232,0.6)] transition-all duration-1000 ease-out" 
              style={{ width: `${xpProgressPct}%` }}
            />
          </div>
          
          <span className="text-xs text-text-muted dark:text-slate-500 whitespace-nowrap">
            {currentLevelXp} / 1,000 XP
          </span>
        </div>
      </footer>

      {/* ========================================= */}
      {/* 👇 Settings Modal (Naya Izafa)            */}
      {/* ========================================= */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="glass-panel bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-text-main dark:text-white">Timer Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-text-main dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-muted dark:text-slate-400 mb-2">
                Focus Duration (Minutes)
              </label>
              <input 
                type="number" 
                min="1" 
                max="120" 
                value={focusDuration} 
                onChange={(e) => setFocusDuration(Number(e.target.value))} 
                className="w-full bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-text-main dark:text-white outline-none focus:border-primary/50 transition-all" 
              />
            </div>
            
            <button 
              onClick={() => { 
                setTimeLeft(focusDuration * 60); 
                setShowSettings(false); 
                setIsRunning(false); 
                if (intervalRef.current) clearInterval(intervalRef.current);
              }} 
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/30"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
