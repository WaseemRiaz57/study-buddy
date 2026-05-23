"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  CalendarCheck,
  Clock,
  DollarSign,
  GraduationCap,
  Loader2,
  Star,
  Users,
} from "lucide-react";
import BookingModal, { type Mentor } from "@/components/mentorship/BookingModal";
import BackButton from "@/components/ui/BackButton";

type MentorDetail = {
  id: string;
  name: string;
  image: string;
  headline: string;
  bio: string;
  subjects: string[];
  hourlyRate: number;
  rating: number;
  reviews: number;
  certificates: string[];
  availability: Array<{ day: string; timeSlots: string[] }>;
  stats: {
    completedSessions: number;
    totalSessions: number;
    totalReviews: number;
  };
  studentReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt?: string | null;
    student: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
};

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "M"
  );
}

function combineDateAndTime(date: Date, time: string) {
  const scheduledAt = new Date(date);
  const startTime = time.trim().split(/\s*-\s*/)[0] ?? time.trim();
  const match = startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const meridiem = match[3].toUpperCase();

    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    scheduledAt.setHours(hour, minute, 0, 0);
  }

  return scheduledAt;
}

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          className={
            index < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300 dark:text-slate-600"
          }
        />
      ))}
    </div>
  );
}

function toBookingMentor(mentor: MentorDetail): Mentor {
  return {
    id: mentor.id,
    name: mentor.name,
    role: mentor.headline || "StudyBuddy Mentor",
    company: "Mentor Marketplace",
    hourlyRate: mentor.hourlyRate,
    rating: mentor.rating,
    reviews: mentor.reviews,
    avatar: mentor.image,
    tags: mentor.subjects,
    category: "all",
    bio: mentor.bio,
    available: mentor.availability.some((day) => day.timeSlots.length > 0),
    availability: mentor.availability,
  };
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-surface-dark">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED]">
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}

export default function MentorProfilePage() {
  const params = useParams();
  const mentorId = String(params.id || "");
  const [mentor, setMentor] = useState<MentorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function fetchMentor() {
      try {
        setIsLoading(true);
        setError("");
        const response = await fetch(`/api/mentors/${mentorId}`, {
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Could not load this mentor.");
        }

        if (isActive) {
          setMentor(data as MentorDetail);
        }
      } catch (fetchError) {
        if (isActive) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Could not load this mentor."
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    if (mentorId) {
      void fetchMentor();
    }

    return () => {
      isActive = false;
    };
  }, [mentorId]);

  const bookingMentor = useMemo(
    () => (mentor ? toBookingMentor(mentor) : null),
    [mentor]
  );

  const handleRequestSession = useCallback(() => {
    if (!bookingMentor) return;

    if (!bookingMentor.available) {
      toast.error("This mentor has not set their schedule yet.");
      return;
    }

    setIsBookingOpen(true);
  }, [bookingMentor]);

  async function handleConfirmBooking(
    selectedMentor: Mentor,
    date: Date,
    time: string
  ) {
    const scheduledAt = combineDateAndTime(date, time);

    try {
      setIsBooking(true);
      const response = await fetch("/api/sessions/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId: selectedMentor.id,
          subject: selectedMentor.tags[0] || "Mentorship Session",
          scheduledAt: scheduledAt.toISOString(),
          duration: 60,
          type: "scheduled",
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Could not request this session.");
      }

      setIsBookingOpen(false);
      toast.success("Session request sent to the mentor.");
    } catch (bookingError) {
      toast.error(
        bookingError instanceof Error
          ? bookingError.message
          : "Could not request this session."
      );
    } finally {
      setIsBooking(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 text-foreground md:p-8">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#7C3AED]" />
          Loading mentor profile...
        </div>
      </div>
    );
  }

  if (error || !mentor || !bookingMentor) {
    return (
      <div className="min-h-screen bg-background p-6 text-foreground md:p-8">
        <BackButton href="/dashboard/mentorship/find" label="Back to mentors" className="mb-6" />
        <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
          {error || "Mentor profile not found."}
        </p>
      </div>
    );
  }

  const initials = getInitials(mentor.name);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
        <BackButton
          href="/dashboard/mentorship/find"
          label="Back to mentors"
          className="border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]"
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-surface-dark md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[#7C3AED] text-3xl font-black text-white">
                {mentor.image ? (
                  <Image
                    src={mentor.image}
                    alt={`${mentor.name} avatar`}
                    width={112}
                    height={112}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED]/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#7C3AED]">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Verified Mentor
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">
                  {mentor.name}
                </h1>
                <p className="mt-2 text-base font-semibold text-[#7C3AED]">
                  {mentor.headline}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <Stars rating={mentor.rating} />
                  <span>{mentor.rating.toFixed(1)} rating</span>
                  <span>{mentor.reviews} reviews</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRequestSession}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-black text-white shadow-lg shadow-purple-600/20 transition-colors hover:bg-purple-700"
            >
              <CalendarCheck className="h-4 w-4" />
              Request Session
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Hourly Rate"
            value={`$${mentor.hourlyRate}/hr`}
          />
          <StatCard
            icon={<Award className="h-5 w-5" />}
            label="Completed"
            value={String(mentor.stats.completedSessions)}
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="All Sessions"
            value={String(mentor.stats.totalSessions)}
          />
          <StatCard
            icon={<Star className="h-5 w-5" />}
            label="Reviews"
            value={String(mentor.stats.totalReviews)}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-surface-dark">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">
              About
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
              {mentor.bio}
            </p>

            <h3 className="mt-8 text-lg font-black text-slate-950 dark:text-white">
              Expertise
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {mentor.subjects.length > 0 ? (
                mentor.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="inline-flex items-center gap-1 rounded-full bg-[#7C3AED]/10 px-3 py-1.5 text-xs font-bold text-[#7C3AED]"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    {subject}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">
                  Expertise has not been listed yet.
                </span>
              )}
            </div>
          </article>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-surface-dark">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Availability
            </h2>
            <div className="mt-4 space-y-3">
              {mentor.availability.some((day) => day.timeSlots.length > 0) ? (
                mentor.availability.map((day) =>
                  day.timeSlots.length > 0 ? (
                    <div
                      key={day.day}
                      className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5"
                    >
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {day.day}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {day.timeSlots.join(", ")}
                      </p>
                    </div>
                  ) : null
                )
              ) : (
                <p className="text-sm text-slate-500">
                  This mentor has not opened booking slots yet.
                </p>
              )}
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-surface-dark">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">
              Student Reviews
            </h2>
          </div>

          {mentor.studentReviews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {mentor.studentReviews.map((review) => {
                const studentName = review.student.name || "StudyBuddy Student";

                return (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED]/10 text-xs font-black text-[#7C3AED]">
                        {review.student.image ? (
                          <Image
                            src={review.student.image}
                            alt={`${studentName} avatar`}
                            width={40}
                            height={40}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(studentName)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                            {studentName}
                          </p>
                          <Stars rating={review.rating} size={14} />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {review.comment || "No written comment."}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-white/5">
              No student reviews yet.
            </p>
          )}
        </section>
      </main>

      {isBookingOpen && bookingMentor && (
        <BookingModal
          isOpen={isBookingOpen}
          mentor={bookingMentor}
          onClose={() => {
            if (!isBooking) setIsBookingOpen(false);
          }}
          onConfirm={handleConfirmBooking}
          isConfirming={isBooking}
        />
      )}
    </div>
  );
}
