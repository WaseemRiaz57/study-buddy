"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Star,
  Clock,
  MessageSquare,
  Briefcase,
  Filter,
  CalendarDays,
  Users,
} from "lucide-react";
import Image from "next/image";
import BookingModal, { type Mentor } from "@/components/mentorship/BookingModal";
import SuccessView from "@/components/mentorship/SuccessView";

type Category = "cs" | "design" | "business";

interface FilterOption {
  id: Category | "all";
  label: string;
  icon: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const FILTERS: FilterOption[] = [
  { id: "all", label: "All Mentors", icon: <Users size={16} /> },
  { id: "cs", label: "Computer Science", icon: <Briefcase size={16} /> },
  { id: "design", label: "Design", icon: <Star size={16} /> },
  { id: "business", label: "Business", icon: <MessageSquare size={16} /> },
];

const MENTORS: Mentor[] = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    role: "Senior ML Engineer",
    company: "Google DeepMind",
    hourlyRate: 85,
    rating: 4.9,
    reviews: 127,
    avatar: "",
    tags: ["Machine Learning", "Python", "AI Research"],
    category: "cs",
    bio: "10+ years building production ML systems. Stanford PhD.",
    available: true,
  },
  {
    id: 2,
    name: "Marcus Rivera",
    role: "Lead Product Designer",
    company: "Figma",
    hourlyRate: 70,
    rating: 4.8,
    reviews: 94,
    avatar: "",
    tags: ["UI/UX", "Design Systems", "Figma"],
    category: "design",
    bio: "Design lead with a passion for accessible, delightful interfaces.",
    available: true,
  },
  {
    id: 3,
    name: "Priya Sharma",
    role: "VP of Strategy",
    company: "McKinsey & Co.",
    hourlyRate: 120,
    rating: 5.0,
    reviews: 61,
    avatar: "",
    tags: ["Strategy", "MBA Prep", "Consulting"],
    category: "business",
    bio: "Helps students break into top consulting firms.",
    available: false,
  },
  {
    id: 4,
    name: "Alex Kim",
    role: "Staff Software Engineer",
    company: "Stripe",
    hourlyRate: 95,
    rating: 4.7,
    reviews: 83,
    avatar: "",
    tags: ["Full-Stack", "System Design", "TypeScript"],
    category: "cs",
    bio: "Specialises in scalable payment infrastructure and APIs.",
    available: true,
  },
  {
    id: 5,
    name: "Lena Okafor",
    role: "Brand Director",
    company: "Nike",
    hourlyRate: 80,
    rating: 4.9,
    reviews: 72,
    avatar: "",
    tags: ["Branding", "Marketing", "Creative Direction"],
    category: "design",
    bio: "Award-winning creative director with global brand experience.",
    available: true,
  },
  {
    id: 6,
    name: "James Thornton",
    role: "Startup Advisor",
    company: "Y Combinator",
    hourlyRate: 150,
    rating: 4.8,
    reviews: 109,
    avatar: "",
    tags: ["Startups", "Fundraising", "Product-Market Fit"],
    category: "business",
    bio: "Helped 40+ YC startups raise their seed rounds.",
    available: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Floating Particles                                                 */
/* ------------------------------------------------------------------ */
function Particles() {
  const [dots, setDots] = useState<
    { id: number; x: number; y: number; size: number; duration: number; delay: number }[]
  >([]);

  useEffect(() => {
    setDots(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 8 + 10,
        delay: Math.random() * 5,
      })),
    );
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full bg-purple-400/20 dark:bg-purple-400/15"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mentor Card                                                        */
/* ------------------------------------------------------------------ */
function MentorCard({
  mentor,
  onBook,
}: {
  mentor: Mentor;
  onBook: (m: Mentor) => void;
}) {
  /* Initials fallback for avatar */
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
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="group relative flex flex-col rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md shadow-sm dark:shadow-none overflow-hidden"
    >
      {/* Gradient glow on hover */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/20 via-transparent to-purple-400/20" />

      {/* Top accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-400 to-primary/60" />

      <div className="relative flex flex-col flex-1 p-5 gap-4">
        {/* Avatar + Info */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {mentor.avatar ? (
            <Image
              src={mentor.avatar}
              alt={mentor.name}
              width={56}
              height={56}
              className="rounded-xl object-cover ring-2 ring-primary/30"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-400 text-white font-bold text-lg ring-2 ring-primary/30 shadow-lg shadow-primary/20">
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-main dark:text-white truncate">
                {mentor.name}
              </h3>
              {mentor.available ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-400/10 rounded-full px-2 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Open
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 rounded-full px-2 py-0.5">
                  Busy
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted dark:text-slate-400 truncate">
              {mentor.role}
            </p>
            <p className="text-xs text-text-muted/70 dark:text-slate-500 truncate">
              {mentor.company}
            </p>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-text-muted dark:text-slate-400 leading-relaxed line-clamp-2">
          {mentor.bio}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {mentor.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-primary/10 dark:bg-primary/15 text-primary dark:text-purple-300 border border-primary/20 dark:border-purple-400/20"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200/70 dark:border-white/10" />

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Rating */}
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={14} fill="currentColor" />
              <span className="text-sm font-semibold text-text-main dark:text-white">
                {mentor.rating.toFixed(1)}
              </span>
              <span className="text-xs text-text-muted dark:text-slate-500">
                ({mentor.reviews})
              </span>
            </div>
            {/* Rate */}
            <div className="flex items-center gap-1 text-text-muted dark:text-slate-400">
              <Clock size={13} />
              <span className="text-sm font-semibold text-text-main dark:text-white">
                ${mentor.hourlyRate}
              </span>
              <span className="text-xs">/hr</span>
            </div>
          </div>

          <button
            onClick={() => onBook(mentor)}
            disabled={!mentor.available}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold 
              bg-gradient-to-r from-primary to-purple-400 text-white shadow-lg shadow-primary/25
              hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
              transition-all"
          >
            <CalendarDays size={15} />
            Book Session
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function MentorshipPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Category | "all">("all");
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [booking, setBooking] = useState<{
    mentor: Mentor;
    date: Date;
    time: string;
  } | null>(null);

  /* Derived filtered list */
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
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0f0a16] transition-colors">
      {/* Floating particles */}
      <Particles />

      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/10 dark:bg-primary/15 blur-[140px]" />
        <div className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-purple-400/10 dark:bg-purple-400/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-[350px] w-[350px] rounded-full bg-pink-400/5 dark:bg-pink-400/10 blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 space-y-8">
        {/* ── Header ── */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-main dark:text-white">
            Mentor Marketplace
          </h1>
          <p className="text-text-muted dark:text-slate-400 text-base max-w-xl">
            Connect with industry experts for 1-on-1 sessions. Get feedback,
            career guidance, and hands-on help from the best in the field.
          </p>
        </div>

        {/* ── Search + Filters bar ── */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              placeholder="Search by name, role, or skill…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md pl-11 pr-4 py-3 text-sm text-text-main dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter
              size={16}
              className="text-text-muted dark:text-slate-500 mr-1"
            />
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`
                  flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all
                  ${
                    activeFilter === f.id
                      ? "bg-gradient-to-r from-primary to-purple-400 text-white shadow-md shadow-primary/25"
                      : "bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-text-muted dark:text-slate-400 hover:bg-white dark:hover:bg-white/10 hover:text-text-main dark:hover:text-white"
                  }
                `}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="flex items-center gap-6 text-sm">
          <span className="text-text-muted dark:text-slate-400">
            <span className="font-bold text-text-main dark:text-white">
              {filtered.length}
            </span>{" "}
            mentor{filtered.length !== 1 && "s"} found
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-white/10">
            |
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-text-muted dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            {MENTORS.filter((m) => m.available).length} available now
          </span>
        </div>

        {/* ── Grid ── */}
        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onBook={setSelectedMentor}
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
              Try a different search term or filter to find the right mentor for
              you.
            </p>
          </motion.div>
        )}
      </div>

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
