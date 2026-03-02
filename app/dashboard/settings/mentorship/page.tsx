"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Check,
  Code,
  Sigma,
  FlaskConical,
  BookOpen,
  Library,
  Dna,
  TrendingUp,
  Palette,
  UploadCloud,
  Hourglass,
  Star,
  ArrowRight,
  ArrowLeft,
  Info,
  Brain,
  DollarSign,
  ShieldCheck,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
const STEPS = ["Profile", "Expertise", "Availability", "Review"];

const subjects = [
  { id: "react", label: "React", icon: Code },
  { id: "calculus", label: "Calculus", icon: Sigma },
  { id: "physics", label: "Physics", icon: FlaskConical },
  { id: "history", label: "History", icon: BookOpen },
  { id: "literature", label: "Literature", icon: Library },
  { id: "biology", label: "Biology", icon: Dna },
  { id: "economics", label: "Economics", icon: TrendingUp },
  { id: "art", label: "Art History", icon: Palette },
];

/* ------------------------------------------------------------------ */
/* Page Component                                                      */
/* ------------------------------------------------------------------ */
export default function MentorshipSetupPage() {
  const { data: session, status } = useSession();
  const [rate, setRate] = useState<number | string>(50);
  const [oneOnOne, setOneOnOne] = useState(true);
  const [groupStudy, setGroupStudy] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    "react",
    "physics",
  ]);
  const [submitted, setSubmitted] = useState(false);

  /* visual-only stepper position */
  const currentStep = 3;
  const totalSteps = STEPS.length;

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev,
    );
  };

  /* Derive selected labels for the preview card */
  const selectedLabels = subjects
    .filter((s) => selectedSubjects.includes(s.id))
    .map((s) => s.label);

  const fullName = session?.user?.name || "User";
  const userImage = session?.user?.image || "";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  /*  Step 4: Under Review  */
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl flex flex-col items-center text-center mx-auto mt-10 md:mt-20"
      >
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-primary/20 dark:bg-primary/30 rounded-full blur-xl transform scale-150 animate-pulse" />
          <div className="relative w-32 h-32 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-full flex items-center justify-center shadow-lg">
            <motion.div
              animate={{ rotate: 180 }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
                repeatDelay: 1,
              }}
            >
              <Hourglass className="text-primary w-16 h-16" />
            </motion.div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight tracking-tight">
          Your Wisdom is{" "}
          <br className="hidden sm:block" />
          <span className="text-primary">Under Review</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-lg mb-8">
          Our Elder Mentors are evaluating your scrolls. Expect a response
          within 48 hours.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm mb-12 shadow-[0_0_15px_rgba(140,48,232,0.15)]">
          <Star size={16} className="fill-primary" />
          <span>+100 XP Applicant Bonus</span>
        </div>

        <Link
          href="/dashboard"
          className="px-8 py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all flex items-center gap-2 transform hover:-translate-y-1"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
      </motion.div>
    );
  }

  /*  Main Form Layout  */
  return (
    <div className="py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/*  */}
        {/* Left Column: Configuration Form (8 / 12)               */}
        {/*  */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Header & Progress */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                Mentorship Configuration
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                Shape your profile to guide the next generation of scholars.
              </p>
            </div>

            {/* Stepper */}
            <div className="w-full">
              <div className="relative flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400">
                {/* Track bg */}
                <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full -translate-y-1/2 bg-slate-200 dark:bg-slate-700" />
                {/* Track progress */}
                <motion.div
                  className="absolute left-0 top-1/2 -z-10 h-0.5 -translate-y-1/2 bg-primary"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />

                {STEPS.map((label, i) => {
                  const stepNum = i + 1;
                  const isCompleted = stepNum < currentStep;
                  const isActive = stepNum === currentStep;
                  const isUpcoming = stepNum > currentStep;

                  return (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ring-4 ring-white dark:ring-[#191121] transition-colors duration-300
                          ${isCompleted ? "bg-primary text-white shadow-lg" : ""}
                          ${isActive ? "bg-primary text-white shadow-lg shadow-primary/30" : ""}
                          ${isUpcoming ? "bg-slate-200 dark:bg-slate-700 text-slate-500" : ""}
                        `}
                      >
                        {isCompleted ? <Check size={18} /> : stepNum}
                      </div>
                      <span
                        className={`hidden sm:block text-xs font-bold
                          ${isCompleted ? "text-primary" : ""}
                          ${isActive ? "text-slate-900 dark:text-white" : ""}
                          ${isUpcoming ? "text-slate-500 font-medium" : ""}
                        `}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/*  Section: Subject Expertise  */}
          <div className="rounded-2xl bg-white dark:bg-[#231a2e] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="text-primary" size={20} />
                Subject Expertise
              </h3>
              <span className="text-sm text-slate-400">Select up to 5</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {subjects.map((sub) => {
                const isSelected = selectedSubjects.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    onClick={() => toggleSubject(sub.id)}
                    className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 transition-all duration-300
                      ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(140,48,232,0.25)] scale-105"
                          : "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary/50"
                      }
                    `}
                  >
                    <sub.icon size={20} />
                    <span className="font-medium">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/*  Section: Pricing & Sessions  */}
          <div className="rounded-2xl bg-white dark:bg-[#231a2e] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <DollarSign className="text-primary" size={20} />
              Pricing & Sessions
            </h3>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Hourly Coin Rate slider */}
              <div className="flex flex-col gap-4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Hourly Coin Rate
                </label>
                <div className="relative pt-6 pb-2">
                  <div
                    className="absolute -top-1 transform -translate-x-1/2 bg-primary text-white text-xs font-bold py-1 px-2 rounded shadow-lg"
                    style={{
                      left: `${((Number(rate) - 10) / (200 - 10)) * 100}%`,
                    }}
                  >
                    {rate} Coins
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary" />
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="mentor-slider w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
                    <span>10 Coins</span>
                    <span>200 Coins</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Suggested range for beginners: 30-60 Coins/hr
                </p>
              </div>

              {/* Session Types */}
              <div className="flex flex-col gap-4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Session Types
                </label>
                <div className="flex flex-col gap-3">
                  {/* 1-on-1 Mentorship */}
                  <label className="relative flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <div
                      onClick={() => setOneOnOne(!oneOnOne)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors mt-0.5
                        ${oneOnOne ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"}
                      `}
                    >
                      {oneOnOne && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-slate-900 dark:text-white">
                        1-on-1 Mentorship
                      </span>
                      <span className="block text-xs text-slate-500">
                        Personalized guidance via video call.
                      </span>
                    </div>
                  </label>

                  {/* Group Study */}
                  <label className="relative flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <div
                      onClick={() => setGroupStudy(!groupStudy)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors mt-0.5
                        ${groupStudy ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"}
                      `}
                    >
                      {groupStudy && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-slate-900 dark:text-white">
                        Group Study (Max 5)
                      </span>
                      <span className="block text-xs text-slate-500">
                        Host small group workshops.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/*  Section: Credentials & Proof  */}
          <div className="rounded-2xl bg-white dark:bg-[#231a2e] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="text-primary" size={20} />
              Credentials & Proof
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Upload certificates, degrees, or transcripts to verify your
              expertise.
            </p>

            <div className="group relative flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer animate-pulse-border">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="mb-3 p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <UploadCloud size={28} />
                </div>
                <p className="mb-1 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Click to upload</span> or
                  drag and drop
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PDF, JPG or PNG (MAX. 5MB)
                </p>
              </div>
              <input
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                type="file"
              />
            </div>
          </div>

          {/*  Section: Availability  */}
          <div className="rounded-2xl bg-white dark:bg-[#231a2e] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="text-primary" size={20} />
                Availability Schedule
              </h3>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Set the days and hours you&apos;re available for mentorship sessions.
            </p>

            {/* Quick summary + link */}
            <div className="flex flex-col gap-4">
              {/* Day pills preview */}
              <div className="flex flex-wrap gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                  <span
                    key={day}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30"
                  >
                    {day}
                  </span>
                ))}
                {["Sat", "Sun"].map((day) => (
                  <span
                    key={day}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 text-sm font-bold"
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Time slots preview */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <Clock size={16} className="text-primary" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">09:00 – 12:00</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <Clock size={16} className="text-primary" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">13:30 – 17:00</span>
                </div>
              </div>

              {/* Link to full availability page */}
              <Link
                href="/dashboard/sessions/availability"
                className="inline-flex items-center gap-2 mt-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors group"
              >
                Configure full availability
                <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/*  Navigation Buttons  */}
          <div className="flex items-center justify-between pt-4">
            <Link
              href="/dashboard/settings"
              className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Back
            </Link>
            <button
              onClick={() => setSubmitted(true)}
              className="px-8 py-2.5 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all transform active:scale-95 flex items-center gap-2"
            >
              Next Step
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/*  */}
        {/* Right Column: Live Marketplace Preview (4 / 12)        */}
        {/*  */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Live Marketplace Preview
            </h4>
          </div>

          {/* Preview Card */}
          <div className="bg-white/70 dark:bg-[#231a2e]/70 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/90 to-transparent dark:from-[#231a2e] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="size-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-md">
                  {userImage ? (
                    <img src={userImage} alt={fullName} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-green-500 size-6 border-4 border-white rounded-full" />
              </div>

              <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {status === "loading" ? "Loading..." : fullName}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1">
                <Star
                  size={16}
                  className="fill-yellow-500 text-yellow-500"
                />
                4.9 (120 reviews)
              </p>

              <div className="flex flex-wrap justify-center gap-2 mb-6 min-h-[30px]">
                {selectedLabels.map((label, i) => (
                  <span
                    key={label}
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      i === 0
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                    }`}
                  >
                    {label}
                  </span>
                ))}
                {selectedLabels.length === 0 && (
                  <span className="text-xs text-slate-400">
                    No subjects selected
                  </span>
                )}
              </div>

              <div className="w-full border-t border-slate-100 dark:border-slate-700 my-4" />

              <div className="flex items-center justify-between w-full mb-6">
                <div className="text-left">
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    Rate
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {rate}{" "}
                    <span className="text-sm font-normal text-slate-500">
                      Coins/hr
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    Response
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    ~1 hr
                  </p>
                </div>
              </div>

              <button className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 pointer-events-none opacity-90">
                Book Session
              </button>
            </div>
          </div>

          {/* Helper Tip */}
          <div className="mt-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800/50 flex gap-3">
            <Info
              className="text-blue-600 dark:text-blue-400 shrink-0"
              size={18}
            />
            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
              <span className="font-bold">Pro Tip:</span> Mentors with
              verification badges get 3x more bookings. Make sure to upload
              your credentials!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
