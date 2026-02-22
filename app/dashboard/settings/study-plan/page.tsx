"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Rocket,
  Briefcase,
  ChevronDown,
  Search,
  X,
  Save,
  RotateCcw,
  Brain,
  ClipboardList,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Shared input class (consistent with other settings pages)           */
/* ------------------------------------------------------------------ */
const inputCls = `
  w-full px-4 py-3 rounded-xl border text-sm
  border-slate-200 bg-white text-slate-900 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
  dark:border-white/10 dark:bg-white/[0.04] dark:text-white
  dark:placeholder:text-slate-500 dark:focus:border-purple-400 dark:focus:ring-purple-400/20
  transition-colors
`;

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */
const academicLevels = [
  "High School",
  "University Undergraduate",
  "University Graduate",
  "Post-Graduate / PhD",
  "Self-Learner / Professional",
];

interface GoalOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const goals: GoalOption[] = [
  {
    id: "ace-exams",
    label: "Ace Exams",
    description: "Focus on test prep and grades",
    icon: <GraduationCap className="w-6 h-6" />,
  },
  {
    id: "build-project",
    label: "Build a Project",
    description: "Learn by doing, ship something real",
    icon: <Rocket className="w-6 h-6" />,
  },
  {
    id: "career-prep",
    label: "Career Prep",
    description: "Interview readiness & portfolio",
    icon: <Briefcase className="w-6 h-6" />,
  },
];

const defaultTags = [
  "React.js",
  "JavaScript",
  "Software Architecture",
  "Human-Computer Interaction (HCI)",
];

const studyTimes = ["Mornings", "Afternoons", "Evenings", "Late Night"];

