"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Award,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Plus,
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

const STEPS = [
  "Expertise & Credentials",
  "Pricing & Availability",
  "Final Review",
];

type MentorStatus = "pending" | "approved" | "suspended";

type AvailabilityDay = {
  day: string;
  slots: string[];
  timeSlots?: string[];
};

type MentorProfilePayload = {
  _id?: string;
  headline?: string;
  bio?: string;
  subjects?: string[];
  hourlyRate?: number;
  certificates?: string[];
  availability?: AvailabilityDay[];
  status?: MentorStatus;
  isPublic?: boolean;
};

type ProfileResponse = {
  role?: string;
  user?: {
    name?: string;
    image?: string;
  };
  mentorProfile?: MentorProfilePayload | null;
  profile?: MentorProfilePayload | null;
  message?: string;
};

function formatHour(hour24: number) {
  const normalizedHour = ((hour24 % 24) + 24) % 24;
  const hour = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
  const suffix = normalizedHour < 12 ? "AM" : "PM";
  return `${String(hour).padStart(2, "0")}:00 ${suffix}`;
}

function buildHourlySlots() {
  return Array.from({ length: 24 }, (_, hour) => {
    return `${formatHour(hour)} - ${formatHour(hour + 1)}`;
  });
}

function normalizeAvailability(availability?: AvailabilityDay[]) {
  return DAYS.map((day) => {
    const match = availability?.find((item) => item.day === day);
    const slots = match?.slots?.length ? match.slots : match?.timeSlots ?? [];
    return {
      day,
      slots: [...new Set(slots)].filter(Boolean),
    };
  });
}

