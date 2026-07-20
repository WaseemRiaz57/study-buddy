"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  CalendarCheck,
  Clock,
  CreditCard,
  Inbox,
  Loader2,
  User,
  Zap,
} from "lucide-react";
import PaymentModal, {
  type PaymentSession,
} from "@/components/mentorship/PaymentModal";
import ReviewModal from "@/components/mentorship/ReviewModal";

type SessionStatus =
  | "pending"
  | "accepted"
  | "payment_pending"
  | "payment_verified"
  | "active"
  | "completed"
  | "declined"
  | "rejected";

type PopulatedMentor = {
  _id?: string;
  name?: string;
  image?: string;
  email?: string;
};

type MentorProfileSummary = {
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  hourlyRate?: number;
};

type StudentSession = {
  _id: string;
  mentorId?: PopulatedMentor | string;
  mentorProfile?: MentorProfileSummary | null;
  subject: string;
  scheduledAt: string;
  startTime?: string;
  duration: number;
  type?: "scheduled" | "instant";
  status: SessionStatus;
  roomId?: string;
  paymentReceipt?: string;
  reviewSubmitted?: boolean;
  isSessionStarted?: boolean;
  actualStartTime?: string;
};

function getMentor(session: StudentSession): PopulatedMentor {
  return typeof session.mentorId === "object" && session.mentorId !== null
    ? session.mentorId
    : {};
}

