"use client";
import { toast } from "sonner";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, RotateCcw, Settings, CloudRain, Coffee, Radio, Plus, Trash2,
  Music, CheckCircle2, Circle, Sparkles, Flame, Check, BarChart3, X // 👈 X import add kiya
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MinimalTodoList } from "@/components/focus/MinimalTodoList";
import { useGamificationStore } from "@/store/useGamificationStore";
import { useFocusTodoStore } from "@/store/useFocusTodoStore";

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

interface WeeklyFocusDay {
  day: string;
  label: string;
  minutes: number;
  hours: number;
  pct: number;
}

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */
const DEFAULT_WEEKLY_DATA: WeeklyFocusDay[] = [
  { day: "M", label: "Monday", minutes: 0, hours: 0, pct: 0 },
  { day: "T", label: "Tuesday", minutes: 0, hours: 0, pct: 0 },
  { day: "W", label: "Wednesday", minutes: 0, hours: 0, pct: 0 },
  { day: "T", label: "Thursday", minutes: 0, hours: 0, pct: 0 },
  { day: "F", label: "Friday", minutes: 0, hours: 0, pct: 0 },
  { day: "S", label: "Saturday", minutes: 0, hours: 0, pct: 0 },
  { day: "S", label: "Sunday", minutes: 0, hours: 0, pct: 0 },
];

