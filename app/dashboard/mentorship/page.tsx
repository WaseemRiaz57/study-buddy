"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Star,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
} from "lucide-react";
import BookingModal, { type Mentor } from "@/components/mentorship/BookingModal";
import SuccessView from "@/components/mentorship/SuccessView";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Category = "all" | "math" | "cs" | "literature" | "business" | "science" | "history";

interface FilterOption {
  id: Category;
  label: string;
  dot?: boolean;          // green "available now" dot
}

interface MentorApiResponse {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  subjects?: string[];
  hourlyRate?: number;
  rating?: number;
  reviews?: number;
  bio?: string;
  availability?: Array<{
    day: string;
    timeSlots: string[];
  }>;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const FILTERS: FilterOption[] = [
  { id: "all", label: "All Mentors" },
  { id: "math", label: "Mathematics" },
  { id: "cs", label: "Computer Science" },
  { id: "literature", label: "Literature" },
  { id: "business", label: "Business" },
  { id: "science", label: "Science" },
  { id: "history", label: "History" },
];

const CATEGORY_KEYWORDS: Record<Exclude<Category, "all">, string[]> = {
  math: ["math", "calculus", "algebra", "geometry", "statistics"],
  cs: ["computer", "coding", "programming", "python", "algorithms", "cs"],
  literature: ["literature", "english", "writing", "essay"],
  business: ["business", "economics", "finance", "marketing"],
  science: ["science", "chemistry", "biology", "physics"],
  history: ["history", "humanities"],
};

function getMentorCategory(subjects: string[]): Category {
  const searchableSubjects = subjects.join(" ").toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => searchableSubjects.includes(keyword))) {
      return category as Category;
    }
  }

  return "all";
}

function mapMentorFromApi(mentor: MentorApiResponse): Mentor {
  const subjects = mentor.subjects ?? [];
  const availability = mentor.availability ?? [];

  return {
    id: mentor.id,
    name: mentor.name || "Mentor",
    role: "StudyBuddy Mentor",
    company: "Mentor Marketplace",
    hourlyRate: mentor.hourlyRate ?? 0,
    rating: mentor.rating ?? 0,
    reviews: mentor.reviews ?? 0,
    avatar: mentor.image ?? "",
    tags: subjects,
    category: getMentorCategory(subjects),
    bio: mentor.bio || "Ready to help you make progress in your next session.",
    available: availability.some((day) => day.timeSlots.length > 0),
    availability,
  };
}

function combineDateAndTime(date: Date, time: string) {
  const scheduledAt = new Date(date);
  const twentyFourHourMatch = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  const twelveHourMatch = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (twentyFourHourMatch) {
    scheduledAt.setHours(
      Number(twentyFourHourMatch[1]),
      Number(twentyFourHourMatch[2]),
      0,
      0
    );
    return scheduledAt;
  }

  if (twelveHourMatch) {
    let hour = Number(twelveHourMatch[1]);
    const minute = Number(twelveHourMatch[2]);
    const meridiem = twelveHourMatch[3].toUpperCase();

    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;

    scheduledAt.setHours(hour, minute, 0, 0);
  }

  return scheduledAt;
}