function getMentorName(session: StudentSession) {
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


function getSessionStartTime(session: StudentSession) {
  return session.actualStartTime || session.startTime || session.scheduledAt;
}

function isSessionExpired(session: StudentSession, currentTime: number) {
  if (!session.isSessionStarted || !session.actualStartTime) return false;

  const start = new Date(session.actualStartTime).getTime();

  if (!Number.isFinite(start)) return false;

  const durationMs = Math.max(1, Number(session.duration || 60)) * 60 * 1000;
  const expiration = start + durationMs;
  return currentTime > expiration;
}

function statusLabel(status: SessionStatus) {
  const labels: Record<SessionStatus, string> = {
    pending: "Awaiting Mentor Acceptance",
    accepted: "Awaiting Payment",
    payment_pending: "Verifying Payment...",
    payment_verified: "Ready to Join",
    active: "Active",
    completed: "Completed",
    declined: "Declined",
    rejected: "Rejected",
  };

  return labels[status];
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-black text-slate-950 dark:text-white">
          {title}
        </h2>
        <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-black text-[#7C3AED]">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

function SessionCard({
  session,
  onPay,
  onReview,
  currentTime,
}: {
  session: StudentSession;
  onPay: (session: StudentSession) => void;
  onReview: (session: StudentSession) => void;
  currentTime: number;
}) {
  const mentor = getMentor(session);
  const mentorName = getMentorName(session);
  const initials = getInitials(mentorName) || "MT";
  const expired = isSessionExpired(session, currentTime);
  const showEndedBadge = expired && session.status !== "completed";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-surface-dark">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#7C3AED] text-sm font-black text-white">
          {mentor.image ? (
            <Image
              src={mentor.image}
              alt={mentorName}
              width={48}
              height={48}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-slate-950 dark:text-white">
                {session.subject}
              </h3>
              <p className="truncate text-sm text-slate-500">
                with {mentorName}
              </p>
            </div>
            <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-black text-[#7C3AED]">
              {showEndedBadge ? "Session Ended" : statusLabel(session.status)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4 text-[#7C3AED]" />
            {formatSessionTime(getSessionStartTime(session))}
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {session.duration} mins
            </span>
            {session.type === "instant" && (
              <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-xs font-black text-[#7C3AED]">
                <Zap className="h-3 w-3" fill="currentColor" />
                Instant
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {showEndedBadge && (
          <span className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-500">
            Session Ended
          </span>
        )}

        {!expired && session.status === "pending" && (
          <span className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-2.5 text-sm font-bold text-[#7C3AED]">
            Awaiting Mentor Acceptance
          </span>
        )}

        {!expired && session.status === "accepted" && (
          <button
            type="button"
            onClick={() => onPay(session)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-purple-700"
          >
            Pay to Join
          </button>
        )}

        {!expired && session.status === "payment_pending" && (
          <span className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-2.5 text-sm font-bold text-[#7C3AED]">
            Verifying Payment...
          </span>
        )}

        {!expired && (session.status === "payment_verified" || session.status === "active") && (
          session.isSessionStarted ? (
            <Link
              href={`/dashboard/study-rooms/${session._id}`}
              className="inline-flex items-center justify-center rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-purple-700"
            >
              Join Room
            </Link>
          ) : (
            <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700">
              Waiting for Mentor to start...
            </span>
          )
        )}

        {session.status === "completed" && !session.reviewSubmitted && (
          <button
            type="button"
            onClick={() => onReview(session)}
            className="inline-flex items-center justify-center rounded-xl border border-[#7C3AED] px-4 py-2.5 text-sm font-black text-[#7C3AED] transition-colors hover:bg-purple-50"
          >
            Leave Review
          </button>
        )}

        {session.status === "completed" && session.reviewSubmitted && (
          <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-500">
            Review submitted
          </span>
        )}
      </div>
    </article>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-surface-dark">
      <Inbox className="mx-auto mb-3 h-8 w-8 text-[#7C3AED] opacity-30" />
      {label}
    </div>
  );
}

export default function MentorshipActivitiesHub() {
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [paymentSession, setPaymentSession] = useState<StudentSession | null>(
    null
  );
  const [reviewSession, setReviewSession] = useState<StudentSession | null>(
    null
  );

  const fetchSessions = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const response = await fetch("/api/sessions/student", {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Could not load mentorship sessions.");
      }

      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load mentorship sessions."
      );
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const refreshSessions = () => {
      void fetchSessions(false);
    };

    window.addEventListener("student-session-invited", refreshSessions);
    window.addEventListener("mentor-session-started", refreshSessions);
    return () => {
      window.removeEventListener("student-session-invited", refreshSessions);
      window.removeEventListener("mentor-session-started", refreshSessions);
    };
  }, [fetchSessions]);

  const groupedSessions = useMemo(() => {
    const sorted = [...sessions].sort(
      (first, second) =>
        new Date(second.scheduledAt).getTime() -
        new Date(first.scheduledAt).getTime()
    );

    return {
      activeRequests: sorted.filter(
        (session) =>
          session.status === "pending" &&
          !isSessionExpired(session, currentTime)
      ),
      awaitingPayment: sorted.filter((session) =>
        ["accepted", "payment_pending"].includes(session.status) &&
        !isSessionExpired(session, currentTime)
      ),
      upcomingSessions: sorted.filter(
        (session) =>
          (session.status === "payment_verified" || session.status === "active") &&
          !isSessionExpired(session, currentTime)
      ),
      pastSessions: sorted.filter(
        (session) =>
          ["completed", "declined", "rejected"].includes(session.status) ||
          isSessionExpired(session, currentTime)
      ),
    };
  }, [currentTime, sessions]);

  function handlePaymentUploaded(updatedSession: unknown) {
    if (!updatedSession || typeof updatedSession !== "object" || !("_id" in updatedSession)) {
      return;
    }

    setSessions((currentSessions) =>
      currentSessions.map((session) =>
        session._id === String(updatedSession._id)
          ? {
              ...session,
              ...(updatedSession as StudentSession),
              status: "payment_pending",
            }
          : session
      )
    );
  }

  function handleReviewSubmitted() {
    if (!reviewSession) return;

    setSessions((currentSessions) =>
      currentSessions.map((session) =>
        session._id === reviewSession._id
          ? { ...session, reviewSubmitted: true }
          : session
      )
    );
    setReviewSession(null);
    toast.success("Review submitted successfully!");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#7C3AED]">
              Mentorship
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Activities Hub
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Track requests, upload payment receipts, and join verified mentor
              sessions from one place.
            </p>
          </div>
          <Link
            href="/dashboard/mentorship/find"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-black text-white transition-colors hover:bg-purple-700"
          >
            Find a Mentor
          </Link>
        </header>

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-500 dark:border-white/10 dark:bg-surface-dark">
            <Loader2 className="h-4 w-4 animate-spin text-[#7C3AED]" />
            Loading mentorship activity...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-surface-dark">
                <User className="mb-3 h-5 w-5 text-[#7C3AED]" />
                <p className="text-2xl font-black text-slate-950 dark:text-white">
                  {groupedSessions.activeRequests.length}
                </p>
                <p className="text-sm text-slate-500">Active Requests</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-surface-dark">
                <CreditCard className="mb-3 h-5 w-5 text-[#7C3AED]" />
                <p className="text-2xl font-black text-slate-950 dark:text-white">
                  {groupedSessions.awaitingPayment.length}
                </p>
                <p className="text-sm text-slate-500">Awaiting Payment</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-surface-dark">
                <CalendarCheck className="mb-3 h-5 w-5 text-[#7C3AED]" />
                <p className="text-2xl font-black text-slate-950 dark:text-white">
                  {groupedSessions.upcomingSessions.length +
                    groupedSessions.pastSessions.length}
                </p>
                <p className="text-sm text-slate-500">Upcoming/Past Sessions</p>
              </div>
            </div>

            <Section
              title="Active Requests"
              count={groupedSessions.activeRequests.length}
            >
              {groupedSessions.activeRequests.length === 0 ? (
                <EmptyState label="No active mentor requests." />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {groupedSessions.activeRequests.map((session) => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      onPay={setPaymentSession}
                      onReview={setReviewSession}
                      currentTime={currentTime}
                    />
                  ))}
                </div>
              )}
            </Section>

            <Section
              title="Awaiting Payment"
              count={groupedSessions.awaitingPayment.length}
            >
              {groupedSessions.awaitingPayment.length === 0 ? (
                <EmptyState label="No sessions are waiting on payment." />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {groupedSessions.awaitingPayment.map((session) => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      onPay={setPaymentSession}
                      onReview={setReviewSession}
                      currentTime={currentTime}
                    />
                  ))}
                </div>
              )}
            </Section>

            <Section
              title="Upcoming Sessions"
              count={groupedSessions.upcomingSessions.length}
            >
              {groupedSessions.upcomingSessions.length === 0 ? (
                <EmptyState label="No verified sessions are ready to join." />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {groupedSessions.upcomingSessions.map((session) => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      onPay={setPaymentSession}
                      onReview={setReviewSession}
                      currentTime={currentTime}
                    />
                  ))}
                </div>
              )}
            </Section>

            <Section
              title="Past Sessions"
              count={groupedSessions.pastSessions.length}
            >
              {groupedSessions.pastSessions.length === 0 ? (
                <EmptyState label="Completed, declined, and expired sessions will appear here." />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {groupedSessions.pastSessions.map((session) => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      onPay={setPaymentSession}
                      onReview={setReviewSession}
                      currentTime={currentTime}
                    />
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </main>

      <PaymentModal
        isOpen={Boolean(paymentSession)}
        session={paymentSession as PaymentSession | null}
        onClose={() => setPaymentSession(null)}
        onUploaded={handlePaymentUploaded}
      />

      <ReviewModal
        isOpen={Boolean(reviewSession)}
        sessionId={reviewSession?._id || ""}
        mentorName={reviewSession ? getMentorName(reviewSession) : "Mentor"}
        subject={reviewSession?.subject || "Mentorship session"}
        onClose={() => setReviewSession(null)}
        onSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}
