"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Code,
  Calculator,
  FlaskConical,
  BookMarked,
  BookOpen,
  Microscope,
  TrendingUp,
  Palette,
  Coins,
  ShieldCheck,
  CloudUpload,
  ArrowRight,
  ArrowLeft,
  Check,
  Star,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types & Data                                                        */
/* ------------------------------------------------------------------ */
interface ExpertiseItem {
  icon: LucideIcon;
  label: string;
}

const expertiseOptions: ExpertiseItem[] = [
  { icon: Code, label: "React" },
  { icon: Calculator, label: "Calculus" },
  { icon: FlaskConical, label: "Physics" },
  { icon: BookMarked, label: "History" },
  { icon: BookOpen, label: "Literature" },
  { icon: Microscope, label: "Biology" },
  { icon: TrendingUp, label: "Economics" },
  { icon: Palette, label: "Art History" },
];

const STEPS = ["Profile", "Expertise", "Availability", "Review"];

/* ------------------------------------------------------------------ */
/* Section card                                                        */
/* ------------------------------------------------------------------ */
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Custom checkbox                                                     */
/* ------------------------------------------------------------------ */
function Checkbox({
  checked,
  onChange,
  children,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <label className="relative flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onChange}
        className={`
          flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors mt-0.5
          ${
            checked
              ? "bg-primary border-primary"
              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
          }
        `}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </button>
      <div>
        <span className="block text-sm font-medium text-slate-900 dark:text-white">
          {children}
        </span>
        {description && (
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            {description}
          </span>
        )}
      </div>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Stepper                                                             */
/* ------------------------------------------------------------------ */
function Stepper({ currentStep }: { currentStep: number }) {
  const progressWidth =
    currentStep === 0
      ? "w-0"
      : currentStep === 1
      ? "w-1/3"
      : currentStep === 2
      ? "w-2/3"
      : "w-full";

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400">
        {/* Background track */}
        <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full -translate-y-1/2 bg-slate-200 dark:bg-slate-700" />
        {/* Progress fill */}
        <div
          className={`absolute left-0 top-1/2 -z-10 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500 ${progressWidth}`}
        />

        {STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;

          return (
            <div key={step} className="flex flex-col items-center gap-2">
              <div
                className={`
                  flex size-8 items-center justify-center rounded-full text-sm font-bold
                  ring-4 ring-white dark:ring-slate-950 transition-colors
                  ${
                    done || active
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }
                `}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`hidden sm:block text-xs ${
                  active
                    ? "font-bold text-slate-900 dark:text-white"
                    : done
                    ? "font-bold text-primary"
                    : ""
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live Preview Card                                                   */
/* ------------------------------------------------------------------ */
function LivePreview({
  selected,
  coinRate,
}: {
  selected: string[];
  coinRate: number;
}) {
  return (
    <div className="lg:sticky lg:top-24">
      {/* Pulsing dot + label */}
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Live Marketplace Preview
        </h4>
      </div>

      {/* Preview card */}
      <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800 p-6 shadow-xl">
        {/* Decorative blob */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/90 dark:from-slate-900/90 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="size-24 rounded-full border-4 border-white dark:border-slate-800 shadow-md overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
              AM
            </div>
            <div className="absolute bottom-0 right-0 bg-green-500 size-6 border-4 border-white dark:border-slate-800 rounded-full" />
          </div>

          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            Alex Mentor
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            4.9 (120 reviews)
          </p>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {selected.length > 0 ? (
              selected.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                Select expertise above
              </span>
            )}
          </div>

          <div className="w-full border-t border-slate-100 dark:border-slate-700 my-4" />

          {/* Stats row */}
          <div className="flex items-center justify-between w-full mb-6">
            <div className="text-left">
              <p className="text-xs text-slate-400 font-semibold uppercase">
                Rate
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {coinRate}{" "}
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

          <button
            className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-lg pointer-events-none opacity-90"
            tabIndex={-1}
          >
            Book Session
          </button>
        </div>
      </div>

      {/* Pro tip */}
      <div className="mt-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800/50 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
          <span className="font-bold">Pro Tip:</span> Mentors with verification
          badges get 3x more bookings. Make sure to upload your credentials!
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function MentorshipSetupPage() {
  const [currentStep, setCurrentStep] = useState(1); // Start on Expertise step

  /* Expertise state */
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([
    "React",
    "Physics",
  ]);

  /* Pricing state */
  const [coinRate, setCoinRate] = useState(50);
  const [oneOnOne, setOneOnOne] = useState(true);
  const [groupStudy, setGroupStudy] = useState(false);

  /* Credentials state */
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Handlers ── */
  const toggleExpertise = (label: string) => {
    setSelectedExpertise((prev) =>
      prev.includes(label)
        ? prev.filter((e) => e !== label)
        : prev.length < 5
        ? [...prev, label]
        : prev
    );
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const names = Array.from(files).map((f) => f.name);
    setUploadedFiles((prev) => [...prev, ...names]);
  };

  const removeFile = (name: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f !== name));
  };

  const sliderPercent = ((coinRate - 10) / (200 - 10)) * 100;

  return (
    <div className="relative pb-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ══════════════════════════════════════════════════════ */}
          {/* Left Column: Configuration Form (8/12)                */}
          {/* ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* ── Header & Stepper ── */}
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Mentorship Configuration
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg mt-2">
                  Shape your profile to guide the next generation of scholars.
                </p>
              </div>
              <Stepper currentStep={currentStep} />
            </div>

            {/* ── Section: Subject Expertise ── */}
            <SectionCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Subject Expertise
                </h3>
                <span className="text-sm text-slate-400 dark:text-slate-500">
                  Select up to 5
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {expertiseOptions.map(({ icon: Icon, label }) => {
                  const isSelected = selectedExpertise.includes(label);
                  return (
                    <button
                      key={label}
                      onClick={() => toggleExpertise(label)}
                      className={`
                        flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2
                        text-sm font-medium transition-all duration-300
                        ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(140,48,232,0.15)] scale-[1.03]"
                            : "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary/50"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* ── Section: Pricing & Sessions ── */}
            <SectionCard>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                Pricing &amp; Sessions
              </h3>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Coin rate slider */}
                <div className="flex flex-col gap-4">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Hourly Coin Rate
                  </label>

                  <div className="relative pt-8 pb-2">
                    {/* Coin rate bubble */}
                    <div
                      className="absolute -top-1 bg-primary text-white text-xs font-bold py-1 px-2 rounded shadow-lg transition-all duration-150"
                      style={{
                        left: `${sliderPercent}%`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      {coinRate} Coins
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary" />
                    </div>

                    <input
                      type="range"
                      min={10}
                      max={200}
                      value={coinRate}
                      onChange={(e) => setCoinRate(Number(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
                      <span>10 Coins</span>
                      <span>200 Coins</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Suggested range for beginners: 30–60 Coins/hr
                  </p>
                </div>

                {/* Session types */}
                <div className="flex flex-col gap-4">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Session Types
                  </label>

                  <div className="flex flex-col gap-3">
                    <Checkbox
                      checked={oneOnOne}
                      onChange={() => setOneOnOne(!oneOnOne)}
                      description="Personalized guidance via video call."
                    >
                      1-on-1 Mentorship
                    </Checkbox>

                    <Checkbox
                      checked={groupStudy}
                      onChange={() => setGroupStudy(!groupStudy)}
                      description="Host small group workshops."
                    >
                      Group Study (Max 5)
                    </Checkbox>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── Section: Credentials & Proof ── */}
            <SectionCard>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Credentials &amp; Proof
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Upload certificates, degrees, or transcripts to verify your
                expertise.
              </p>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="mb-3 p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <CloudUpload className="w-7 h-7" />
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
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </div>

              {/* Uploaded files list */}
              <AnimatePresence>
                {uploadedFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-2 overflow-hidden"
                  >
                    {uploadedFiles.map((name) => (
                      <div
                        key={name}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      >
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {name}
                        </span>
                        <button
                          onClick={() => removeFile(name)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </SectionCard>

            {/* ── Navigation Buttons ── */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep((s) => Math.min(3, s + 1))}
                className="px-8 py-2.5 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:brightness-110 transition-all transform active:scale-95 flex items-center gap-2"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════ */}
          {/* Right Column: Live Preview (4/12)                     */}
          {/* ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4">
            <LivePreview
              selected={selectedExpertise}
              coinRate={coinRate}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
