"use client";

import React, { useState } from "react";
import {
  Globe,
  Clock,
  SlidersHorizontal,
  RotateCcw,
  Save,
  ArrowRight,
  Trash2,
  PlusCircle,
  MapPin,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════ */
/*  TYPES                                                            */
/* ═══════════════════════════════════════════════════════════════════ */

interface TimeSlot {
  id: number;
  start: string;
  end: string;
}

interface SessionType {
  id: number;
  name: string;
  duration: string;
  description: string;
  enabled: boolean;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  INITIAL DATA                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const defaultActiveDays = new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]);

const defaultSlots: TimeSlot[] = [
  { id: 1, start: "09:00", end: "12:00" },
  { id: 2, start: "13:30", end: "17:00" },
];

const defaultSessionTypes: SessionType[] = [
  {
    id: 1,
    name: "Quick Sync",
    duration: "15m",
    description: "Short check-ins for blockers.",
    enabled: true,
  },
  {
    id: 2,
    name: "Deep Dive",
    duration: "60m",
    description: "Intensive pair programming.",
    enabled: false,
  },
  {
    id: 3,
    name: "Code Review",
    duration: "30m",
    description: "Async or live PR review.",
    enabled: true,
  },
];

const timezones = [
  { value: "PST", label: "Pacific Standard Time (UTC-08:00)" },
  { value: "EST", label: "Eastern Standard Time (UTC-05:00)" },
  { value: "GMT", label: "Greenwich Mean Time (UTC+00:00)" },
];

/* ═══════════════════════════════════════════════════════════════════ */
/*  SUB-COMPONENTS                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

/** Day toggle pill using peer-checked */
function DayToggle({
  day,
  active,
  onChange,
}: {
  day: string;
  active: boolean;
  onChange: () => void;
}) {
  return (
    <label className="cursor-pointer group relative">
      <input
        type="checkbox"
        checked={active}
        onChange={onChange}
        className="peer sr-only"
      />
      <div
        className={[
          "flex items-center justify-center w-10 h-10 rounded-lg border",
          "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800",
          "text-slate-500 dark:text-slate-400",
          "peer-checked:bg-primary peer-checked:border-primary peer-checked:text-white",
          "peer-checked:shadow-lg peer-checked:shadow-primary/30",
          "transition-all duration-200",
          !active ? "hover:border-primary/50" : "",
        ].join(" ")}
      >
        <span className="text-sm font-bold">{day}</span>
      </div>
    </label>
  );
}

