"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Clock, FileText, Sparkles, Zap, Target, CheckSquare, Brain, Timer, Star, BookMarked, Lock, ArrowRight, Users, ClipboardList } from "lucide-react";
import { MinimalTodoList } from "@/components/focus/MinimalTodoList";

const ReviewModal = dynamic(() => import("@/components/mentorship/ReviewModal"));

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
  | "active"
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
  isSessionStarted?: boolean;
  reviewSubmitted?: boolean;
}

interface PendingAssignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  mentor?: {
    name?: string;
  };
}

interface GamificationStats {
  xp: number;
  level: number;
  nextLevelXp: number;
  coins: number;
  streak: number;
}

interface ResumeItem {
  id: string;
  title: string;
  type: "notes" | "summarizer" | "study-room";
  href: string;
  createdAt: string;
}

interface DashboardChallenge {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "global" | "elite";
  targetMetric: number;
  xpReward: number;
  isLocked: boolean;
  progress: {
    currentValue: number;
    targetMetric: number;
    percentage: number;
    isCompleted: boolean;
    isClaimed: boolean;
  };
}

function getMentor(session: StudentMentorSession): PopulatedMentor {
  return typeof session.mentorId === "object" && session.mentorId !== null
    ? session.mentorId
    : {};
}

function getMentorName(session: StudentMentorSession) {
  return getMentor(session).name || "Mentor";
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
  const [gamificationStats, setGamificationStats] = useState<GamificationStats>({
    xp: 0,
    level: 1,
    nextLevelXp: 1000,
    coins: 0,
    streak: 0,
  });
  const [resumeItem, setResumeItem] = useState<ResumeItem | null>(null);
  const [dashboardChallenges, setDashboardChallenges] = useState<DashboardChallenge[]>([]);
  const [claimingChallengeId, setClaimingChallengeId] = useState<string | null>(null);
  const [recentNotes, setRecentNotes] = useState<RecentAINote[]>([]);
  const [mentorSessions, setMentorSessions] = useState<StudentMentorSession[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
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

  const fetchGamificationStats = useCallback(async () => {
    try {
      const res = await fetch("/api/user/gamification-stats", { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      const stats = data?.stats || {};

      setGamificationStats({
        xp: Number(stats.xp || 0),
        level: Math.max(1, Number(stats.level || 1)),
        nextLevelXp: Math.max(1000, Number(stats.nextLevelXp || 1000)),
        coins: Number(stats.coins || 0),
        streak: Number(stats.streak || 0),
      });
    } catch {
    }
  }, []);

  const fetchResumeItem = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/resume", { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      setResumeItem(data?.resume || null);
    } catch {
    }
  }, []);

  const fetchDashboardChallenges = useCallback(async () => {
    try {
      const res = await fetch("/api/challenges", { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      const challenges = Array.isArray(data?.challenges)
        ? data.challenges.filter((challenge: DashboardChallenge) =>
            challenge.type === "daily" || challenge.type === "weekly"
          )
        : [];

      setDashboardChallenges(challenges.slice(0, 3));
    } catch {
    }
  }, []);

  const handleClaimChallenge = useCallback(
    async (challenge: DashboardChallenge) => {
      try {
        setClaimingChallengeId(challenge.id);
        const res = await fetch(`/api/challenges/${challenge.id}/claim`, {
          method: "POST",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Unable to claim this reward.");
        }

        toast.success("Reward claimed!");
        await Promise.all([fetchDashboardChallenges(), fetchGamificationStats()]);
        window.dispatchEvent(new Event("gamification-stats-updated"));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to claim this reward.");
      } finally {
        setClaimingChallengeId(null);
      }
    },
    [fetchDashboardChallenges, fetchGamificationStats]
  );

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

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch("/api/student/assignments", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setPendingAssignments(
        Array.isArray(data?.assignments) ? data.assignments.slice(0, 3) : []
      );
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchGamificationStats();
    fetchResumeItem();
    fetchDashboardChallenges();
    fetchRecentNotes();
    fetchMentorSessions();
    fetchAssignments();

    const onNotesUpdated = () => {
      fetchRecentNotes();
      fetchResumeItem();
    };
    const onGamificationUpdated = () => {
      fetchGamificationStats();
    };

    window.addEventListener("ai-notes-updated", onNotesUpdated);
    window.addEventListener("gamification-stats-updated", onGamificationUpdated);
    window.addEventListener("student-session-invited", fetchMentorSessions);
    window.addEventListener("mentor-session-started", fetchMentorSessions);
    return () => {
      window.removeEventListener("ai-notes-updated", onNotesUpdated);
      window.removeEventListener("gamification-stats-updated", onGamificationUpdated);
      window.removeEventListener("student-session-invited", fetchMentorSessions);
      window.removeEventListener("mentor-session-started", fetchMentorSessions);
    };
  }, [
    fetchAssignments,
    fetchDashboardChallenges,
    fetchGamificationStats,
    fetchRecentNotes,
    fetchResumeItem,
    fetchMentorSessions,
  ]);

  const noteTypeMeta: Record<AINoteType, { gradient: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string }> = {
    notes: { gradient: " ", icon: Brain, label: "Smart Notes" },
    summarizer: { gradient: " ", icon: FileText, label: "Summary" },
    quiz: { gradient: " ", icon: Zap, label: "Quiz" },
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
        (session.status === "payment_verified" || session.status === "active") &&
        (session.isSessionStarted || (!Number.isNaN(scheduledAt) && scheduledAt >= Date.now() - 3600000))
      );
    })
    .sort((a, b) => {
      const aActive = a.isSessionStarted ? 1 : 0;
      const bActive = b.isSessionStarted ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    })[0];
  const currentLevelStartXp = Math.max(0, (gamificationStats.level - 1) * 1000);
  const nextLevelXp = Math.max(
    gamificationStats.nextLevelXp || gamificationStats.level * 1000,
    currentLevelStartXp + 1000
  );
  const levelProgressPct = Math.min(
    100,
    Math.max(
      0,
      ((gamificationStats.xp - currentLevelStartXp) /
        Math.max(1, nextLevelXp - currentLevelStartXp)) *
        100
    )
  );
  const levelCircleCircumference = 2 * Math.PI * 70;
  const levelDashOffset =
    levelCircleCircumference * (1 - levelProgressPct / 100);
  const visibleChallenges = dashboardChallenges;
  const resumeButtonLabel = resumeItem
    ? resumeItem.type === "study-room"
      ? "Resume Study Room"
      : "Resume Latest Notes"
    : "Start AI Studio";

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
      <main className="app-page min-w-0 space-y-3" aria-label="Student dashboard">
        
        {/* HERO SECTION */}
        <div className="tour-dashboard-overview grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
          
          {/* Level Progress Card */}
          <motion.div {...fadeIn} className="tour-gamification glass-panel group relative min-w-0 overflow-hidden rounded-2xl p-4 lg:col-span-2">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-20 -mt-20 blur-[80px] group-hover:bg-primary/30 transition-all duration-700" />
            
            <div className="relative z-10 flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <span className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                  Progress Milestone
                </span>
                <h1 className="mb-1 text-lg font-black tracking-tight text-foreground">
                  Level {gamificationStats.level} is in motion!
                </h1>
                <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                  You have earned{" "}
                  <span className="text-foreground font-bold">
                    {gamificationStats.xp.toLocaleString()} XP
                  </span>
                  . You are{" "}
                  <span className="text-foreground font-bold">
                    {Math.round(levelProgressPct)}%
                  </span>{" "}
                  toward Level {gamificationStats.level + 1}.
                </p>
                <Link
                  href={resumeItem?.href || "/dashboard/content-generator"}
                  className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full bg-primary py-1 pl-4 pr-1.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-purple-700"
                  aria-label={
                    resumeItem
                      ? `Resume ${resumeItem.title}`
                      : "Start a new AI generation"
                  }
                >
                  <span>{resumeButtonLabel}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15"><ArrowRight size={14} /></span>
                </Link>
              </div>

              {/* Circular Progress */}
              <div className="relative h-20 w-20 shrink-0 self-center sm:h-24 sm:w-24" aria-label={`${Math.round(levelProgressPct)}% progress to the next level`}>
                <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90 overflow-visible" role="img">
                  <circle className="text-muted-foreground/10" cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="10" />
                  <motion.circle 
                    initial={{ strokeDashoffset: levelCircleCircumference }}
                    animate={{ strokeDashoffset: levelDashOffset }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                    className="text-primary" 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    fill="transparent" 
                    stroke="currentColor" 
                    strokeWidth="10"
                    strokeDasharray={levelCircleCircumference}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black tracking-tighter text-foreground">
                    {gamificationStats.level}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Level</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Next Session Card */}
          <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="glass-panel relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-primary/10 bg-[#7C3AED] p-4">
            <div className="absolute inset-0 bg-primary/5 opacity-0 hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="text-primary" size={18} />
                <span className="font-bold text-sm text-primary">Up Next Session</span>
              </div>
              <h2 className="text-base font-bold leading-tight text-foreground">
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
              </h2>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Users size={14} />
                {nextMentorSession
                  ? `${formatSessionDate(nextMentorSession.scheduledAt)} at ${formatSessionTime(nextMentorSession.scheduledAt)}`
                  : "Your accepted mentor sessions will appear here"}
              </p>
            </div>
            <div className="relative z-10 mt-3">
              {nextMentorSession?.isSessionStarted ? (
                <Link
                  href={`/dashboard/study-rooms/${nextMentorSession._id}`}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#7C3AED] shadow-lg transition-all hover:bg-purple-50"
                >
                  Join Room <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <p className="text-xs font-bold text-amber-600 uppercase mb-3 tracking-wider">
                    Waiting for Mentor to start...
                  </p>
                  <div className="flex gap-2">
                    <div className="min-w-0 flex-1 rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-center backdrop-blur-md">
                      <span className="block text-xl font-black text-foreground">
                        {completedSessionsCount}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground">DONE</span>
                    </div>
                    <div className="min-w-0 flex-1 rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-center backdrop-blur-md">
                      <span className="block text-xl font-black text-foreground">
                        {mentorSessions.length}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground">TOTAL</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* SECTION 2: QUESTS & NOTES */}
        <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-3">
          
          {/* Daily Quests */}
          <motion.section {...fadeIn} transition={{ delay: 0.2 }} className="min-w-0 space-y-2" aria-labelledby="daily-quests-heading">
            <div className="flex items-center justify-between px-1">
              <h2 id="daily-quests-heading" className="flex min-w-0 items-center gap-2 text-base font-bold text-foreground">
                 Daily Quests <Target className="text-primary" size={16} />
              </h2>
              <button
                onClick={fetchDashboardChallenges}
                className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                aria-label="Refresh daily quests"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-2">
              {pendingAssignments.length > 0 && (
                <div className="space-y-3">
                  {pendingAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="glass-panel flex min-w-0 items-center justify-between gap-2 rounded-xl p-3 transition-all hover:border-[#7C3AED]/50"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                          <ClipboardList className="text-[#7C3AED]" size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">
                            {assignment.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {assignment.mentor?.name || "Mentor"}
                            {assignment.dueDate
                              ? ` - Due ${formatSessionDate(assignment.dueDate)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.location.href = "/dashboard/focus-rooms"}
                        className="bg-[#7C3AED] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-purple-500/20 hover:opacity-90 transition-opacity"
                      >
                        Start
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {visibleChallenges.map((challenge) => {
                const Icon = challenge.type === "weekly" ? BookMarked : Timer;
                const progressPct = Math.min(
                  100,
                  Math.max(0, Number(challenge.progress.percentage || 0))
                );
                const canClaim =
                  challenge.progress.isCompleted &&
                  !challenge.progress.isClaimed &&
                  !challenge.isLocked;

                return (
                  <article
                    key={challenge.id}
                    className="glass-panel group rounded-xl p-3 transition-all hover:border-primary/50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 transition-transform group-hover:scale-105">
                          <Icon className="text-[#7C3AED]" size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-sm text-foreground">
                            {challenge.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {Number(challenge.progress.currentValue || 0).toLocaleString()} /{" "}
                            {Number(challenge.targetMetric || 0).toLocaleString()} · +
                            {Number(challenge.xpReward || 0).toLocaleString()} XP
                          </p>
                        </div>
                      </div>

                      {challenge.isLocked ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                          <Lock size={12} /> Locked
                        </div>
                      ) : challenge.progress.isClaimed ? (
                        <span className="rounded-lg bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-500">
                          Claimed
                        </span>
                      ) : canClaim ? (
                        <button
                          onClick={() => void handleClaimChallenge(challenge)}
                          disabled={claimingChallengeId === challenge.id}
                          className="bg-[#7C3AED] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-700 disabled:opacity-60 transition-colors"
                          aria-label={`Claim reward for ${challenge.title}`}
                        >
                          {claimingChallengeId === challenge.id ? "Claiming" : "Claim"}
                        </button>
                      ) : (
                        <Link
                          href="/dashboard/challenges"
                          className="bg-primary/10 text-primary px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all"
                          aria-label={`Continue ${challenge.title}`}
                        >
                          Resume
                        </Link>
                      )}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[#7C3AED] transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </article>
                );
              })}

              {visibleChallenges.length === 0 && pendingAssignments.length === 0 && (
                <div className="glass-panel rounded-2xl p-5 text-sm text-muted-foreground">
                  Your active quests and assignments will appear here.
                </div>
              )}
            </div>
          </motion.section>

          {/* AI Notes Carousel - SCROLLBAR HIDDEN */}
          <motion.section {...fadeIn} transition={{ delay: 0.3 }} className="tour-ai-studio min-w-0 space-y-2 xl:col-span-2" aria-labelledby="recent-ai-notes-heading">
            <div className="tour-focus-room">
              <MinimalTodoList compact />
            </div>

            <div className="flex min-w-0 items-center justify-between gap-3 px-1">
              <h2 id="recent-ai-notes-heading" className="flex min-w-0 items-center gap-2 text-base font-bold text-foreground">
                Recent AI Notes <Sparkles className="text-primary" size={16} />
              </h2>
              <button className="flex items-center gap-1 text-primary text-sm font-bold hover:gap-2 transition-all">
                See All <ArrowRight size={16} />
              </button>
            </div>

            <div className="-mx-2 flex min-w-0 gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {recentNotes.map((note) => {
                const meta = noteTypeMeta[note.type];
                const Icon = meta.icon;
                return (
                <article key={note._id} className="glass-panel group relative w-44 shrink-0 cursor-pointer overflow-hidden rounded-xl p-3 transition-all hover:-translate-y-1">
                  <div className={`relative mb-2 flex h-16 items-center justify-center overflow-hidden rounded-lg bg-[#7C3AED] shadow-inner ${meta.gradient}`}>
                    <div className="absolute inset-0 bg-black/10" />
                    <Icon className="text-white/60 transition-transform duration-500 group-hover:scale-110" size={30} />
                  </div>
                  <h3 className="mb-1 line-clamp-1 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                    {note.title}
                  </h3>
                  <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {meta.label}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground">{formatRelativeTime(note.createdAt)}</p>
                  </div>
                </article>
              )})}
              {recentNotes.length === 0 && (
                <div className="glass-panel w-48 shrink-0 rounded-2xl p-4 text-sm text-muted-foreground">
                  Your latest AI notes will appear here.
                </div>
              )}
            </div>
          </motion.section>

        </div>

        {/* SECTION 3: MENTORSHIP REVIEWS */}
        <motion.section {...fadeIn} transition={{ delay: 0.4 }} className="min-w-0 space-y-2" aria-labelledby="past-sessions-heading">
          <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="past-sessions-heading" className="flex min-w-0 items-center gap-2 text-base font-bold text-foreground">
                Past Sessions <Star className="text-yellow-400" size={16} />
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
            <div className="glass-panel rounded-2xl p-4 text-sm text-muted-foreground">
              Past mentor sessions will show here once they are completed.
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
              {reviewableSessions.slice(0, 4).map((session) => {
                const mentor = getMentor(session);
                const mentorName = getMentorName(session);

                return (
                  <article
                    key={session._id}
                    className="glass-panel flex min-w-0 items-center gap-3 rounded-xl p-3 transition-all hover:border-primary/40"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#7C3AED] to-violet-400 text-white shadow-sm">
                          {mentor.image ? (
                            <Image
                              src={mentor.image}
                              alt={`${mentorName}, session Mentor`}
                              width={56}
                              height={56}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Users size={22} aria-hidden="true" />
                          )}
                    </div>
                    <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-bold text-foreground">
                            {session.subject}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            with {mentorName}
                          </p>
                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                            {formatSessionDate(session.scheduledAt)} -{" "}
                            {formatSessionTime(session.scheduledAt)}
                          </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="rounded-full border border-border/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        {session.status}
                      </span>
                      {session.reviewSubmitted ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckSquare size={16} />
                          Reviewed
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedReviewSession(session)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#7C3AED] bg-white px-3 py-1.5 text-xs font-bold text-[#7C3AED] shadow-sm transition-colors hover:bg-purple-50 active:scale-95 dark:bg-transparent dark:hover:bg-purple-500/10"
                        >
                          <Star size={16} className="fill-purple-600 text-purple-600" />
                          Leave Review
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </motion.section>
      </main>

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