function getSlotStart(slot: string) {
  const match = slot.match(/^(\d{1,2}):00\s*(AM|PM)/i);
  if (!match) return 0;

  const hour = Number(match[1]);
  const meridiem = match[2].toUpperCase();

  if (meridiem === "AM") return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

function sortSlots(slots: string[]) {
  return [...slots].sort((first, second) => getSlotStart(first) - getSlotStart(second));
}

function compactAvailability(availability: AvailabilityDay[]) {
  return availability
    .filter((item) => item.slots.length > 0)
    .map((item) => ({
      day: item.day,
      slots: sortSlots(item.slots),
    }));
}

export default function MentorshipSetupPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<MentorStatus>("pending");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<string[]>([]);
  const [certificateDraft, setCertificateDraft] = useState("");
  const [hourlyRate, setHourlyRate] = useState(50);
  const [availability, setAvailability] = useState<AvailabilityDay[]>(
    normalizeAvailability()
  );
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [selectedSlot, setSelectedSlot] = useState("09:00 AM - 10:00 AM");

  const hourlySlots = useMemo(() => buildHourlySlots(), []);
  const totalSlots = availability.reduce((total, day) => total + day.slots.length, 0);
  const selectedDayAvailability =
    availability.find((item) => item.day === selectedDay) ??
    ({ day: selectedDay, slots: [] } satisfies AvailabilityDay);
  const showUnderReview =
    (submitted || (hasExistingProfile && status === "pending")) && !isEditing;
  const fullName = session?.user?.name || "Mentor";
  const userImage = session?.user?.image || "";
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "M";

  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/profile", { cache: "no-store" });
        const data = (await response.json().catch(() => null)) as ProfileResponse | null;

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load mentor profile.");
        }

        const profile = data?.mentorProfile ?? data?.profile;

        if (!active) return;

        setRole(data?.role ?? "");
        setHasExistingProfile(Boolean(profile?._id));
        setStatus(profile?.status ?? "pending");
        setHeadline(profile?.headline ?? "");
        setBio(profile?.bio ?? "");
        setHourlyRate(Number(profile?.hourlyRate ?? 50));
        setSelectedSubjects(profile?.subjects ?? []);
        setCertificates(profile?.certificates ?? []);
        setAvailability(normalizeAvailability(profile?.availability));
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

  const addCertificate = () => {
    const nextCertificate = certificateDraft.trim();

    if (!nextCertificate) {
      toast.error("Add a certificate URL before continuing.");
      return;
    }

    if (certificates.includes(nextCertificate)) {
      toast.error("This certificate is already added.");
      return;
    }

    setCertificates((current) => [...current, nextCertificate]);
    setCertificateDraft("");
  };

  const removeCertificate = (certificate: string) => {
    setCertificates((current) => current.filter((item) => item !== certificate));
  };

  const addSlot = () => {
    const currentSlots = selectedDayAvailability.slots;

    if (currentSlots.includes(selectedSlot)) {
      toast.error("This slot is already added for the selected day.");
      return;
    }

    if (currentSlots.length >= 24) {
      toast.error("A day can include up to 24 hourly slots.");
      return;
    }

    setAvailability((current) =>
      current.map((item) =>
        item.day === selectedDay
          ? { ...item, slots: sortSlots([...item.slots, selectedSlot]) }
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

  const goToPricing = () => {
    if (certificates.length === 0) {
      toast.error("Please add at least one certificate before continuing.");
      return;
    }

    setStep(2);
  };

  const handleSubmitApplication = async () => {
    if (certificates.length === 0) {
      toast.error("Please add at least one certificate before submitting.");
      setStep(1);
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          bio,
          subjects: selectedSubjects,
          certificates,
          hourlyRate,
          availability: compactAvailability(availability),
          submitForReview: true,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to submit mentor application.");
      }

      setStatus("pending");
      setHasExistingProfile(true);
      setIsEditing(false);
      setSubmitted(true);
      toast.success("Mentor application submitted for review!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit mentor application."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="py-8 md:py-12" aria-busy="true">
        <section className="min-h-[560px] rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="h-6 w-40 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="mt-8 h-12 w-3/5 rounded-2xl bg-slate-200 dark:bg-white/10" />
          <div className="mt-4 h-4 w-2/5 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-28 rounded-2xl bg-slate-100 dark:bg-white/5"
              />
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (role && role !== "mentor") {
    return (
      <main className="py-8 md:py-12">
        <section className="min-h-[420px] rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED] text-white">
            <ShieldCheck size={24} aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-900 dark:text-white">
            Mentor access required
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
            This setup area is only available for accounts registered with the
            mentor role.
          </p>
        </section>
      </main>
    );
  }

  if (showUnderReview) {
    return (
      <main className="py-8 md:py-12">
        <section
          aria-labelledby="under-review-heading"
          className="flex min-h-[620px] items-center justify-center rounded-3xl border border-purple-200 bg-white p-8 text-center shadow-sm dark:border-purple-500/30 dark:bg-slate-900"
        >
          <div className="max-w-xl">
            <div className="mx-auto flex h-28 w-28 animate-pulse items-center justify-center rounded-full border-4 border-[#7C3AED] bg-[#7C3AED]/10 shadow-[0_0_50px_rgba(124,58,237,0.25)]">
              <ShieldCheck className="h-12 w-12 text-[#7C3AED]" aria-hidden="true" />
            </div>
            <h1
              id="under-review-heading"
              className="mt-8 text-4xl font-black tracking-tight text-slate-900 dark:text-white"
            >
              Your wisdom is under review.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
              Our admin team is verifying your certificates and mentorship
              details. Once approved, your profile will appear in the Mentor
              Marketplace for students to book.
            </p>
            <button
              type="button"
              aria-label="Edit mentor application"
              onClick={() => {
                setSubmitted(false);
                setIsEditing(true);
              }}
              className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[#7C3AED] px-5 py-3 text-sm font-bold text-[#7C3AED] transition-colors hover:bg-[#7C3AED] hover:text-white"
            >
              <FileText size={16} aria-hidden="true" />
              Edit Application
            </button>
            <Link
              href="/dashboard/settings"
              aria-label="Back to settings"
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED] dark:border-white/10 dark:text-slate-300"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Settings
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="py-8 md:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section
          className="space-y-8 lg:col-span-8"
          aria-labelledby="mentor-setup-heading"
        >
          <header className="space-y-4">
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-[#7C3AED] dark:text-slate-300"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Settings
            </Link>
            <div>
              <h1
                id="mentor-setup-heading"
                className="text-4xl font-black tracking-tight text-slate-900 dark:text-white"
              >
                Mentor Application
              </h1>
              <p className="mt-3 text-slate-500 dark:text-slate-400">
                Build the profile students will see after admin approval.
              </p>
            </div>
          </header>

          {status === "suspended" && (
            <section
              className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
              aria-label="Mentor profile suspended status"
            >
              <p className="font-bold">
                Your mentor profile is currently suspended. Contact support before
                submitting a new application.
              </p>
            </section>
          )}

          <section
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"
            aria-label="Mentor application progress"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {STEPS.map((label, index) => {
                const currentStep = index + 1;
                const active = step === currentStep;
                const complete = step > currentStep;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setStep(currentStep)}
                    aria-label={`Go to step ${currentStep}: ${label}`}
                    aria-current={active ? "step" : undefined}
                    className={`flex min-h-[72px] items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                      active || complete
                        ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#7C3AED] dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                        active || complete
                          ? "bg-white text-[#7C3AED]"
                          : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                      }`}
                    >
                      {complete ? <Check size={16} aria-hidden="true" /> : currentStep}
                    </span>
                    <span className="text-sm font-black">{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {step === 1 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C3AED] text-white">
                  <Award size={21} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Expertise & Credentials
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Add your teaching promise, subjects, and proof of expertise.
                  </p>
                </div>
              </div>

              <div className="grid gap-5">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Professional Headline
                  </span>
                  <input
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                    aria-label="Professional headline"
                    placeholder="Senior Product Designer & Mentor"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-colors focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    About Your Mentorship
                  </span>
                  <textarea
                    value={bio}
                    onChange={(event) => setBio(event.target.value.slice(0, 500))}
                    aria-label="About your mentorship"
                    rows={5}
                    maxLength={500}
                    placeholder="Tell students how you help them learn, prepare, and grow."
                    className="min-h-[132px] w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                  <span className="block text-right text-xs font-bold text-slate-400">
                    {bio.length}/500
                  </span>
                </label>

                <div>
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

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-4 flex items-start gap-3">
                    <FileText className="mt-1 text-[#7C3AED]" size={20} aria-hidden="true" />
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white">
                        Certificates
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Add at least one certificate, portfolio, or credential URL
                        for admin verification.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      value={certificateDraft}
                      onChange={(event) => setCertificateDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCertificate();
                        }
                      }}
                      aria-label="Certificate URL"
                      placeholder="https://example.com/certificate"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition-colors focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={addCertificate}
                      aria-label="Add certificate"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 text-sm font-bold text-white transition-colors hover:bg-purple-700"
                    >
                      <Plus size={16} aria-hidden="true" />
                      Add
                    </button>
                  </div>

                  <div className="mt-4 flex min-h-[44px] flex-wrap gap-2">
                    {certificates.length > 0 ? (
                      certificates.map((certificate) => (
                        <span
                          key={certificate}
                          className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#7C3AED] px-3 py-2 text-xs font-bold text-white"
                        >
                          <span className="truncate">{certificate}</span>
                          <button
                            type="button"
                            aria-label={`Remove certificate ${certificate}`}
                            onClick={() => removeCertificate(certificate)}
                            className="rounded-full p-0.5 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60"
                          >
                            <X size={13} aria-hidden="true" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex h-9 items-center text-sm text-slate-400">
                        No certificates added yet
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={goToPricing}
                  aria-label="Continue to pricing and availability"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700"
                >
                  Next
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C3AED] text-white">
                  <Calendar size={21} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Pricing & Availability
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Choose your rate and add multiple 1-hour slots per day.
                  </p>
                </div>
              </div>

              <label className="block max-w-sm space-y-2">
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

              <div className="mt-7">
                <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                  Configure Availability
                </p>
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

                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
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
                    className="inline-flex h-12 items-center justify-center gap-2 self-end rounded-xl bg-[#7C3AED] px-6 text-sm font-bold text-white transition-colors hover:bg-purple-700"
                  >
                    <Plus size={16} aria-hidden="true" />
                    Add Slot
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-[#7C3AED]" aria-hidden="true" />
                    <h3 className="font-black text-slate-900 dark:text-white">
                      {selectedDay} slots
                    </h3>
                    <span className="rounded-full bg-[#7C3AED]/10 px-2 py-1 text-xs font-black text-[#7C3AED]">
                      {selectedDayAvailability.slots.length}/24
                    </span>
                  </div>
                  <div className="grid min-h-[96px] gap-2 sm:grid-cols-2">
                    {selectedDayAvailability.slots.length > 0 ? (
                      selectedDayAvailability.slots.map((slot) => (
                        <span
                          key={`${selectedDay}-${slot}`}
                          className="inline-flex min-h-[40px] items-center justify-between gap-2 rounded-full bg-[#7C3AED] px-3 py-2 text-xs font-bold text-white"
                        >
                          {slot}
                          <button
                            type="button"
                            aria-label={`Remove ${slot} from ${selectedDay}`}
                            onClick={() => removeSlot(selectedDay, slot)}
                            className="rounded-full p-0.5 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60"
                          >
                            <X size={13} aria-hidden="true" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex h-10 items-center text-sm text-slate-400">
                        No slots added for this day
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  aria-label="Back to expertise and credentials"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED] dark:border-white/10 dark:text-slate-300"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  aria-label="Continue to final review"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700"
                >
                  Next
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C3AED] text-white">
                  <ShieldCheck size={21} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Final Review
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Confirm your application before sending it to admin review.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                  <h3 className="font-black text-slate-900 dark:text-white">
                    Profile
                  </h3>
                  <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                    {headline || "No headline added"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {bio || "No bio added yet."}
                  </p>
                  <div className="mt-4 flex min-h-[36px] flex-wrap gap-2">
                    {selectedSubjects.length > 0 ? (
                      selectedSubjects.map((subject) => (
                        <span
                          key={subject}
                          className="rounded-full bg-[#7C3AED] px-3 py-1 text-xs font-bold text-white"
                        >
                          {subject}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">
                        No subjects selected
                      </span>
                    )}
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                  <h3 className="font-black text-slate-900 dark:text-white">
                    Credentials
                  </h3>
                  <div className="mt-3 flex min-h-[36px] flex-wrap gap-2">
                    {certificates.length > 0 ? (
                      certificates.map((certificate) => (
                        <span
                          key={certificate}
                          className="max-w-full truncate rounded-full bg-[#7C3AED] px-3 py-1 text-xs font-bold text-white"
                        >
                          {certificate}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">
                        No certificates added
                      </span>
                    )}
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                  <h3 className="font-black text-slate-900 dark:text-white">
                    Pricing & Schedule
                  </h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white p-4 dark:bg-slate-950">
                      <p className="text-xs font-black uppercase text-slate-400">
                        Hourly Rate
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                        {hourlyRate} Coins/hr
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-4 dark:bg-slate-950">
                      <p className="text-xs font-black uppercase text-slate-400">
                        Weekly Slots
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                        {totalSlots}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {availability.map((item) => (
                      <div
                        key={item.day}
                        className="min-h-[92px] rounded-xl bg-white p-4 dark:bg-slate-950"
                      >
                        <p className="mb-2 text-sm font-black text-slate-900 dark:text-white">
                          {item.day}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.slots.length > 0 ? (
                            item.slots.map((slot) => (
                              <span
                                key={`${item.day}-${slot}`}
                                className="rounded-full bg-[#7C3AED] px-2.5 py-1 text-[11px] font-bold text-white"
                              >
                                {slot}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">No slots</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  aria-label="Back to pricing and availability"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED] dark:border-white/10 dark:text-slate-300"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  Back
                </button>
                <button
                  type="button"
                  aria-label="Submit mentor application"
                  onClick={handleSubmitApplication}
                  disabled={isSaving}
                  className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ShieldCheck size={16} aria-hidden="true" />
                  )}
                  {isSaving ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </section>
          )}
        </section>

        <aside className="lg:sticky lg:top-24 lg:col-span-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">
                Application Preview
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
              <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                {headline || "Add your professional headline"}
              </p>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs font-bold text-[#7C3AED]">
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

              <div className="grid w-full grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <p className="text-xs font-black uppercase text-slate-400">Rate</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                    {hourlyRate}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <p className="text-xs font-black uppercase text-slate-400">Slots</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                    {totalSlots}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <p className="text-xs font-black uppercase text-slate-400">Certs</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                    {certificates.length}
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
