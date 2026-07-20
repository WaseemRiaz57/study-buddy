"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { 
  BookOpen, Clock,
  Calendar, FileText,
  BarChart3, Wallet, CreditCard, Star,
  Coins,
  Loader2,
  Zap
} from "lucide-react";
import RequestApprovalModal, {
  type StudentRequestData,
} from "@/components/modals/RequestApprovalModal";
import { UserAvatar } from "@/components/mentorship/UserAvatar";

// 👇 DYNAMIC DATA OBJECT (Ready for Backend Integration)
// 👇 DYNAMIC DATA OBJECT (Updated with Modal Details)
const MENTOR_DATA = {
  profile: {
    role: "Senior Mentor",
    xp: 8450,
    maxXp: 10000,
    gold: 1200,
    rating: 4.9,
    totalStudents: 120,
    sessionHours: 450,
    studentGrowth: 12,
    hoursGrowth: 5,
  },
  earnings: {
    week: 420.00,
    balance: 1200,
    fees: 42.00,
    nextPayout: "Friday, Oct 27"
  },
  requests: [
    { 
      id: 1, 
      name: "Alex J.", 
      subject: "Advanced Calculus", 
      tags: ["Exam Prep", "60 mins"], 
      time: "15m ago", 
      initials: "AJ",
      // 👇 Modal ke liye naya data
      tagline: "Seeking wisdom to unravel the mysteries of the vector space.",
      focusScore: 88,
      subjects: [
        { subject: "Calculus II", grade: "A-", progress: 92 },
        { subject: "Physics", grade: "B+", progress: 85 }
      ],
      personalMessage: "I am struggling with Linear Algebra concepts, specifically eigenvalues, and I need your guidance to reach the Sage rank. Your approach to abstract concepts really resonates with my learning style."
    },
    { 
      id: 2, 
      name: "Sarah K.", 
      subject: "UI Design Principles", 
      tags: ["Project Review", "45 mins"], 
      time: "1h ago", 
      initials: "SK",
      // 👇 Modal ke liye naya data
      tagline: "Aspiring designer looking for pixel-perfect guidance.",
      focusScore: 94,
      subjects: [
        { subject: "UI/UX Design", grade: "A", progress: 96 },
        { subject: "Web Development", grade: "A-", progress: 88 }
      ],
      personalMessage: "Could you review my latest Figma prototype? I want to make sure the user flow makes sense before I start coding."
    },
    { 
      id: 3, 
      name: "Marcus T.", 
      subject: "Python Fundamentals", 
      tags: ["Debug Help", "30 mins"], 
      time: "3h ago", 
      initials: "MT",
      // 👇 Modal ke liye naya data
      tagline: "Debugging my way through life.",
      focusScore: 76,
      subjects: [
        { subject: "Python", grade: "C+", progress: 65 },
        { subject: "Data Structures", grade: "B-", progress: 72 }
      ],
      personalMessage: "I keep getting a RecursionError in my binary tree traversal. Can we hop on a quick call to go over it?"
    },
  ]
};

interface MentorDashboardStats {
  totalEarnings: number;
  rating: number;
  uniqueStudentsTaught: number;
  upcomingSessions: number;
}

interface PopulatedStudent {
  _id?: string;
  name?: string;
  image?: string;
  email?: string;
}

interface MentorRequest {
  _id: string;
  studentId?: PopulatedStudent | string;
  subject: string;
  scheduledAt: string;
  duration: number;
  type?: "scheduled" | "instant";
  createdAt?: string;
  status?:
    | "pending"
    | "accepted"
    | "payment_pending"
    | "payment_verified"
    | "declined"
    | "rejected"
    | "completed";
  roomId?: string;
}

type RequestAction = "accepted" | "declined";

interface RecentQuizGeneration {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  questionType: "mcq" | "short" | "long";
  questionCount: number;
  createdAt: string;
}

interface MentorAnalyticsPoint {
  label: string;
  value: number;
}

interface MentorAnalytics {
  hasData: boolean;
  avgStudentScore: number;
  delta: number;
  points: MentorAnalyticsPoint[];
}

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

