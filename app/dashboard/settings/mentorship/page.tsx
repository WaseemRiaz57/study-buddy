"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  DollarSign,
  Loader2,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";

const SUBJECT_OPTIONS = [
  "React",
  "Calculus",
  "Physics",
  "History",
  "Literature",
  "Biology",
  "Economics",
  "Art History",
  "Design",
  "Career Prep",
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type AvailabilityDay = {
  day: string;
  slots: string[];
  timeSlots?: string[];
};

type ProfileResponse = {
  role?: string;
  user?: {
    name?: string;
    image?: string;
  };
  mentorProfile?: {
    headline?: string;
    subjects?: string[];
    hourlyRate?: number;
    availability?: AvailabilityDay[];
    status?: "pending" | "approved" | "suspended";
    isPublic?: boolean;
  };
  profile?: {
    headline?: string;
    subjects?: string[];
    hourlyRate?: number;
    availability?: AvailabilityDay[];
    status?: "pending" | "approved" | "suspended";
    isPublic?: boolean;
  };
};

function formatHour(hour24: number) {
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 < 12 ? "AM" : "PM";
  return `${String(hour).padStart(2, "0")}:00 ${suffix}`;
}

function buildHourlySlots() {
  return Array.from({ length: 14 }, (_, index) => {
    const start = index + 7;
    return `${formatHour(start)} - ${formatHour(start + 1)}`;
  });
}

function normalizeAvailability(availability?: AvailabilityDay[]) {
  return DAYS.map((day) => {
    const match = availability?.find((item) => item.day === day);
    const slots = match?.slots?.length ? match.slots : match?.timeSlots ?? [];
    return {
      day,
      slots: [...new Set(slots)].sort(),
    };
  });
}

export default function MentorshipSetupPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"pending" | "approved" | "suspended">(
    "pending"
  );
  const [hourlyRate, setHourlyRate] = useState(50);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [availability, setAvailability] = useState<AvailabilityDay[]>(
    normalizeAvailability()
  );
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [selectedSlot, setSelectedSlot] = useState("09:00 AM - 10:00 AM");

  const hourlySlots = useMemo(() => buildHourlySlots(), []);
  const fullName = session?.user?.name || "Mentor";
  const userImage = session?.user?.image || "";
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "M";
  const selectedDayAvailability =
    availability.find((item) => item.day === selectedDay) ??
    ({ day: selectedDay, slots: [] } satisfies AvailabilityDay);

  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/profile", { cache: "no-store" });
        const data = (await response.json().catch(() => null)) as ProfileResponse | null;

        if (!response.ok) {
          throw new Error(data && "message" in data ? String(data.message) : "Failed to load mentor profile.");
        }

        const profile = data?.mentorProfile ?? data?.profile;

        if (!active || !profile) return;

        setStatus(profile.status ?? "pending");
        setHourlyRate(Number(profile.hourlyRate ?? 50));
        setSelectedSubjects(profile.subjects ?? []);
        setAvailability(normalizeAvailability(profile.availability));
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load mentor profile."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void fetchProfile();

    return () => {
      active = false;
    };
  }, []);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject]
    );
  };

  const addSlot = () => {
    setAvailability((current) =>
      current.map((item) =>
        item.day === selectedDay && !item.slots.includes(selectedSlot)
          ? { ...item, slots: [...item.slots, selectedSlot].sort() }
          : item
      )
    );
  };

  const removeSlot = (day: string, slot: string) => {
    setAvailability((current) =>
      current.map((item) =>
        item.day === day
          ? { ...item, slots: item.slots.filter((existing) => existing !== slot) }
          : item
      )
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects: selectedSubjects,
          hourlyRate,
          availability: availability
            .filter((item) => item.slots.length > 0)
            .map((item) => ({
              day: item.day,
              slots: item.slots,
            })),
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save mentorship details.");
      }

      const profile = data?.profile?.mentorProfile ?? data?.profile?.profile;
      if (profile?.status) {
        setStatus(profile.status);
      }

      toast.success("Mentorship details saved!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save mentorship details."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="py-8 md:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="space-y-8 lg:col-span-8" aria-labelledby="mentor-setup-heading">
          <header className="space-y-3">
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-[#7C3AED] dark:text-slate-300"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Settings
            </Link>
            <h1
              id="mentor-setup-heading"
              className="text-4xl font-black tracking-tight text-slate-900 dark:text-white"
            >
              Mentorship Setup
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Configure the marketplace details students use to book your sessions.
            </p>
          </header>

          {status === "pending" && (
            <section
              className="rounded-2xl border border-purple-200 bg-purple-50 p-5 text-purple-900 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-100"
              aria-label="Mentor profile review status"
            >
              <p className="font-bold">
                Your mentor profile is currently under review by an Admin. You
                will appear in the marketplace once approved.
              </p>
            </section>
          )}

          {status === "suspended" && (
            <section
              className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
              aria-label="Mentor profile suspended status"
            >
              <p className="font-bold">
                Your mentor profile is currently suspended. Contact support for review.
              </p>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
                <DollarSign size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Basic Details
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Set your rate and expertise areas.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Hourly Rate
                </span>
                <input
                  type="number"
                  min={0}
                  value={hourlyRate}
                  onChange={(event) => setHourlyRate(Number(event.target.value))}
                  aria-label="Hourly rate"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-colors focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                Subject Expertise
              </p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {SUBJECT_OPTIONS.map((subject) => {
                  const selected = selectedSubjects.includes(subject);
                  return (
                    <button
                      key={subject}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${selected ? "Remove" : "Add"} ${subject} expertise`}
                      onClick={() => toggleSubject(subject)}
                      className={`flex h-12 items-center justify-center gap-2 rounded-xl border-2 px-3 text-sm font-bold transition-colors ${
                        selected
                          ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#7C3AED] dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                      }`}
                    >
                      {selected && <Check size={16} aria-hidden="true" />}
                      {subject}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
                <Calendar size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Configure Availability
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Add strictly 1-hour blocks for each day.
                </p>
              </div>
            </div>

            <div className="flex min-h-[52px] flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  aria-label={`Select ${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                    selectedDay === day
                      ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#7C3AED] dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Add 1-hour slot for {selectedDay}
                </span>
                <select
                  value={selectedSlot}
                  aria-label={`Select 1-hour availability slot for ${selectedDay}`}
                  onChange={(event) => setSelectedSlot(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-colors focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                >
                  {hourlySlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                aria-label={`Add ${selectedSlot} to ${selectedDay}`}
                onClick={addSlot}
                className="h-12 self-end rounded-xl bg-[#7C3AED] px-6 text-sm font-bold text-white transition-colors hover:bg-purple-700"
              >
                Add Slot
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {availability.map((item) => (
                <div
                  key={item.day}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-[#7C3AED]" aria-hidden="true" />
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {item.day}
                    </h3>
                  </div>
                  <div className="flex min-h-[44px] flex-wrap gap-2">
                    {item.slots.length > 0 ? (
                      item.slots.map((slot) => (
                        <span
                          key={`${item.day}-${slot}`}
                          className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-3 py-2 text-xs font-bold text-white"
                        >
                          {slot}
                          <button
                            type="button"
                            aria-label={`Remove ${slot} from ${item.day}`}
                            onClick={() => removeSlot(item.day, slot)}
                            className="rounded-full p-0.5 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60"
                          >
                            <X size={13} aria-hidden="true" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex h-9 items-center text-sm text-slate-400">
                        No slots added
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-between gap-3">
            <Link
              href="/dashboard/settings"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Back
            </Link>
            <button
              type="button"
              aria-label="Save mentorship details"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Save size={16} aria-hidden="true" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>

        <aside className="lg:col-span-4 lg:sticky lg:top-24">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Marketplace Preview
              </h2>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] text-2xl font-bold text-white">
                {userImage ? (
                  <Image
                    src={userImage}
                    alt={`${fullName} profile picture`}
                    width={96}
                    height={96}
                    priority
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {fullName}
              </h3>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs font-bold text-[#7C3AED]">
                <ShieldCheck size={14} aria-hidden="true" />
                {status}
              </p>

              <div className="mt-5 flex min-h-[36px] flex-wrap justify-center gap-2">
                {selectedSubjects.length > 0 ? (
                  selectedSubjects.slice(0, 5).map((subject) => (
                    <span
                      key={subject}
                      className="rounded-full bg-[#7C3AED] px-3 py-1 text-xs font-bold text-white"
                    >
                      {subject}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">No subjects selected</span>
                )}
              </div>

              <div className="my-5 h-px w-full bg-slate-200 dark:bg-white/10" />

              <div className="flex w-full items-center justify-between text-left">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Rate</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    {hourlyRate} Coins/hr
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-slate-400">Slots</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    {availability.reduce((total, day) => total + day.slots.length, 0)}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