function formatFocusMinutes(minutes: number) {
  return Number.isInteger(minutes) ? String(minutes) : minutes.toFixed(1);
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */
export default function FocusRoomsPage() {
  /* ---- Settings Logic (New) ---- */
  const [focusDuration, setFocusDuration] = useState(25); // 👈 Default 25 mins
  const [showSettings, setShowSettings] = useState(false); // 👈 Modal dikhane ke liye

  const [draftFocusDuration, setDraftFocusDuration] = useState(25);

  /* ---- Timer ---- */
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const persistedFocusSecondsRef = useRef(0);
  const activeTimerSecondsRef = useRef(focusDuration * 60);

  /* ---- XP & Progress State ---- */
  const { stats, addReward } = useGamificationStore();
  const userLevel = stats.level;
  const userXp = stats.xp;
  const focusTodoTasks = useFocusTodoStore((state) => state.tasks);
  const [selectedFocusTaskId, setSelectedFocusTaskId] = useState("");
  const selectedFocusTaskRef = useRef<{ id: string; text: string } | null>(null);
  const [weeklyFocusData, setWeeklyFocusData] =
    useState<WeeklyFocusDay[]>(DEFAULT_WEEKLY_DATA);
  const [isLoadingWeeklyFocus, setIsLoadingWeeklyFocus] = useState(true);

  /* ---- 🎵 Audio Engine Refs 🎵 ---- */
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const unavailableSoundIdsRef = useRef<Set<string>>(new Set());

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
        audio.preload = "none";
        audio.onerror = () => {
          unavailableSoundIdsRef.current.add(s.id);
          audio.pause();
        };
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
          if (unavailableSoundIdsRef.current.has(s.id)) {
            audio.pause();
            return;
          }

          audio.play().catch((error) => {
            if (audio.error) {
              unavailableSoundIdsRef.current.add(s.id);
              audio.pause();
              return;
            }

            if (
              error instanceof DOMException &&
              error.name === "NotAllowedError"
            ) {
              return;
            }

            console.warn("Ambient sound playback failed.", error);
          });
        } else {
          audio.pause();
        }
      }
    });
  }, [sounds]);

  const stopAmbientAudio = useCallback(() => {
    Object.values(audioRefs.current).forEach((audio) => {
      audio.pause();
    });

    setSounds((currentSounds) =>
      currentSounds.map((sound) =>
        sound.enabled ? { ...sound, enabled: false } : sound
      )
    );
  }, []);

  useEffect(() => {
    if (!isRunning) {
      stopAmbientAudio();
    }
  }, [isRunning, stopAmbientAudio]);

  const fetchWeeklyFocusStats = useCallback(async () => {
    try {
      setIsLoadingWeeklyFocus(true);
      const response = await fetch("/api/user/focus-stats", {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (response.ok && Array.isArray(data?.data)) {
        setWeeklyFocusData(data.data);
      } else {
        setWeeklyFocusData(DEFAULT_WEEKLY_DATA);
      }
    } catch {
      setWeeklyFocusData(DEFAULT_WEEKLY_DATA);
    } finally {
      setIsLoadingWeeklyFocus(false);
    }
  }, []);

  useEffect(() => {
    void fetchWeeklyFocusStats();
  }, [fetchWeeklyFocusStats]);

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
          // The global gamification store will sync automatically, but we can set initial data if needed
          useGamificationStore.getState().setInitialData(data.xp || 0, 0, { level: data.level || 1 });
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

  const saveElapsedFocus = useCallback(
    async ({
      completed = false,
      elapsedSeconds,
    }: {
      completed?: boolean;
      elapsedSeconds?: number;
    } = {}) => {
      const totalElapsedSeconds =
        typeof elapsedSeconds === "number"
          ? elapsedSeconds
          : activeTimerSecondsRef.current - timeLeft;
      const secondsToSave = Math.max(
        0,
        Math.floor(totalElapsedSeconds - persistedFocusSecondsRef.current)
      );

      if (secondsToSave <= 0) {
        return;
      }

      try {
        const res = await fetch("/api/focus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            completed,
            seconds: secondsToSave,
            taskId: selectedFocusTaskRef.current?.id || "",
            taskTitle: selectedFocusTaskRef.current?.text || "",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          persistedFocusSecondsRef.current += secondsToSave;
          // Local state removed, store handles this via fetch weekly focus or addReward

          if (data?.reward) {
            const xpAwarded = Number(data.reward.xpAwarded || 10);
            const coinsAwarded = Number(data.reward.coinsAwarded || 0);
            addReward(xpAwarded, coinsAwarded);
          }

          await fetchWeeklyFocusStats();
          window.dispatchEvent(new Event("gamification-stats-updated"));
        } else {
          toast.error("Failed to save focus time.");
        }
      } catch (error) {
        console.error("Error saving session:", error);
        toast.error("Network error while saving focus time.");
      }
    },
    [addReward, fetchWeeklyFocusStats, timeLeft]
  );

  const handleSessionComplete = useCallback(async () => {
    stopAmbientAudio();
    await saveElapsedFocus({
      completed: true,
      elapsedSeconds: activeTimerSecondsRef.current,
    });
    persistedFocusSecondsRef.current = 0;
  }, [saveElapsedFocus, stopAmbientAudio]);

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

  useEffect(() => {
    if (
      selectedFocusTaskId &&
      !focusTodoTasks.some((task) => task.id === selectedFocusTaskId)
    ) {
      setSelectedFocusTaskId("");
    }
  }, [focusTodoTasks, selectedFocusTaskId]);

  const toggleTimer = () => {
    if (timeLeft === 0) return;
    if (isRunning) {
      void saveElapsedFocus();
    }
    setIsRunning((r) => !r);
  };
  const resetTimer = () => {
    const elapsedSeconds =
      timeLeft > 0 ? activeTimerSecondsRef.current - timeLeft : 0;
    clearTimer();
    setIsRunning(false);
    void saveElapsedFocus({ elapsedSeconds }).finally(() => {
      persistedFocusSecondsRef.current = 0;
    });
    activeTimerSecondsRef.current = focusDuration * 60;
    setTimeLeft(focusDuration * 60); // 👈 Dynamic reset
  };

  /* ---- Derived values ---- */
  const minutesDisplay = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secondsDisplay = String(timeLeft % 60).padStart(2, "0");
  
  // 👈 Progress calculation dynamic ho gayi hai
  const totalSeconds = focusDuration * 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  
  const circumference = 2 * Math.PI * 46;
  const effectiveLevel = Math.max(1, userLevel);
  const currentLevelXp = userXp % 1000;
  const maxXPForCurrentLevel = 1000;
  const xpProgressPct = Math.min(100, Math.max(0, (currentLevelXp / maxXPForCurrentLevel) * 100));
  const openFocusTasks = focusTodoTasks.filter((task) => !task.completed);
  const selectedFocusTask =
    focusTodoTasks.find((task) => task.id === selectedFocusTaskId) || null;
  selectedFocusTaskRef.current = selectedFocusTask
    ? { id: selectedFocusTask.id, text: selectedFocusTask.text }
    : null;

  /* ---- Sound helpers ---- */
  const toggleSound = (id: string) => {
    if (!isRunning) {
      toast.info("Start a focus session to play ambient sounds.");
      return;
    }

    setSounds((p) => p.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };
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
    High: "bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20 dark:text-rose-300",
    Med: "bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20 dark:text-purple-300",
    Low: "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 dark:text-emerald-300",
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-mint-whisper dark:bg-purple-900/20 blur-[100px]" />
      </div>

      <div className="px-4 md:px-10 pt-8 pb-24 max-w-6xl mx-auto">
        <section className="flex flex-col items-center justify-center mb-16 relative">
          <h1 className="text-3xl md:text-5xl font-bold text-text-main dark:text-white mb-2 text-center tracking-tight">
            Current Focus
          </h1>
          <div className="mb-10 flex w-full max-w-md flex-col items-center gap-2">
            <label
              htmlFor="active-focus-task"
              className="text-xs font-bold uppercase tracking-[0.18em] text-[#7C3AED]"
            >
              Working on
            </label>
            <select
              id="active-focus-task"
              value={selectedFocusTaskId}
              onChange={(event) => setSelectedFocusTaskId(event.target.value)}
              className="min-h-[44px] w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-2 text-center text-sm font-semibold text-text-main outline-none transition-colors focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            >
              <option value="">Select a task from To-Do</option>
              {openFocusTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.text}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center mb-12">
            <div
              className={`absolute inset-0 rounded-full transition-all duration-700
                ${isRunning
                  ? "bg-[#7C3AED]/15 blur-2xl scale-110"
                  : "bg-[#7C3AED]/5 blur-2xl"
                }`}
            />
            <svg className="w-full h-full -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.2)" className="dark:fill-white/[0.04] dark:stroke-white/20" stroke="white" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(140,48,232,0.08)" strokeWidth="1.5" className="dark:stroke-purple-500/10" />
              <circle
                cx="50" cy="50" r="46" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progressPercent / 100)} className="transition-all duration-1000 ease-linear"
              />
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
              onClick={() => {
                setDraftFocusDuration(focusDuration);
                setShowSettings(true);
              }}
              className="w-14 h-14 rounded-full bg-white/60 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/10 text-text-muted dark:text-slate-400 hover:text-primary flex items-center justify-center transition-all shadow-[0_8px_32px_rgba(140,48,232,0.1)] border border-white/50 dark:border-white/10"
            >
              <Settings size={20} />
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          
          <MinimalTodoList />

          <div className="glass-panel bg-white/60 dark:bg-white/[0.03] rounded-2xl p-6 hover-tilt flex flex-col">
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
              <div className="relative shrink-0">
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as "High" | "Med" | "Low")}
                  className={`min-h-[40px] appearance-none rounded-xl border px-3 py-2 pr-8 text-sm font-bold outline-none backdrop-blur-md transition-all cursor-pointer focus:border-[#7C3AED]/60 focus:ring-2 focus:ring-[#7C3AED]/20 dark:bg-gray-800/80 ${
                    newTaskPriority === "High"
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-500 dark:text-rose-300"
                      : newTaskPriority === "Low"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-300"
                        : "border-purple-500/30 bg-purple-500/10 text-purple-500 dark:text-purple-300"
                  }`}
                >
                  <option value="High" className="bg-white text-rose-500 dark:bg-gray-900">High</option>
                  <option value="Med" className="bg-white text-purple-500 dark:bg-gray-900">Med</option>
                  <option value="Low" className="bg-white text-emerald-500 dark:bg-gray-900">Low</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-current opacity-70" />
              </div>
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
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 transition-opacity ${
                      isRunning ? "opacity-100" : "opacity-50"
                    }`}
                  >
                    <span className={`${s.enabled ? "text-primary dark:text-purple-400" : "text-text-muted dark:text-slate-500"} transition-colors`}>{s.icon}</span>
                    <span className="text-sm text-text-main dark:text-slate-300 flex-1 font-medium">{s.label}</span>
                    {s.enabled && (
                      <input
                        type="range" min={0} max={100} value={s.volume}
                        disabled={!isRunning}
                        onChange={(e) => setVolume(s.id, Number(e.target.value))}
                        className="w-16 h-1 rounded-full appearance-none bg-gray-200 dark:bg-white/10 accent-primary cursor-pointer disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => toggleSound(s.id)}
                      disabled={!isRunning}
                      aria-disabled={!isRunning}
                      className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 disabled:cursor-not-allowed ${s.enabled ? "bg-primary" : "bg-gray-200 dark:bg-white/10"}`}
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

              {isLoadingWeeklyFocus ? (
                <div className="flex min-h-[300px] items-end gap-2" aria-label="Loading weekly focus chart">
                  {DEFAULT_WEEKLY_DATA.map((day, index) => (
                    <div key={`${day.label}-${index}`} className="flex-1">
                      <div
                        className="animate-pulse rounded-t-lg bg-[#7C3AED]/15"
                        style={{ height: `${24 + index * 8}px` }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="min-h-[300px] w-full" aria-label="Weekly focus minutes chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyFocusData} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "currentColor" }}
                      />
                      <YAxis hide domain={[0, "dataMax + 15"]} />
                      <Tooltip
                        cursor={{ fill: "rgba(124,58,237,0.08)" }}
                        formatter={(value) => [
                          `${formatFocusMinutes(Number(value))} min`,
                          "Focus",
                        ]}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.label || "Focus"
                        }
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid rgba(124,58,237,0.18)",
                        }}
                      />
                      <Bar
                        dataKey="minutes"
                        fill="#7C3AED"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={34}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <p className="mt-2 text-xs text-text-muted dark:text-slate-500">
                {formatFocusMinutes(
                  weeklyFocusData.reduce((total, day) => total + day.minutes, 0)
                )} minutes focused this week.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="fixed bottom-0 left-0 w-full glass-panel border-t border-white/60 dark:border-white/[0.06] py-3 px-6 z-40 backdrop-blur-xl bg-white/80 dark:bg-white/[0.03]">
        <div className="flex items-center gap-4 w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-1.5 shrink-0 hidden sm:flex">
            <Flame size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary whitespace-nowrap">Level {effectiveLevel}</span>
          </div>
          
          <div className="relative flex-1 h-1.5 bg-gray-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full rounded-full bg-[#7C3AED] shadow-[0_0_10px_rgba(140,48,232,0.35)] transition-all duration-1000 ease-out" 
              style={{ width: `${xpProgressPct}%` }}
            />
          </div>
          
          <span className="text-xs text-text-muted dark:text-slate-500 whitespace-nowrap">
            {currentLevelXp.toLocaleString()} / {maxXPForCurrentLevel.toLocaleString()} XP
          </span>
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
                value={draftFocusDuration} 
                onChange={(e) => setDraftFocusDuration(Number(e.target.value))} 
                className="w-full bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-text-main dark:text-white outline-none focus:border-primary/50 transition-all" 
              />
            </div>
            
            <button 
              onClick={() => { 
                const nextDuration = Math.min(
                  120,
                  Math.max(1, Number(draftFocusDuration) || 25)
                );
                const elapsedSeconds =
                  timeLeft > 0 ? activeTimerSecondsRef.current - timeLeft : 0;
                void saveElapsedFocus({ elapsedSeconds }).finally(() => {
                  persistedFocusSecondsRef.current = 0;
                });
                setFocusDuration(nextDuration);
                activeTimerSecondsRef.current = nextDuration * 60;
                setTimeLeft(nextDuration * 60); 
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