/* ------------------------------------------------------------------ */
/*  Mentor Card  (matches the HTML glass-card layout)                  */
/* ------------------------------------------------------------------ */
function MentorCard({
  mentor,
  onBook,
  index,
}: {
  mentor: Mentor;
  onBook: (m: Mentor) => void;
  index: number;
}) {
  const initials = mentor.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  const hasAvailability = mentor.availability?.some(
    (day) => day.timeSlots.length > 0
  );

  function handleBookClick() {
    if (!hasAvailability) {
      toast.error("This mentor has not set their schedule yet.");
      return;
    }

    onBook(mentor);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: index * 0.05 }}
      className="group relative flex flex-col h-full rounded-2xl p-6
        bg-white/75 dark:bg-white/[0.05] backdrop-blur-lg
        border border-gray-200/50 dark:border-white/10
        shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.02)]
        dark:shadow-none
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        hover:-translate-y-1 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.01)]
        hover:border-primary/20 dark:hover:border-primary/30"
    >
      {/* Hover glow */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/10 via-transparent to-pink-400/10" />

      {/* Top row: Avatar + Rating */}
      <div className="relative flex justify-between items-start mb-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-br from-gray-100 to-white dark:from-white/10 dark:to-white/5 shadow-sm">
            <div className="flex w-full h-full items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-400 text-white font-bold text-xl">
              {mentor.avatar ? (
                <img
                  src={mentor.avatar}
                  alt={mentor.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
          </div>
          {/* Status dot */}
          <div
            className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white dark:border-[#0f0a16] z-10 ${
              mentor.available
                ? "bg-green-400 shadow-[0_0_0_0_rgba(74,222,128,0.4)] animate-pulse"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        </div>

        {/* Rating + Sessions */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-400/10 px-2 py-1 rounded-lg border border-yellow-100 dark:border-yellow-400/20 mb-2">
            <Star size={14} className="text-yellow-400" fill="currentColor" />
            <span className="text-sm font-bold text-text-main dark:text-white">
              {mentor.rating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
            {mentor.reviews > 0 ? `${mentor.reviews} sessions` : "New mentor"}
          </span>
        </div>
      </div>

      {/* Name, Role, Bio */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-text-main dark:text-white mb-1 group-hover:text-primary transition-colors">
          {mentor.name}
        </h3>
        <p className="text-sm text-primary font-medium mb-1">{mentor.role}</p>
        <p className="text-sm text-text-muted dark:text-slate-400 line-clamp-2">
          {mentor.bio}
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {mentor.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-slate-300 text-xs rounded-full font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Bottom: Rate + Book */}
      <div className="mt-auto flex items-center justify-between border-t border-gray-200/80 pt-4 dark:border-white/10">
        <div>
          <span className="text-xs text-gray-400 dark:text-slate-500 block">Rate</span>
          <span className="text-lg font-bold text-text-main dark:text-white">
            ${mentor.hourlyRate}
            <span className="text-sm text-gray-400 dark:text-slate-500 font-normal">/hr</span>
          </span>
        </div>
        <button
          onClick={handleBookClick}
          className="text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md
            bg-gradient-to-r from-primary to-fuchsia-500
            hover:shadow-[0_0_15px_rgba(140,48,232,0.4)] hover:brightness-105
            active:scale-95 transition-all"
        >
          Book Session
        </button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function MentorshipPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Category>("all");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoadingMentors, setIsLoadingMentors] = useState(true);
  const [mentorLoadError, setMentorLoadError] = useState<string | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [booking, setBooking] = useState<{
    mentor: Mentor;
    date: Date;
    time: string;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function fetchMentors() {
      try {
        setIsLoadingMentors(true);
        setMentorLoadError(null);

        const response = await fetch("/api/mentors", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load mentors right now.");
        }

        const data = (await response.json()) as MentorApiResponse[];
        if (isActive) {
          setMentors(data.map(mapMentorFromApi));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (isActive) {
          setMentorLoadError(
            error instanceof Error ? error.message : "Unable to load mentors right now."
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingMentors(false);
        }
      }
    }

    fetchMentors();
    window.addEventListener("mentor-profiles-updated", fetchMentors);

    return () => {
      isActive = false;
      controller.abort();
      window.removeEventListener("mentor-profiles-updated", fetchMentors);
    };
  }, []);

  async function handleConfirmBooking(mentor: Mentor, date: Date, time: string) {
    const scheduledAt = combineDateAndTime(date, time);

    try {
      setIsBooking(true);

      const response = await fetch("/api/sessions/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId: mentor.id,
          subject: "Selected Subject",
          scheduledAt: scheduledAt.toISOString(),
          duration: 60,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Could not book this session.");
      }

      const xpResponse = await fetch("/api/progress/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xp: 50 }),
      });

      if (!xpResponse.ok) {
        toast.warning("Session booked, but XP could not be awarded yet.");
      } else {
        toast.success("Session booked! +50 XP awarded.");
      }

      setSelectedMentor(null);
      setBooking({
        mentor,
        date: scheduledAt,
        time: scheduledAt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not book this session."
      );
    } finally {
      setIsBooking(false);
    }
  }

  /* Filtered list */
  const filtered = useMemo(() => {
    let list = mentors;

    if (activeFilter !== "all") {
      list = list.filter((m) => m.category === activeFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [activeFilter, mentors, search]);

  return (
    <div className="relative min-h-screen transition-colors">
      {/* Atmospheric background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          backgroundColor: "var(--background)",
          backgroundImage: [
            "radial-gradient(at 10% 10%, rgba(140,48,232,0.04) 0px, transparent 50%)",
            "radial-gradient(at 90% 0%, rgba(37,211,102,0.03) 0px, transparent 50%)",
            "radial-gradient(at 50% 50%, rgba(255,255,255,0.7) 0px, transparent 50%)",
            "radial-gradient(at 80% 80%, rgba(140,48,232,0.05) 0px, transparent 50%)",
          ].join(","),
          backgroundAttachment: "fixed",
        }}
      />

      {/* Dark-mode blobs (overlay on top of atmospheric bg) */}
      <div className="pointer-events-none fixed inset-0 -z-10 hidden dark:block" aria-hidden>
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[160px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-pink-500/10 blur-[120px]" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* ── Header & Search ── */}
        <div className="text-center mb-12 relative">
          {/* Decorative blurred blobs */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-200 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-20 pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-pink-200 dark:bg-pink-600/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-20 pointer-events-none" />

          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight relative z-10 bg-gradient-to-r from-text-main dark:from-white to-primary bg-clip-text text-transparent">
            Find Your Mentor
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-8 max-w-2xl mx-auto relative z-10">
            Connect with Ivy League scholars and industry experts to accelerate your learning journey.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto relative z-20">
            <div className="relative group">
              {/* Glow ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-pink-400 rounded-2xl blur opacity-15 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex items-center bg-white/70 dark:bg-white/[0.06] backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-none border border-white/50 dark:border-white/10 p-2">
                <Search size={22} className="text-gray-400 dark:text-slate-500 ml-3" />
                <input
                  type="text"
                  placeholder="Search by subject, name, or university..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-text-main dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-lg py-3 px-4 outline-none"
                />
                <button className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-600 dark:text-slate-400 rounded-xl p-3 transition-colors shrink-0">
                  <SlidersHorizontal size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter pills ── */}
        <div className="flex overflow-x-auto scrollbar-none space-x-3 mb-10 pb-2 px-1 items-center justify-start md:justify-center">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`
                whitespace-nowrap px-6 py-2.5 rounded-full font-medium text-sm transition-all
                ${
                  activeFilter === f.id
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(140,48,232,0.15)] border border-primary/20 hover:scale-105 transform"
                    : "bg-white/60 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-purple-300 border border-gray-200 dark:border-white/10 backdrop-blur-sm hover:shadow-md hover:border-primary/30 dark:hover:border-primary/30"
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Mentor Grid ── */}
        {isLoadingMentors ? (
          <div className="flex items-center justify-center py-20 text-text-muted dark:text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
            Loading mentors...
          </div>
        ) : mentorLoadError ? (
          <div className="rounded-2xl border border-red-200/70 bg-red-50/80 p-6 text-center text-sm font-medium text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
            {mentorLoadError}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((mentor, i) => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  onBook={setSelectedMentor}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoadingMentors && !mentorLoadError && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/15 text-primary mb-4">
              <Search size={28} />
            </div>
            <h3 className="text-lg font-bold text-text-main dark:text-white mb-1">
              No mentors found
            </h3>
            <p className="text-sm text-text-muted dark:text-slate-400 max-w-xs">
              Try a different search term or filter to find the right mentor for you.
            </p>
          </motion.div>
        )}

        {/* ── Become a Mentor CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 mb-8 relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8 text-center"
        >
          <div className="pointer-events-none absolute -top-16 -left-16 h-32 w-32 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-pink-500/10 blur-3xl" />
          <h3 className="relative text-xl font-bold text-[var(--foreground)] mb-2">
            Share Your Knowledge — Become a Mentor
          </h3>
          <p className="relative text-sm text-gray-500 dark:text-slate-400 mb-5 max-w-md mx-auto">
            Set your own rates, build your reputation, and help the next generation of scholars succeed.
          </p>
          <div className="relative flex items-center justify-center gap-3">
            <Link
              href="/dashboard/settings/mentorship"
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-6 py-3 text-sm font-bold shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
            >
              Apply to Mentor
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/apply/status"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-6 py-3 text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              Check Application Status
            </Link>
          </div>
        </motion.div>

        {/* ── Pagination ── */}
        {!isLoadingMentors && !mentorLoadError && filtered.length > 0 && (
          <div className="flex justify-center mt-12 mb-8">
            <nav className="inline-flex rounded-xl shadow-sm border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.05] backdrop-blur-md overflow-hidden">
              <button className="inline-flex items-center px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-primary transition-colors gap-1">
                <ChevronLeft size={18} />
                Previous
              </button>
              <button className="inline-flex items-center px-4 py-3 text-sm font-bold text-primary hover:bg-gray-50 dark:hover:bg-white/10 border-l border-gray-100 dark:border-white/10">
                1
              </button>
              <button className="inline-flex items-center px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-primary transition-colors border-l border-gray-100 dark:border-white/10">
                2
              </button>
              <button className="inline-flex items-center px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-primary transition-colors border-l border-gray-100 dark:border-white/10">
                3
              </button>
              <span className="inline-flex items-center px-4 py-3 text-sm font-medium text-gray-400 dark:text-slate-500 border-l border-gray-100 dark:border-white/10">
                …
              </span>
              <button className="inline-flex items-center px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-primary transition-colors border-l border-gray-100 dark:border-white/10 gap-1">
                Next
                <ChevronRight size={18} />
              </button>
            </nav>
          </div>
        )}
      </main>

      {/* Booking slide-over */}
      {selectedMentor && (
        <BookingModal
          isOpen={!!selectedMentor}
          mentor={selectedMentor}
          onClose={() => {
            if (!isBooking) {
              setSelectedMentor(null);
            }
          }}
          onConfirm={handleConfirmBooking}
          isConfirming={isBooking}
        />
      )}

      {/* Success celebration */}
      <AnimatePresence>
        {booking && (
          <SuccessView
            mentor={booking.mentor}
            date={booking.date}
            time={booking.time}
            onClose={() => setBooking(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
