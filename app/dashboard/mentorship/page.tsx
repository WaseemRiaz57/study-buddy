"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Star,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
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

const MENTORS: Mentor[] = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "PhD Candidate, Stanford",
    company: "Stanford University",
    hourlyRate: 45,
    rating: 4.9,
    reviews: 124,
    avatar: "",
    tags: ["Math", "Calculus", "SAT Prep"],
    category: "math",
    bio: "Specializing in Calculus, Linear Algebra, and preparing students for SAT Math sections.",
    available: true,
  },
  {
    id: 2,
    name: "David Chen",
    role: "MSc Comp Sci, MIT",
    company: "Massachusetts Institute of Technology",
    hourlyRate: 60,
    rating: 5.0,
    reviews: 89,
    avatar: "",
    tags: ["Coding", "Python", "Algorithms"],
    category: "cs",
    bio: "Expert in Python, Data Structures, and Algorithms. Former Google intern.",
    available: false,
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    role: "BA English Lit, Yale",
    company: "Yale University",
    hourlyRate: 40,
    rating: 4.8,
    reviews: 210,
    avatar: "",
    tags: ["English", "Writing", "Essay"],
    category: "literature",
    bio: "Creative writing coach and essay editor. Helping you craft the perfect college essay.",
    available: true,
  },
  {
    id: 4,
    name: "Marcus Johnson",
    role: "MBA, Harvard Business School",
    company: "Harvard University",
    hourlyRate: 75,
    rating: 4.7,
    reviews: 56,
    avatar: "",
    tags: ["Business", "Economics", "Leadership"],
    category: "business",
    bio: "Business strategy, economics, and leadership development for aspiring entrepreneurs.",
    available: false,
  },
  {
    id: 5,
    name: "Aisha Patel",
    role: "PhD Chemistry, Berkeley",
    company: "UC Berkeley",
    hourlyRate: 50,
    rating: 4.9,
    reviews: 189,
    avatar: "",
    tags: ["Chemistry", "Science", "Pre-med"],
    category: "science",
    bio: "Making organic chemistry understandable and fun. Specialized in pre-med track support.",
    available: true,
  },
  {
    id: 6,
    name: "James Wilson",
    role: "MA History, Oxford",
    company: "Oxford University",
    hourlyRate: 35,
    rating: 4.6,
    reviews: 42,
    avatar: "",
    tags: ["History", "Humanities", "Research"],
    category: "history",
    bio: "Bringing history to life through storytelling. Specialized in European and World History.",
    available: false,
  },
];

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
              {initials}
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
            {mentor.reviews} sessions
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
        {mentor.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-slate-300 text-xs rounded-full font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Bottom: Rate + Book */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
        <div>
          <span className="text-xs text-gray-400 dark:text-slate-500 block">Rate</span>
          <span className="text-lg font-bold text-text-main dark:text-white">
            ${mentor.hourlyRate}
            <span className="text-sm text-gray-400 dark:text-slate-500 font-normal">/hr</span>
          </span>
        </div>
        <button
          onClick={() => onBook(mentor)}
          disabled={!mentor.available}
          className="text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md
            bg-gradient-to-r from-primary to-fuchsia-500
            hover:shadow-[0_0_15px_rgba(140,48,232,0.4)] hover:brightness-105
            active:scale-95 transition-all
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:hover:brightness-100"
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
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [booking, setBooking] = useState<{
    mentor: Mentor;
    date: Date;
    time: string;
  } | null>(null);

  /* Filtered list */
  const filtered = useMemo(() => {
    let list = MENTORS;

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
  }, [activeFilter, search]);

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

        {/* Empty state */}
        {filtered.length === 0 && (
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

        {/* ── Pagination ── */}
        {filtered.length > 0 && (
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
          onClose={() => setSelectedMentor(null)}
          onConfirm={(mentor, date, time) => {
            setSelectedMentor(null);
            setBooking({ mentor, date, time });
          }}
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