/* ------------------------------------------------------------------ */
/* Section Card wrapper                                                */
/* ------------------------------------------------------------------ */
function SectionCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle Switch                                                       */
/* ------------------------------------------------------------------ */
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30
        ${checked ? "bg-primary" : "bg-slate-300 dark:bg-white/15"}
      `}
    >
      <motion.span
        layout
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 22 : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function StudyPlanPage() {
  /* — state — */
  const [level, setLevel] = useState("University Undergraduate");
  const [levelOpen, setLevelOpen] = useState(false);
  const [goal, setGoal] = useState("build-project");
  const [tags, setTags] = useState<string[]>(defaultTags);
  const [tagInput, setTagInput] = useState("");
  const [hours, setHours] = useState(10);
  const [times, setTimes] = useState<string[]>(["Evenings", "Late Night"]);
  const [socratic, setSocratic] = useState(true);
  const [strict, setStrict] = useState(false);
  const [dirty, setDirty] = useState(false);
  const tagRef = useRef<HTMLInputElement>(null);

  const markDirty = () => {
    if (!dirty) setDirty(true);
  };

  /* tag helpers */
  const addTag = (value: string) => {
    const v = value.trim();
    if (v && !tags.includes(v)) {
      setTags([...tags, v]);
      markDirty();
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    markDirty();
  };

  const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const toggleTime = (t: string) => {
    setTimes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
    markDirty();
  };

  /* reset */
  const discard = () => {
    setLevel("University Undergraduate");
    setGoal("build-project");
    setTags([...defaultTags]);
    setTagInput("");
    setHours(10);
    setTimes(["Evenings", "Late Night"]);
    setSocratic(true);
    setStrict(false);
    setDirty(false);
  };

  return (
    <div className="relative pb-24 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-8"
      >
        {/* ── Header ── */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Study Plan & Goals
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure your learning objectives to get better mentor matches and
            AI recommendations.
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* Section A: Learning Objectives                             */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionCard>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Learning Objectives
          </h3>

          {/* Academic level dropdown */}
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Current Academic Level
          </label>
          <div className="relative mb-6">
            <button
              onClick={() => setLevelOpen(!levelOpen)}
              className={`${inputCls} flex items-center justify-between text-left cursor-pointer`}
            >
              <span>{level}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  levelOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {levelOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900 overflow-hidden"
                >
                  {academicLevels.map((l) => (
                    <li key={l}>
                      <button
                        onClick={() => {
                          setLevel(l);
                          setLevelOpen(false);
                          markDirty();
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          l === level
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        {l}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Primary goal cards */}
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Primary Goal
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {goals.map((g) => {
              const active = goal === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setGoal(g.id);
                    markDirty();
                  }}
                  className={`
                    group relative flex flex-col items-center gap-2 p-5 rounded-xl border-2
                    text-center transition-all duration-200
                    ${
                      active
                        ? "border-primary bg-primary/[0.06] dark:bg-primary/10 shadow-sm"
                        : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                    }
                  `}
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                      active
                        ? "bg-primary/15 text-primary"
                        : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 group-hover:text-primary"
                    }`}
                  >
                    {g.icon}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      active
                        ? "text-primary"
                        : "text-slate-800 dark:text-white"
                    }`}
                  >
                    {g.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {g.description}
                  </span>

                  {/* Check mark */}
                  {active && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* Section B: Subject Interests                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionCard>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            Subject Interests
          </h3>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            What do you want to learn?
          </label>

          {/* Tag input */}
          <div
            onClick={() => tagRef.current?.focus()}
            className={`
              flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl border cursor-text
              border-slate-200 bg-white
              focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary
              dark:border-white/10 dark:bg-white/[0.04]
              dark:focus-within:border-purple-400 dark:focus-within:ring-purple-400/20
              transition-colors
            `}
          >
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />

            {/* Existing tags inline */}
            <AnimatePresence>
              {tags.map((tag) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 pl-3 pr-2 py-1 text-xs font-semibold text-primary border border-primary/20"
                >
                  {tag}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(tag);
                    }}
                    className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary/20 transition-colors"
                    aria-label={`Remove ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>

            <input
              ref={tagRef}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKey}
              placeholder={
                tags.length === 0
                  ? "Type a subject and press enter..."
                  : "Add more..."
              }
              className="flex-1 min-w-[140px] bg-transparent py-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {tags.length > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              {tags.length} subject{tags.length !== 1 ? "s" : ""} selected.
              Press Enter to add, Backspace to remove.
            </p>
          )}
        </SectionCard>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* Section C: Weekly Routine & Availability                    */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionCard>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            Weekly Routine & Availability
          </h3>

          {/* Time commitment slider */}
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Weekly Time Commitment
          </label>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                1 hr
              </span>
              <motion.span
                key={hours}
                initial={{ scale: 0.9, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-bold"
              >
                {hours} hours / week
              </motion.span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                40 hrs
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={40}
              value={hours}
              onChange={(e) => {
                setHours(Number(e.target.value));
                markDirty();
              }}
              className="
                w-full h-2 rounded-lg appearance-none cursor-pointer
                bg-slate-200 dark:bg-white/10
                accent-primary
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary/30
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
              "
            />
          </div>

          {/* Study time pills */}
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Preferred Study Times
          </label>
          <div className="flex flex-wrap gap-2">
            {studyTimes.map((t) => {
              const active = times.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTime(t)}
                  className={`
                    px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200
                    ${
                      active
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-primary/40 hover:text-primary"
                    }
                  `}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* Section D: Mentorship & AI Preferences                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionCard>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Mentorship & AI Preferences
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Socratic AI Mode */}
            <div
              className={`
                flex items-start gap-4 p-4 rounded-xl border transition-colors
                ${
                  socratic
                    ? "border-primary/30 bg-primary/[0.04] dark:bg-primary/[0.06]"
                    : "border-slate-200 dark:border-white/10"
                }
              `}
            >
              <div className="pt-0.5">
                <Toggle
                  checked={socratic}
                  onChange={() => {
                    setSocratic(!socratic);
                    markDirty();
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Socratic AI Mode
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  AI will ask guiding questions instead of giving direct answers.
                </p>
              </div>
            </div>

            {/* Strict Mentorship */}
            <div
              className={`
                flex items-start gap-4 p-4 rounded-xl border transition-colors
                ${
                  strict
                    ? "border-primary/30 bg-primary/[0.04] dark:bg-primary/[0.06]"
                    : "border-slate-200 dark:border-white/10"
                }
              `}
            >
              <div className="pt-0.5">
                <Toggle
                  checked={strict}
                  onChange={() => {
                    setStrict(!strict);
                    markDirty();
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Strict Mentorship
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Prefer mentors who assign heavy homework and strict deadlines.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Floating Action Bar                                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[min(calc(100%-2rem),600px)]"
      >
        <div
          className="
            flex items-center justify-between gap-4
            px-6 py-4 rounded-2xl
            bg-white/80 border border-slate-200
            backdrop-blur-xl shadow-lg shadow-slate-200/40
            dark:bg-slate-900/80 dark:border-white/10
            dark:shadow-black/30
          "
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
            {dirty ? "You have unsaved changes" : "No unsaved changes"}
          </p>

          <div className="flex items-center gap-3 ml-auto">
            {/* Discard */}
            <button
              onClick={discard}
              className="
                flex items-center gap-2 px-5 py-2.5 rounded-xl
                border border-slate-200 text-sm font-medium
                text-slate-600 hover:bg-slate-50
                dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.06]
                transition-colors
              "
            >
              <RotateCcw size={15} />
              Discard Changes
            </button>

            {/* Save */}
            <button
              className="
                relative flex items-center gap-2 px-6 py-2.5 rounded-xl
                bg-primary text-white text-sm font-semibold
                hover:bg-primary/90
                shadow-lg shadow-primary/25
                transition-colors overflow-hidden
              "
            >
              {/* Glow sweep */}
              <span
                className="
                  pointer-events-none absolute inset-0
                  bg-gradient-to-r from-transparent via-white/20 to-transparent
                  -translate-x-full animate-[shimmer-slide_3s_ease-in-out_infinite]
                "
              />
              <Save size={15} className="relative z-10" />
              <span className="relative z-10">Save Preferences</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