/** Working-window time-slot row */
function TimeSlotRow({
  slot,
  onChangeStart,
  onChangeEnd,
  onDelete,
}: {
  slot: TimeSlot;
  onChangeStart: (v: string) => void;
  onChangeEnd: (v: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/30 transition-all">
      <div className="flex items-center gap-2 flex-1">
        {/* Start */}
        <div className="relative w-full">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase tracking-wider">
            Start
          </label>
          <div className="relative">
            <input
              type="time"
              value={slot.start}
              onChange={(e) => onChangeStart(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg py-2.5 px-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
            <Clock className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Arrow */}
        <span className="text-slate-300 dark:text-slate-600 pt-5">
          <ArrowRight className="w-5 h-5" />
        </span>

        {/* End */}
        <div className="relative w-full">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase tracking-wider">
            End
          </label>
          <div className="relative">
            <input
              type="time"
              value={slot.end}
              onChange={(e) => onChangeEnd(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg py-2.5 px-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
            <Clock className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Delete */}
      <div className="flex items-center pt-0 sm:pt-6">
        <button
          onClick={onDelete}
          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Delete slot"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/** Session type card with toggle */
function SessionTypeCard({
  session,
  onToggle,
}: {
  session: SessionType;
  onToggle: () => void;
}) {
  const isEnabled = session.enabled;

  return (
    <div
      className={[
        "p-4 rounded-xl border relative transition-all",
        isEnabled
          ? "border-primary bg-primary/5"
          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-75 hover:opacity-100",
        !isEnabled ? "hover:shadow-md" : "",
      ].join(" ")}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-slate-900 dark:text-white">
          {session.name}
        </h4>
        <div
          className={[
            "text-xs font-bold px-2 py-1 rounded",
            isEnabled
              ? "bg-primary/20 text-primary"
              : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
          ].join(" ")}
        >
          {session.duration}
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        {session.description}
      </p>

      {/* Toggle switch */}
      <div className="flex items-center gap-2">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={onToggle}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary" />
          <span className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            {isEnabled ? "Enabled" : "Disabled"}
          </span>
        </label>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

export default function AvailabilityPage() {
  /* ── State ───────────────────────────────────────────────────── */
  const [timezone, setTimezone] = useState("PST");
  const [activeDays, setActiveDays] = useState<Set<string>>(
    () => new Set(defaultActiveDays)
  );
  const [slots, setSlots] = useState<TimeSlot[]>(defaultSlots);
  const [sessionTypes, setSessionTypes] =
    useState<SessionType[]>(defaultSessionTypes);
  const [buffer, setBuffer] = useState(15);

  /* ── Handlers ────────────────────────────────────────────────── */
  const toggleDay = (day: string) => {
    setActiveDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const updateSlot = (id: number, field: "start" | "end", value: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const deleteSlot = (id: number) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const addSlot = () => {
    setSlots((prev) => [
      ...prev,
      { id: Date.now(), start: "09:00", end: "10:00" },
    ]);
  };

  const toggleSessionType = (id: number) => {
    setSessionTypes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const resetAll = () => {
    setTimezone("PST");
    setActiveDays(new Set(defaultActiveDays));
    setSlots(defaultSlots);
    setSessionTypes(defaultSessionTypes);
    setBuffer(15);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <main className="flex-grow container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-6xl">
        {/* ─── Header ───────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-slate-900 dark:text-white text-2xl md:text-3xl font-black leading-tight tracking-tight">
              Availability Orchestrator
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal">
              Manage your weekly recurring schedule and session preferences.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
            <button className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        </div>

        {/* ─── 12-col Grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── LEFT COL (8) ─────────────────────────────────────── */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* ── Timezone & Active Days ─────────────────────────── */}
            <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
                <Globe className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold">
                  Timezone &amp; Active Days
                </h3>
              </div>

              <div className="flex flex-col gap-6">
                {/* Timezone select */}
                <label className="flex flex-col w-full">
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold mb-2">
                    My Timezone
                  </span>
                  <div className="relative">
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="appearance-none w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    >
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </label>

                {/* Day toggles */}
                <div>
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold mb-3 block">
                    Weekly Routine
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {allDays.map((day) => (
                      <DayToggle
                        key={day}
                        day={day}
                        active={activeDays.has(day)}
                        onChange={() => toggleDay(day)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Working Windows ────────────────────────────────── */}
            <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold">Working Windows</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                  <Clock className="w-[18px] h-[18px]" />
                  <span>
                    Viewing:{" "}
                    <strong className="text-slate-900 dark:text-white">
                      Mondays
                    </strong>
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {slots.map((slot) => (
                  <TimeSlotRow
                    key={slot.id}
                    slot={slot}
                    onChangeStart={(v) => updateSlot(slot.id, "start", v)}
                    onChangeEnd={(v) => updateSlot(slot.id, "end", v)}
                    onDelete={() => deleteSlot(slot.id)}
                  />
                ))}

                {/* Add button */}
                <button
                  onClick={addSlot}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group"
                >
                  <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Add Working Window
                </button>
              </div>
            </section>
          </div>

          {/* ── RIGHT COL (4) ────────────────────────────────────── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 h-full">
              <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold">Session Configuration</h3>
              </div>

              {/* Session type cards */}
              <div className="space-y-4 mb-8">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Available Session Types
                </label>
                {sessionTypes.map((s) => (
                  <SessionTypeCard
                    key={s.id}
                    session={s}
                    onToggle={() => toggleSessionType(s.id)}
                  />
                ))}
              </div>

              {/* Buffer slider */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <label className="flex justify-between items-center mb-4">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Buffer Time
                  </span>
                  <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                    {buffer} min
                  </span>
                </label>

                <div className="relative w-full h-6 flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={60}
                    step={5}
                    value={buffer}
                    onChange={(e) => setBuffer(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Break time automatically scheduled between consecutive
                  sessions.
                </p>
              </div>

              {/* Primary Region */}
              <div className="mt-8">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">
                  Primary Region
                </label>
                <div className="h-32 w-full rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden group cursor-pointer border border-slate-200 dark:border-slate-700">
                  {/* placeholder map bg */}
                  <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-primary/40" />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold shadow-sm">
                    San Francisco, CA
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ─── Footer note ──────────────────────────────────────── */}
        <div className="mt-8 flex justify-end">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Last saved: Today at 10:42 AM
          </p>
        </div>
      </main>
    </div>
  );
}
