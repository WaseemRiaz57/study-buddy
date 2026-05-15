"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Clock, FileText, Sparkles, Zap, Target, CheckSquare, Brain, Timer, Star, BookMarked, Lock, ArrowRight, Users } from "lucide-react";
import ReviewModal from "@/components/mentorship/ReviewModal";

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

type AINoteType = "notes" | "summarizer" | "quiz";

interface RecentAINote {
  _id: string;
  title: string;
  content: string;
  type: AINoteType;
  createdAt: string;
}

type SessionStatus =
  | "pending"
  | "accepted"
  | "payment_pending"
  | "payment_verified"
  | "declined"
  | "rejected"
  | "completed";

interface PopulatedMentor {
  _id?: string;
  name?: string;
  image?: string;
  email?: string;
}

interface StudentMentorSession {
  _id: string;
  mentorId?: PopulatedMentor | string;
  subject: string;
  scheduledAt: string;
  duration: number;
  status: SessionStatus;
  roomId?: string;
  reviewSubmitted?: boolean;
}

function getMentor(session: StudentMentorSession): PopulatedMentor {
  return typeof session.mentorId === "object" && session.mentorId !== null
    ? session.mentorId
    : {};
}

function getMentorName(session: StudentMentorSession) {
  return getMentor(session).name || "Mentor";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatSessionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBD";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSessionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time TBD";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isPastReviewCandidate(session: StudentMentorSession) {
  return session.status === "completed";
}

export function StudentDashboard() {
  const [recentNotes, setRecentNotes] = useState<RecentAINote[]>([]);
  const [mentorSessions, setMentorSessions] = useState<StudentMentorSession[]>([]);
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);
  const [selectedReviewSession, setSelectedReviewSession] =
    useState<StudentMentorSession | null>(null);

  const formatRelativeTime = useCallback((isoDate: string) => {
    const date = new Date(isoDate).getTime();
    const now = Date.now();
    const diffMs = now - date;
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  const fetchRecentNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-notes?limit=8", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setRecentNotes(Array.isArray(data) ? data : []);
    } catch {
    }
  }, []);

  const fetchMentorSessions = useCallback(async () => {
    try {
      setSessionLoadError(null);

      const res = await fetch("/api/sessions", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Unable to load mentor sessions.");
      }

      const data = await res.json();
      setMentorSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      setSessionLoadError(
        error instanceof Error ? error.message : "Unable to load mentor sessions."
      );
    }
  }, []);

  useEffect(() => {
    fetchRecentNotes();
    fetchMentorSessions();

    const onNotesUpdated = () => {
      fetchRecentNotes();
    };

    window.addEventListener("ai-notes-updated", onNotesUpdated);
    return () => {
      window.removeEventListener("ai-notes-updated", onNotesUpdated);
    };
  }, [fetchRecentNotes, fetchMentorSessions]);

  const noteTypeMeta: Record<AINoteType, { gradient: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string }> = {
    notes: { gradient: "from-emerald-500 to-teal-600", icon: Brain, label: "Smart Notes" },
    summarizer: { gradient: "from-indigo-500 to-purple-600", icon: FileText, label: "Summary" },
    quiz: { gradient: "from-orange-500 to-red-600", icon: Zap, label: "Quiz" },
  };

  const completedSessionsCount = mentorSessions.filter(
    (session) => session.status === "completed"
  ).length;
  const reviewableSessions = mentorSessions
    .filter(isPastReviewCandidate)
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );
  const nextMentorSession = mentorSessions
    .filter((session) => {
      const scheduledAt = new Date(session.scheduledAt).getTime();
      return (
        session.status === "payment_verified" &&
        !Number.isNaN(scheduledAt) &&
        scheduledAt >= Date.now()
      );
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )[0];

  function handleReviewSubmitted() {
    const reviewedSessionId = selectedReviewSession?._id;

    if (reviewedSessionId) {
      setMentorSessions((currentSessions) =>
        currentSessions.map((session) =>
          session._id === reviewedSessionId
            ? { ...session, status: "completed", reviewSubmitted: true }
            : session
        )
      );
    }

    setSelectedReviewSession(null);
    toast.success("Review submitted successfully!");
    window.dispatchEvent(new Event("mentor-profiles-updated"));
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* HERO SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Level Progress Card */}
          <motion.div {...fadeIn} className="md:col-span-2 relative overflow-hidden glass-panel rounded-[2rem] p-8 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-20 -mt-20 blur-[80px] group-hover:bg-primary/30 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <span className="inline-block text-primary font-bold text-xs uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full mb-4">
                  Progress Milestone
                </span>
                <h2 className="text-3xl md:text-4xl font-black mb-3 text-foreground tracking-tight">Level 15 is within reach!</h2>
                <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
                  You've completed <span className="text-foreground font-bold">85%</span> of your weekly goals. Finish 2 more sessions to ascend to the next tier.
                </p>
                <button className="mt-8 inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 transition-all">
                  <span>Continue Journey</span>
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* Circular Progress */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-muted-foreground/10" cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="10" />
                  <motion.circle 
                    initial={{ strokeDashoffset: 439.8 }}
                    animate={{ strokeDashoffset: 65.97 }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                    className="text-primary" 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    fill="transparent" 
                    stroke="currentColor" 
                    strokeWidth="10"
                    strokeDasharray="439.8"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-foreground tracking-tighter">14</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Level</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Next Session Card */}
          <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="glass-panel rounded-[2rem] p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-primary/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-0 hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="text-primary" size={18} />
                <span className="font-bold text-sm text-primary">Up Next Session</span>
              </div>
              <h3 className="text-xl font-bold text-foreground leading-tight">
                {nextMentorSession ? (
                  <>
                    {nextMentorSession.subject}
                    <br />
                    with {getMentorName(nextMentorSession)}
                  </>
                ) : (
                  <>
                    Find a Mentor
                    <br />
                    Book your next session
                  </>
                )}
              </h3>
              <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                <Users size={14} />
                {nextMentorSession
                  ? `${formatSessionDate(nextMentorSession.scheduledAt)} at ${formatSessionTime(nextMentorSession.scheduledAt)}`
                  : "Your accepted mentor sessions will appear here"}
              </p>
            </div>

            <div className="mt-6 relative z-10">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-3 tracking-wider">Starts In</p>
              <div className="flex gap-2">
                <div className="bg-background/50 backdrop-blur-md px-3 py-2 rounded-xl border border-border/50 flex-1 text-center">
                  <span className="block text-2xl font-black text-foreground">
                    {completedSessionsCount}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">DONE</span>
                </div>
                <div className="bg-background/50 backdrop-blur-md px-3 py-2 rounded-xl border border-border/50 flex-1 text-center">
                  <span className="block text-2xl font-black text-foreground">
                    {mentorSessions.length}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">TOTAL</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* SECTION 2: QUESTS & NOTES */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Daily Quests */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                 Daily Quests <Target className="text-primary" size={20} />
              </h2>
              <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">Refresh</button>
            </div>

            <div className="space-y-3">
              {/* Quest 1 - Completed */}
              <div className="flex items-center justify-between p-4 glass-panel rounded-2xl hover:border-primary/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Timer className="text-emerald-500" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Complete 1 Pomodoro</p>
                    <p className="text-xs text-muted-foreground mt-0.5">+50 XP • +10 Coins</p>
                  </div>
                </div>
                <button className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform">
                  Claim
                </button>
              </div>

              {/* Quest 2 - In Progress */}
              <div className="flex items-center justify-between p-4 glass-panel rounded-2xl hover:border-primary/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookMarked className="text-purple-500" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Review AI Flashcards</p>
                    <p className="text-xs text-muted-foreground mt-0.5">15/20 Reviewed</p>
                  </div>
                </div>
                <button className="bg-primary/10 text-primary px-4 py-1.5 rounded-lg text-xs font-bold group-hover:bg-primary group-hover:text-white transition-all">
                  Resume
                </button>
              </div>

              {/* Quest 3 - Locked */}
              <div className="flex items-center justify-between p-4 glass-panel rounded-2xl opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <Users className="text-muted-foreground" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Join a Peer Session</p>
                    <p className="text-xs text-muted-foreground mt-0.5">+100 XP • Reward Case</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                   <Lock size={12} /> Locked
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI Notes Carousel - SCROLLBAR HIDDEN */}
          <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Recent AI Notes <Sparkles className="text-primary" size={20} />
              </h2>
              <button className="flex items-center gap-1 text-primary text-sm font-bold hover:gap-2 transition-all">
                See All <ArrowRight size={16} />
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {recentNotes.map((note) => {
                const meta = noteTypeMeta[note.type];
                const Icon = meta.icon;
                return (
                <div key={note._id} className="min-w-[260px] glass-panel rounded-[1.5rem] p-5 hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden">
                  <div className={`aspect-[4/3] rounded-2xl mb-4 overflow-hidden relative bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-inner`}>
                    <div className="absolute inset-0 bg-black/10" />
                    <Icon className="text-white/60 group-hover:scale-110 transition-transform duration-500" size={48} />
                  </div>
                  <h4 className="font-bold text-base mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {note.title}
                  </h4>
                  <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {meta.label}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground">{formatRelativeTime(note.createdAt)}</p>
                  </div>
                </div>
              )})}
              {recentNotes.length === 0 && (
                <div className="min-w-[260px] glass-panel rounded-[1.5rem] p-5 text-sm text-muted-foreground">
                  Your latest AI notes will appear here.
                </div>
              )}
            </div>
          </motion.div>

        </div>

        {/* SECTION 3: MENTORSHIP REVIEWS */}
        <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="space-y-5">
          <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Past Sessions <Star className="text-yellow-400" size={20} />
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Completed Sessions:{" "}
                <span className="font-bold text-foreground">
                  {completedSessionsCount}
                </span>
              </p>
            </div>
            <button
              onClick={fetchMentorSessions}
              className="inline-flex items-center justify-center rounded-xl border border-border/70 px-4 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Refresh
            </button>
          </div>

          {sessionLoadError ? (
            <div className="glass-panel rounded-2xl p-5 text-sm font-medium text-red-500">
              {sessionLoadError}
            </div>
          ) : reviewableSessions.length === 0 ? (
            <div className="glass-panel rounded-2xl p-6 text-sm text-muted-foreground">
              Past mentor sessions will show here once they are completed.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {reviewableSessions.slice(0, 4).map((session) => {
                const mentor = getMentor(session);
                const mentorName = getMentorName(session);

                return (
                  <div
                    key={session._id}
                    className="glass-panel rounded-2xl p-5 transition-all hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#7C3AED] text-sm font-black text-white">
                          {mentor.image ? (
                            <img
                              src={mentor.image}
                              alt={mentorName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(mentorName)
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-bold text-foreground">
                            {session.subject}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            with {mentorName}
                          </p>
                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                            {formatSessionDate(session.scheduledAt)} ·{" "}
                            {formatSessionTime(session.scheduledAt)}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full border border-border/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        {session.status}
                      </span>
                    </div>

                    <div className="mt-5 flex justify-end border-t border-border/60 pt-4">
                      {session.reviewSubmitted ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckSquare size={16} />
                          Reviewed
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedReviewSession(session)}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED] bg-white px-4 py-2 text-sm font-bold text-[#7C3AED] shadow-sm transition-colors hover:bg-purple-50 active:scale-95 dark:bg-transparent dark:hover:bg-purple-500/10"
                        >
                          <Star size={16} className="fill-purple-600 text-purple-600" />
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {selectedReviewSession && (
        <ReviewModal
          isOpen={!!selectedReviewSession}
          sessionId={selectedReviewSession._id}
          mentorName={getMentorName(selectedReviewSession)}
          subject={selectedReviewSession.subject}
          onClose={() => setSelectedReviewSession(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