function getStudentDetails(request: MentorRequest): PopulatedStudent {
  return typeof request.studentId === "object" && request.studentId !== null
    ? request.studentId
    : {};
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRequestedTime(value?: string) {
  if (!value) return "Requested recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Requested recently";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatSessionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time TBD";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toModalStudentData(request: MentorRequest): StudentRequestData {
  const student = getStudentDetails(request);
  const studentName = student.name || "Student";

  return {
    name: studentName,
    initials: getInitials(studentName) || "ST",
    tagline: `Requested help with ${request.subject}`,
    focusScore: 88,
    subjects: [
      {
        subject: request.subject,
        grade: "In Progress",
        percent: 80,
      },
    ],
    personalMessage: `This student requested a ${request.duration}-minute mentorship session for ${request.subject}.`,
  };
}

function buildPerformancePath(points: MentorAnalyticsPoint[]) {
  const values = points.length ? points : Array.from({ length: 7 }, (_, index) => ({
    label: String(index + 1),
    value: 0,
  }));
  const maxIndex = Math.max(values.length - 1, 1);

  return values
    .map((point, index) => {
      const x = (index / maxIndex) * 100;
      const y = 95 - (Math.max(0, Math.min(100, point.value)) / 100) * 85;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildPerformanceArea(points: MentorAnalyticsPoint[]) {
  const path = buildPerformancePath(points);
  return `${path} L100,100 L0,100 Z`;
}

export function MentorDashboard() {
  const { data: session, status } = useSession();
  const { profile, earnings } = MENTOR_DATA;
  const mentorName = session?.user?.name || "Mentor";
  const mentorRole = session?.user?.role
    ? `${session.user.role.charAt(0).toUpperCase()}${session.user.role.slice(1).toLowerCase()}`
    : profile.role;
  
  // 👇 MODAL STATE ADDED
  const [stats, setStats] = useState<MentorDashboardStats>({
    totalEarnings: 0,
    rating: 0,
    uniqueStudentsTaught: 0,
    upcomingSessions: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [requests, setRequests] = useState<MentorRequest[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<MentorRequest[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(true);
  const [respondingActionKey, setRespondingActionKey] = useState("");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StudentRequestData | null>(null);
  const [recentQuizzes, setRecentQuizzes] = useState<RecentQuizGeneration[]>([]);
  const [isRecentQuizzesLoading, setIsRecentQuizzesLoading] = useState(true);
  const [analytics, setAnalytics] = useState<MentorAnalytics>({
    hasData: false,
    avgStudentScore: 0,
    delta: 0,
    points: Array.from({ length: 7 }, (_, index) => ({
      label: ["M", "T", "W", "T", "F", "S", "S"][index],
      value: 0,
    })),
  });
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);

  // 👇 FUNCTION TO HANDLE CLICK
  useEffect(() => {
    let isActive = true;

    async function fetchAnalytics() {
      try {
        setIsAnalyticsLoading(true);
        const response = await fetch("/api/mentor/analytics", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load mentor analytics.");
        }

        const data = (await response.json()) as MentorAnalytics;

        if (isActive) {
          setAnalytics({
            hasData: Boolean(data.hasData),
            avgStudentScore: Number(data.avgStudentScore || 0),
            delta: Number(data.delta || 0),
            points: Array.isArray(data.points) && data.points.length
              ? data.points.map((point) => ({
                  label: point.label || "",
                  value: Number(point.value || 0),
                }))
              : Array.from({ length: 7 }, (_, index) => ({
                  label: ["M", "T", "W", "T", "F", "S", "S"][index],
                  value: 0,
                })),
          });
        }
      } catch {
        if (isActive) {
          setAnalytics((current) => ({
            ...current,
            hasData: false,
            avgStudentScore: 0,
            delta: 0,
          }));
        }
      } finally {
        if (isActive) {
          setIsAnalyticsLoading(false);
        }
      }
    }

    void fetchAnalytics();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function fetchStats() {
      try {
        setIsStatsLoading(true);
        const response = await fetch("/api/mentor/dashboard/stats");

        if (!response.ok) {
          throw new Error("Failed to load mentor stats.");
        }

        const data = (await response.json()) as MentorDashboardStats;

        if (isActive) {
          setStats({
            totalEarnings: Number(data.totalEarnings ?? 0),
            rating: Number(data.rating ?? 0),
            uniqueStudentsTaught: Number(data.uniqueStudentsTaught ?? 0),
            upcomingSessions: Number(data.upcomingSessions ?? 0),
          });
        }
      } catch (error) {
        if (isActive) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load mentor stats."
          );
        }
      } finally {
        if (isActive) {
          setIsStatsLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function fetchRecentQuizzes() {
      try {
        setIsRecentQuizzesLoading(true);
        const response = await fetch("/api/ai/recent-quizzes?limit=3", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();

        if (isActive) {
          setRecentQuizzes(Array.isArray(data?.quizzes) ? data.quizzes : []);
        }
      } catch {
        if (isActive) {
          setRecentQuizzes([]);
        }
      } finally {
        if (isActive) {
          setIsRecentQuizzesLoading(false);
        }
      }
    }

    void fetchRecentQuizzes();
    window.addEventListener("ai-notes-updated", fetchRecentQuizzes);

    return () => {
      isActive = false;
      window.removeEventListener("ai-notes-updated", fetchRecentQuizzes);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function fetchRequests() {
      try {
        setIsRequestsLoading(true);
        const response = await fetch("/api/mentor/requests");

        if (!response.ok) {
          throw new Error("Failed to load session requests.");
        }

        const data = (await response.json()) as MentorRequest[];

        if (isActive) {
          setRequests(data);
        }
      } catch (error) {
        if (isActive) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load session requests."
          );
        }
      } finally {
        if (isActive) {
          setIsRequestsLoading(false);
        }
      }
    }

    fetchRequests();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function fetchUpcomingSessions() {
      try {
        const response = await fetch("/api/mentor/sessions", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as MentorRequest[];

        if (isActive) {
          setUpcomingSessions(
            data.filter((mentorSession) => mentorSession.status === "payment_verified")
          );
        }
      } catch {
        // Keep the dashboard usable if this compact list cannot load.
      }
    }

    void fetchUpcomingSessions();

    return () => {
      isActive = false;
    };
  }, []);

  const handleOpenRequest = (request: MentorRequest) => {
    setSelectedRequest(toModalStudentData(request));
    setIsRequestModalOpen(true);
  };

  const handleRespond = async (requestId: string, nextStatus: RequestAction) => {
    const nextActionKey = `${requestId}-${nextStatus}`;

    try {
      setRespondingActionKey(nextActionKey);

      const response = await fetch(`/api/sessions/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Failed to respond to session.");
      }

      setRequests((currentRequests) =>
        currentRequests.filter((request) => request._id !== requestId)
      );

      if (nextStatus === "accepted") {
        toast.success("Session accepted. Awaiting student payment.");
      } else {
        toast.success("Session Declined.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to respond to session."
      );
    } finally {
      setRespondingActionKey("");
    }
  };

  const statValue = (value: number, suffix = "") =>
    isStatsLoading ? "..." : `${value.toLocaleString()}${suffix}`;
  const displayRating = isStatsLoading ? "..." : stats.rating.toFixed(1);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* MAIN CONTENT */}
      <main className="app-page mx-auto min-w-0 max-w-screen-2xl space-y-3" aria-label="Mentor dashboard">
        
        {/* Welcome Section */}
        <section className="tour-dashboard-overview min-w-0 space-y-3" aria-labelledby="mentor-dashboard-heading">
          <header className="flex min-w-0 items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 id="mentor-dashboard-heading" className="truncate text-lg font-bold text-foreground">
                {status === "loading" ? "Welcome back" : `Welcome back, ${mentorName}`}
              </h1>
              <p className="text-sm text-muted-foreground">You have {requests.length} new session requests and a payout ready.</p>
              <p className="text-xs text-muted-foreground mt-1">Role: {mentorRole}</p>
            </div>
            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-sm text-muted-foreground">Local Time</p>
              <p className="text-lg font-medium text-foreground">10:42 AM, Oct 24</p>
            </div>
          </header>

          {/* Impact Stats */}
          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
            <motion.article {...fadeIn} className="glass-panel min-w-0 rounded-xl border-l-4 border-l-blue-500 p-3">
              <p className="mb-1 text-xs text-muted-foreground">Total Students Taught</p>
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-xl font-black tabular-nums text-blue-500">
                  {statValue(stats.uniqueStudentsTaught)}
                </span>
              </div>
            </motion.article>

            <motion.article {...fadeIn} transition={{ delay: 0.1 }} className="glass-panel min-w-0 rounded-xl border-l-4 border-l-purple-500 p-3">
              <p className="mb-1 text-xs text-muted-foreground">Upcoming Sessions</p>
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-xl font-black tabular-nums text-purple-500">
                  {statValue(stats.upcomingSessions)}
                </span>
              </div>
            </motion.article>

            <motion.article {...fadeIn} transition={{ delay: 0.2 }} className="glass-panel min-w-0 rounded-xl border-l-4 border-l-yellow-500 p-3">
              <p className="mb-1 text-xs text-muted-foreground">Mentor Rating</p>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-xl font-black tabular-nums text-yellow-500">{displayRating}<span className="text-base font-light text-muted-foreground/50">/5</span></span>
                <div className="flex shrink-0 text-yellow-500">
                  {[1,2,3,4,5].map((i) => (
                    <Star
                      key={i}
                      size={16}
                      fill="currentColor"
                      className={stats.rating >= i ? "" : "opacity-30"}
                    />
                  ))}
                </div>
              </div>
            </motion.article>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid min-w-0 grid-cols-1 items-start gap-3 xl:grid-cols-12">
          
          {/* LEFT: Session Requests */}
          <section className="min-w-0 space-y-3 xl:col-span-4" aria-labelledby="session-requests-heading">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <h2 id="session-requests-heading" className="flex min-w-0 items-center gap-2 text-lg font-bold text-foreground">
                <Clock className="text-[#7C3AED]" size={20} />
                Session Requests
              </h2>
              <span className="px-2.5 py-1 bg-purple-100 text-[#7C3AED] text-xs font-bold rounded-full dark:bg-purple-500/15">{requests.length} NEW</span>
            </div>

            {/* Request Cards */}
            <div className="min-w-0 space-y-2 xl:max-h-[24rem] xl:overflow-y-auto xl:pr-1">
              {isRequestsLoading && (
                <div className="glass-panel p-5 rounded-2xl text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  Loading session requests...
                </div>
              )}

              {!isRequestsLoading && requests.length === 0 && (
                <div className="glass-panel p-5 rounded-2xl text-sm text-muted-foreground">
                  No pending session requests yet.
                </div>
              )}

              {!isRequestsLoading && requests.map((request, i) => {
                const student = getStudentDetails(request);
                const studentName = student.name || "Student";
                const acceptingKey = `${request._id}-accepted`;
                const decliningKey = `${request._id}-declined`;
                const isResponding = respondingActionKey.startsWith(`${request._id}-`);
                const isInstantRequest = request.type === "instant";

                return (
                  <motion.article
                    key={request._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className={`glass-panel min-w-0 cursor-pointer rounded-xl p-3 transition-all hover:border-primary/30 ${
                      isInstantRequest ? "border-[#7C3AED]/50 ring-1 ring-[#7C3AED]/20" : ""
                    }`}
                    onClick={() => handleOpenRequest(request)}
                  >
                    {isInstantRequest && (
                      <div className="mb-3 inline-flex animate-pulse items-center gap-1.5 rounded-full bg-[#7C3AED] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                        <Zap size={12} fill="currentColor" />
                        URGENT: INSTANT SESSION
                      </div>
                    )}
                    <div className="mb-3 flex min-w-0 items-start gap-3">
                      <UserAvatar
                        name={studentName}
                        imageUrl={student.image || null}
                        size="lg"
                        className="rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate">{studentName}</h4>
                        <p className="mb-2 truncate text-xs text-muted-foreground">{request.subject}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] px-2 py-0.5 bg-muted rounded font-bold uppercase text-muted-foreground">
                            {formatSessionTime(request.scheduledAt)}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-muted rounded font-bold uppercase text-muted-foreground">
                            {request.duration} mins
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                        {formatRequestedTime(request.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex min-w-0 gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRespond(request._id, "accepted");
                        }}
                        disabled={isResponding}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#7C3AED] py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {respondingActionKey === acceptingKey ? <Loader2 size={14} className="animate-spin" /> : null}
                        Accept
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRespond(request._id, "declined");
                        }}
                        disabled={isResponding}
                        className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-xs font-bold text-muted-foreground transition-all hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-white/5"
                      >
                        {respondingActionKey === decliningKey ? <Loader2 size={14} className="animate-spin" /> : null}
                        Decline
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Upcoming Rooms
              </h4>
              {upcomingSessions.length === 0 ? (
                <div className="glass-panel p-4 rounded-2xl text-sm text-muted-foreground">
                  Payment-verified sessions will appear here.
                </div>
              ) : (
                upcomingSessions.slice(0, 3).map((mentorSession) => {
                  const student = getStudentDetails(mentorSession);
                  const studentName = student.name || "Student";

                  return (
                    <article
                      key={mentorSession._id}
                    className="glass-panel min-w-0 rounded-xl p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">
                          {mentorSession.subject}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {studentName} · {formatSessionTime(mentorSession.scheduledAt)}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/study-rooms/${mentorSession._id}`}
                        className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[#7C3AED] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-purple-700"
                      >
                        Join Room
                      </Link>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* MIDDLE: Performance Chart */}
          <section className="min-w-0 space-y-3 xl:col-span-5" aria-labelledby="performance-heading">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <h2 id="performance-heading" className="flex min-w-0 items-center gap-2 text-lg font-bold text-foreground">
                <BarChart3 className="text-blue-500" size={20} />
                Performance
              </h2>
              <select className="bg-transparent border-none text-xs font-bold text-muted-foreground focus:ring-0 cursor-pointer">
                <option>This Week</option>
                <option>Last Month</option>
              </select>
            </div>

            <motion.article {...fadeIn} transition={{ delay: 0.4 }} className="glass-panel flex min-h-[250px] min-w-0 flex-col rounded-xl p-4">
              <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Avg. Student Score</p>
                  <p className="text-xl font-bold tabular-nums text-foreground">
                    {isAnalyticsLoading
                      ? "..."
                      : `${analytics.avgStudentScore.toFixed(1)}%`}
                    {!isAnalyticsLoading && analytics.hasData && (
                      <span
                        className={`ml-1 text-xs font-medium ${
                          analytics.delta >= 0 ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {analytics.delta >= 0 ? "+" : ""}
                        {analytics.delta.toFixed(1)}%
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-medium text-muted-foreground">Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                    <span className="text-xs font-medium text-muted-foreground">Avg.</span>
                  </div>
                </div>
              </div>

              {/* Chart Area */}
              <div className="flex-1 relative flex items-end pb-6">
                <div className="absolute inset-0 flex flex-col justify-between py-1">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-full border-t border-border/30"></div>
                  ))}
                </div>

                {!isAnalyticsLoading && !analytics.hasData && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <p className="rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-semibold text-muted-foreground backdrop-blur">
                      Not enough data yet
                    </p>
                  </div>
                )}
                
                {/* SVG Chart */}
                <div className="w-full h-full relative z-10">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" className="text-[#7C3AED]" stopOpacity="0.14" />
                        <stop offset="100%" stopColor="currentColor" className="text-[#7C3AED]" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={buildPerformanceArea(analytics.points)} fill="url(#chartGradient)" />
                    <path
                      d={buildPerformancePath(analytics.points)}
                      fill="none"
                      stroke="currentColor"
                      className="text-[#7C3AED]"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Day Labels */}
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                {analytics.points.map((point, i) => (
                  <span key={`${point.label}-${i}`}>{point.label}</span>
                ))}
              </div>
            </motion.article>
          </section>

          {/* RIGHT: Earnings & Actions */}
          <aside className="min-w-0 space-y-3 xl:col-span-3" aria-labelledby="earnings-heading">
            <div className="flex min-w-0 items-center justify-between">
              <h2 id="earnings-heading" className="flex min-w-0 items-center gap-2 text-lg font-bold text-foreground">
                <Wallet className="text-blue-500" size={20} />
                Earnings
              </h2>
            </div>

            <motion.article {...fadeIn} transition={{ delay: 0.5 }} className="glass-panel min-w-0 rounded-xl p-3">
              <div className="mb-3 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                <div className="flex min-w-0 flex-wrap items-baseline gap-1">
                  <span className="min-w-0 text-xl font-black tabular-nums text-foreground">
                    {isStatsLoading ? "$..." : `$${stats.totalEarnings.toFixed(2)}`}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">USD</span>
                </div>
              </div>

              <div className="mb-3 min-w-0 space-y-2">
                <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border/50 pb-2 text-xs">
                  <span className="text-muted-foreground">Next Payout</span>
                  <span className="font-bold text-foreground">{earnings.nextPayout}</span>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border/50 pb-2 text-xs">
                  <span className="text-muted-foreground">Gold Balance</span>
                  <div className="flex items-center gap-1 font-bold text-yellow-600 dark:text-yellow-400">
                    <Coins size={14} /> {earnings.balance.toLocaleString()}
                  </div>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">Platform Fees</span>
                  <span className="font-bold text-muted-foreground">-${earnings.fees.toFixed(2)}</span>
                </div>
              </div>

              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-2.5 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:shadow-blue-500/40">
                <CreditCard size={18} />
                Request Payout
              </button>
              
              <p className="text-center text-[10px] text-muted-foreground mt-3">Funds usually arrive in 1-3 business days.</p>
            </motion.article>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Actions</h4>
              <div className="grid min-w-0 grid-cols-2 gap-2">
                <button className="glass-panel group flex min-w-0 flex-col items-center gap-2 rounded-xl p-3 transition-all hover:border-blue-500/50 hover:bg-blue-500/5">
                  <Calendar className="text-blue-500 group-hover:scale-110 transition-transform" size={20} />
                  <span className="text-xs font-bold text-foreground">Reschedule</span>
                </button>
                <button className="glass-panel group flex min-w-0 flex-col items-center gap-2 rounded-xl p-3 transition-all hover:border-purple-500/50 hover:bg-purple-500/5">
                  <FileText className="text-purple-500 group-hover:scale-110 transition-transform" size={20} />
                  <span className="text-xs font-bold text-foreground">Create Task</span>
                </button>
              </div>
            </div>

            <div className="tour-ai-studio space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Recent Quiz Generations
              </h4>
              <div className="glass-panel min-w-0 rounded-xl p-3">
                {isRecentQuizzesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin text-[#7C3AED]" />
                    Loading quizzes...
                  </div>
                ) : recentQuizzes.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Generated quizzes will appear here after you use AI Studio.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentQuizzes.map((quiz) => (
                      <Link
                        key={quiz.id}
                        href="/dashboard/content-generator"
                        className="block min-w-0 rounded-xl border border-border/50 bg-background/50 p-3 transition-colors hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/5"
                      >
                        <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
                          <p className="min-w-0 truncate text-sm font-bold text-foreground">
                            {quiz.title}
                          </p>
                          <span className="rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#7C3AED]">
                            {quiz.questionType === "mcq"
                              ? "MCQ"
                              : quiz.questionType === "short"
                                ? "Short"
                                : "Long"}
                          </span>
                        </div>
                        <p className="text-xs capitalize text-muted-foreground">
                          {quiz.difficulty} - {quiz.questionCount} questions
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-3 border-t border-border/50 px-4 py-2">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-1 flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
              <BookOpen className="text-primary" size={14} />
            </div>
            <span className="font-bold text-muted-foreground text-sm">StudyBuddy Mentor Network</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 StudyBuddy Education Inc. All sessions are monitored for quality assurance.</p>
        </div>
      </footer>

      {/* 👇 MODAL RENDERED HERE */}
      {selectedRequest && (
        <RequestApprovalModal 
          isOpen={isRequestModalOpen} 
          onClose={() => setIsRequestModalOpen(false)} 
          studentData={selectedRequest} 
        />
      )}

    </div>
  );
}

