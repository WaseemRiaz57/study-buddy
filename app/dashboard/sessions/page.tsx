"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  AlertTriangle,
  Loader2,
  Upload,
  User,
  X,
  Zap,
} from "lucide-react";
import ReviewModal from "@/components/mentorship/ReviewModal";
import { UserAvatar } from "@/components/mentorship/UserAvatar";
import { useGamificationStore } from "@/store/useGamificationStore";

type SessionStatus =
  | "pending"
  | "accepted"
  | "payment_pending"
  | "payment_verified"
  | "active"
  | "completed"
  | "declined"
  | "rejected";
type RequestAction = "accepted" | "declined";

type PopulatedUser = {
  _id?: string;
  name?: string;
  image?: string;
  profileImage?: string;
  email?: string;
};

type MentorProfileSummary = {
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  hourlyRate?: number;
};

type DashboardSession = {
  _id: string;
  student?: PopulatedUser | string;
  studentId?: PopulatedUser | string;
  mentorId?: PopulatedUser | string;
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
  actualStartTime?: string;
  mentorJoinedAt?: string;
  studentJoinedAt?: string;
  isSessionStarted?: boolean;
};

function getPopulatedUser(value?: PopulatedUser | string): PopulatedUser {
  return typeof value === "object" && value !== null ? value : {};
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

const JOINED_MENTOR_SESSIONS_STORAGE_KEY = "studybuddy:joined-mentor-sessions";

function getSessionStartTime(session: DashboardSession) {
  return session.actualStartTime || session.startTime || session.scheduledAt;
}

function isSessionExpired(session: DashboardSession, currentTime: number) {
  if (!session.isSessionStarted || !session.actualStartTime) return false;

  const start = new Date(session.actualStartTime).getTime();

  if (!Number.isFinite(start)) return false;

  const durationMs = Math.max(1, Number(session.duration || 60)) * 60 * 1000;
  const expiration = start + durationMs;
  return currentTime > expiration;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read receipt file."));
    reader.readAsDataURL(file);
  });
}

function StatusPill({ status }: { status: SessionStatus }) {
  const labelByStatus: Record<SessionStatus, string> = {
    pending: "Awaiting Mentor Acceptance",
    accepted: "Accepted",
    payment_pending: "Verifying Payment...",
    payment_verified: "Payment Verified",
    active: "Active",
    completed: "Completed",
    declined: "Declined",
    rejected: "Rejected",
  };

  return (
    <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-[#7C3AED]">
      {labelByStatus[status]}
    </span>
  );
}

function Avatar({
  user,
  fallback,
}: {
  user: PopulatedUser;
  fallback: string;
}) {
  const name = user.name || fallback;
  const imageSrc = user.profileImage || user.image || "";

  return <UserAvatar name={name} imageUrl={imageSrc || null} size="lg" />;
}

function StudentSessionCard({
  session,
  isUploading,
  onUploadReceipt,
  onReview,
  currentTime,
}: {
  session: DashboardSession;
  isUploading: boolean;
  onUploadReceipt: (sessionId: string, file: File) => void;
  onReview: (session: DashboardSession) => void;
  currentTime: number;
}) {
  const mentor = getPopulatedUser(session.mentorId);
  const mentorName = mentor.name || "Mentor";
  const bankDetails = session.mentorProfile;
  const expired = isSessionExpired(session, currentTime);
  const showEndedBadge = expired && session.status !== "completed";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-dark">
      <div className="flex items-start gap-4">
        <Avatar user={mentor} fallback={mentorName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-950 dark:text-white">
                {session.subject}
              </h3>
              <p className="truncate text-sm text-slate-500">
                with {mentorName}
              </p>
            </div>
            {showEndedBadge ? (
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                Session Ended
              </span>
            ) : (
              <StatusPill status={session.status} />
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4 text-[#7C3AED]" />
            {formatSessionTime(getSessionStartTime(session))}
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {session.duration} mins
            </span>
            {session.type === "instant" && (
              <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-[#7C3AED]">
                <Zap className="h-3 w-3" fill="currentColor" />
                Instant
              </span>
            )}
          </div>
        </div>
      </div>

      {showEndedBadge && (
        <div className="mt-5 inline-flex rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-500">
          Session Ended
        </div>
      )}

      {!expired && session.status === "accepted" && (
        <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#7C3AED]">
            <CreditCard className="h-4 w-4" />
            Manual payment details
          </div>
          <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
            <p>
              <span className="block text-xs font-bold uppercase text-slate-400">
                Bank
              </span>
              {bankDetails?.bankName || "Ask mentor"}
            </p>
            <p>
              <span className="block text-xs font-bold uppercase text-slate-400">
                Account title
              </span>
              {bankDetails?.accountTitle || mentorName}
            </p>
            <p className="min-w-0">
              <span className="block text-xs font-bold uppercase text-slate-400">
                Account number
              </span>
              <span className="block truncate">
                {bankDetails?.accountNumber || "Not provided"}
              </span>
            </p>
          </div>
          <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700">
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Pay to Join
            <input
              type="file"
              accept="image/*,application/pdf"
              disabled={isUploading}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onUploadReceipt(session._id, file);
              }}
            />
          </label>
        </div>
      )}

      {!expired && session.status === "payment_pending" && (
        <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50 p-4 text-sm font-bold text-[#7C3AED]">
          Verifying Payment...
        </div>
      )}

      {!expired && (session.status === "payment_verified" || session.status === "active") && (
        session.isSessionStarted ? (
          <Link
            href={`/dashboard/study-rooms/${session._id}`}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700"
          >
            Join Room
          </Link>
        ) : (
          <div className="mt-5 inline-flex rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700">
            Waiting for Mentor to start...
          </div>
        )
      )}

      {session.status === "completed" && !session.reviewSubmitted && (
        <button
          type="button"
          onClick={() => onReview(session)}
          className="mt-5 inline-flex items-center justify-center rounded-xl border border-[#7C3AED] px-4 py-2.5 text-sm font-bold text-[#7C3AED] transition-colors hover:bg-purple-50"
        >
          Leave Review
        </button>
      )}

      {session.status === "completed" && session.reviewSubmitted && (
        <div className="mt-5 inline-flex rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-500">
          Review submitted
        </div>
      )}
    </article>
  );
}

function MentorSessionCard({
  session,
  respondingActionKey,
  isCompleting,
  isVerifying,
  isStartingSession,
  currentTime,
  onRespond,
  onOpenReceipt,
  onComplete,
  onJoinRoom,
  onStartSession,
  hasJoinedRoom,
}: {
  session: DashboardSession;
  respondingActionKey: string;
  isCompleting: boolean;
  isVerifying: boolean;
  isStartingSession: boolean;
  currentTime: number;
  onRespond: (id: string, status: RequestAction) => void;
  onOpenReceipt: (session: DashboardSession) => void;
  onComplete: (id: string) => void;
  onJoinRoom: (id: string) => void;
  onStartSession: (id: string) => void;
  hasJoinedRoom: boolean;
}) {
  const student = getPopulatedUser(session.student || session.studentId);
  const studentName = student.name || "Student";
  const acceptingKey = `${session._id}-accepted`;
  const decliningKey = `${session._id}-declined`;
  const isResponding = respondingActionKey.startsWith(`${session._id}-`);
  const expired = isSessionExpired(session, currentTime);
  const showEndedBadge =
    expired &&
    !["accepted", "payment_pending", "payment_verified", "completed"].includes(
      session.status
    );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-dark">
      {session.type === "instant" && session.status === "pending" && (
        <div className="mb-3 inline-flex animate-pulse items-center gap-1.5 rounded-full bg-[#7C3AED] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
          <Zap className="h-3 w-3" fill="currentColor" />
          URGENT: INSTANT SESSION
        </div>
      )}
      <div className="flex items-start gap-4">
        <Avatar user={student} fallback={studentName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-950 dark:text-white">
                {session.subject}
              </h3>
              <p className="truncate text-sm text-slate-500">
                Requested by {studentName}
              </p>
            </div>
            {showEndedBadge ? (
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                Session Ended
              </span>
            ) : (
              <StatusPill status={session.status} />
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4 text-[#7C3AED]" />
            {formatSessionTime(getSessionStartTime(session))}
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {session.duration} mins
            </span>
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
          <>
            <button
              type="button"
              onClick={() => onRespond(session._id, "accepted")}
              disabled={isResponding}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {respondingActionKey === acceptingKey && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Accept
            </button>
            <button
              type="button"
              onClick={() => onRespond(session._id, "declined")}
              disabled={isResponding}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-purple-50 hover:text-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {respondingActionKey === decliningKey && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Decline
            </button>
          </>
        )}

        {!expired && session.status === "accepted" && (
          <span className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-2.5 text-sm font-bold text-[#7C3AED]">
            Awaiting Student Payment
          </span>
        )}

        {session.status === "payment_pending" && (
          <button
            type="button"
            onClick={() => onOpenReceipt(session)}
            disabled={isVerifying}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Verify Payment
          </button>
        )}

        {(session.status === "payment_verified" || session.status === "active") && (
          <>
            {!expired && (
              session.isSessionStarted ? (
                <Link
                  href={`/dashboard/study-rooms/${session._id}`}
                  onClick={() => onJoinRoom(session._id)}
                  className="inline-flex items-center justify-center rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700"
                >
                  Join Room
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onStartSession(session._id)}
                  disabled={isStartingSession}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isStartingSession && <Loader2 className="h-4 w-4 animate-spin" />}
                  Start Session
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => onComplete(session._id)}
              disabled={isCompleting || !hasJoinedRoom}
              className={
                expired
                  ? "inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                  : "inline-flex items-center justify-center gap-2 rounded-xl bg-purple-100 px-4 py-2.5 text-sm font-bold text-[#7C3AED] transition-colors hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-60"
              }
              title={!hasJoinedRoom ? "Join the session room before completing it." : undefined}
            >
              {isCompleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Mark Completed
            </button>
            {!hasJoinedRoom && (
              <span className="text-xs font-semibold text-slate-500">
                Join room first
              </span>
            )}
          </>
        )}

        {expired && session.status === "accepted" && (
          <button
            type="button"
            onClick={() => onComplete(session._id)}
            disabled={isCompleting || !hasJoinedRoom}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            title={!hasJoinedRoom ? "Join the session room before completing it." : undefined}
          >
            {isCompleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Mark Completed
          </button>
        )}
      </div>
    </article>
  );
}

function ReceiptModal({
  session,
  isVerifying,
  onClose,
  onVerify,
}: {
  session: DashboardSession;
  isVerifying: boolean;
  onClose: () => void;
  onVerify: (id: string) => void;
}) {
  const receipt = session.paymentReceipt || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-surface-dark">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              Payment Receipt
            </h2>
            <p className="text-sm text-slate-500">{session.subject}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-purple-50 hover:text-[#7C3AED]"
            aria-label="Close receipt viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto bg-slate-50 p-5 dark:bg-slate-900">
          {receipt.startsWith("data:application/pdf") ? (
            <iframe
              src={receipt}
              title="Payment receipt PDF"
              className="h-[60vh] w-full rounded-xl border border-slate-200 bg-white"
            />
          ) : (
            <img
              src={receipt}
              alt="Payment receipt"
              className="mx-auto max-h-[60vh] max-w-full rounded-xl border border-slate-200 bg-white object-contain"
            />
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onVerify(session._id)}
            disabled={isVerifying}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Mark Payment Verified
          </button>
        </div>
      </div>
    </div>
  );
}

function CompleteSessionDialog({
  session,
  isCompleting,
  onClose,
  onConfirm,
}: {
  session: DashboardSession;
  isCompleting: boolean;
  onClose: () => void;
  onConfirm: (sessionId: string) => void;
}) {
  const student = getPopulatedUser(session.student || session.studentId);
  const studentName = student.name || "Student";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-surface-dark">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED] dark:bg-purple-500/15">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-center text-xl font-black text-slate-950 dark:text-white">
          Complete this session?
        </h2>
        <p className="mt-2 text-center text-sm leading-6 text-slate-500">
          This will mark your {session.subject} session with {studentName} as completed and notify the student to leave a review.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isCompleting}
            className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(session._id)}
            disabled={isCompleting}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCompleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Mark Completed
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const router = useRouter();
  const { data: authSession, status: authStatus } = useSession();
  const addReward = useGamificationStore((state) => state.addReward);
  const userRole = String(authSession?.user?.role ?? "").toLowerCase();
  const isMentorDashboardRole = userRole === "mentor" || userRole === "teacher";
  const [sessions, setSessions] = useState<DashboardSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [respondingActionKey, setRespondingActionKey] = useState("");
  const [uploadingSessionId, setUploadingSessionId] = useState("");
  const [verifyingSessionId, setVerifyingSessionId] = useState("");
  const [completingSessionId, setCompletingSessionId] = useState("");
  const [receiptSession, setReceiptSession] = useState<DashboardSession | null>(null);
  const [completeSession, setCompleteSession] = useState<DashboardSession | null>(null);
  const [reviewSession, setReviewSession] = useState<DashboardSession | null>(
    null
  );
  const [joinedSessionIds, setJoinedSessionIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = window.localStorage.getItem(JOINED_MENTOR_SESSIONS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60000);

    return () => window.clearInterval(timer);
  }, []);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (authStatus === "loading") return;

    let isActive = true;

    async function fetchSessions() {
      try {
        setIsLoading(true);

        if (userRole === "student") {
          const response = await fetch("/api/sessions/student", {
            cache: "no-store",
          });
          const data = await response.json().catch(() => null);

          if (!response.ok) {
            throw new Error(data?.message || "Failed to load student sessions.");
          }

          if (isActive) setSessions(Array.isArray(data) ? data : []);
          return;
        }

        if (isMentorDashboardRole) {
          const response = await fetch("/api/mentor/sessions", {
            cache: "no-store",
          });
          const data = await response.json().catch(() => null);

          if (!response.ok) {
            throw new Error(data?.message || "Failed to load Mentor sessions.");
          }

          if (isActive) setSessions(Array.isArray(data) ? data : []);
          return;
        }

        if (isActive) setSessions([]);
      } catch (error) {
        if (isActive) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load sessions."
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    fetchSessions();

    return () => {
      isActive = false;
    };
  }, [authStatus, isMentorDashboardRole, userRole, refreshTrigger]);

  useEffect(() => {
    function handleSessionStarted(event: Event) {
      const customEvent = event as CustomEvent;
      const payload = customEvent.detail;
      if (payload && payload.sessionId) {
        setSessions((currentSessions) =>
          currentSessions.map((session) =>
            session._id === payload.sessionId
              ? { ...session, isSessionStarted: true }
              : session
          )
        );
      }
    }

    function handleSessionInvited() {
      setRefreshTrigger((prev) => prev + 1);
    }

    window.addEventListener("mentor-session-started", handleSessionStarted);
    window.addEventListener("student-session-invited", handleSessionInvited);
    return () => {
      window.removeEventListener("mentor-session-started", handleSessionStarted);
      window.removeEventListener("student-session-invited", handleSessionInvited);
    };
  }, []);

  const [startingSessionId, setStartingSessionId] = useState("");

  async function handleStartSession(sessionId: string) {
    if (startingSessionId) return;

    try {
      setStartingSessionId(sessionId);
      setJoinedSessionIds(new Set());
      try {
        window.localStorage.removeItem(JOINED_MENTOR_SESSIONS_STORAGE_KEY);
      } catch {
      }

      const response = await fetch(`/api/study-rooms/${sessionId}/start-session`, {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to start session.");
      }

      setSessions((currentSessions) =>
        currentSessions.map((session) =>
          session._id === sessionId
            ? { ...session, isSessionStarted: true }
            : session
        )
      );

      const nextRoomId = String(data?.roomId || sessionId).trim();
      router.push(`/dashboard/study-rooms/${encodeURIComponent(nextRoomId)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start session.");
    } finally {
      setStartingSessionId("");
    }
  }

  const groupedSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => {
      const aActive = a.isSessionStarted ? 1 : 0;
      const bActive = b.isSessionStarted ? 1 : 0;
      if (aActive !== bActive) {
        return bActive - aActive;
      }
      return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
    });

    const isPastSession = (session: DashboardSession) =>
      ["completed", "declined", "rejected"].includes(session.status) ||
      isSessionExpired(session, currentTime);

    return {
      all: sorted,
      upcoming: sorted.filter((session) => !isPastSession(session)),
      past: sorted.filter(isPastSession),
    };
  }, [currentTime, sessions]);

  function updateSession(nextSession: DashboardSession) {
    setSessions((currentSessions) =>
      currentSessions.map((session) =>
        session._id === nextSession._id
          ? {
              ...session,
              ...nextSession,
              mentorProfile: nextSession.mentorProfile ?? session.mentorProfile,
            }
          : session
      )
    );
  }

  function markSessionJoined(sessionId: string) {
    setJoinedSessionIds((current) => {
      const next = new Set(current);
      next.add(sessionId);
      try {
        window.localStorage.setItem(
          JOINED_MENTOR_SESSIONS_STORAGE_KEY,
          JSON.stringify(Array.from(next))
        );
      } catch {
      }
      return next;
    });
  }

  function requestCompleteSession(sessionId: string) {
    const targetSession = sessions.find((session) => session._id === sessionId);

    if (!targetSession) return;

    if (!joinedSessionIds.has(sessionId)) {
      toast.error("Join the session room before marking it completed.");
      return;
    }

    setCompleteSession(targetSession);
  }

  async function handleRespond(sessionId: string, nextStatus: RequestAction) {
    const nextActionKey = `${sessionId}-${nextStatus}`;

    try {
      setRespondingActionKey(nextActionKey);

      const response = await fetch(`/api/sessions/${sessionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Failed to respond to session.");
      }

      updateSession(result.session as DashboardSession);
      toast.success(
        nextStatus === "accepted" ? "Session accepted." : "Session declined."
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to respond to session."
      );
    } finally {
      setRespondingActionKey("");
    }
  }

  async function handleUploadReceipt(sessionId: string, file: File) {
    try {
      setUploadingSessionId(sessionId);
      const paymentReceipt = await readFileAsDataUrl(file);

      const response = await fetch(`/api/sessions/${sessionId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReceipt }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Failed to upload payment receipt.");
      }

      updateSession(result.session as DashboardSession);
      toast.success("Receipt uploaded. Your mentor will verify it shortly.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload receipt."
      );
    } finally {
      setUploadingSessionId("");
    }
  }

  async function handleVerifyPayment(sessionId: string) {
    try {
      setVerifyingSessionId(sessionId);

      const response = await fetch(`/api/sessions/${sessionId}/payment/verify`, {
        method: "PATCH",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Failed to verify payment.");
      }

      updateSession(result.session as DashboardSession);
      setReceiptSession(null);
      toast.success("Payment verified. Waiting for the Mentor to start.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to verify payment."
      );
    } finally {
      setVerifyingSessionId("");
    }
  }

  async function handleCompleteSession(sessionId: string) {
    try {
      setCompletingSessionId(sessionId);

      const response = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: "PATCH",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Failed to complete session.");
      }

      updateSession(result.session as DashboardSession);
      const xpAwarded = Number(
        result?.reward?.xpAwarded || result?.rewards?.mentorXpAdded || 50
      );
      const coinsAwarded = Number(
        result?.reward?.coinsAwarded || result?.rewards?.mentorCoinsAdded || 20
      );

      addReward(xpAwarded, coinsAwarded);
      window.dispatchEvent(new Event("gamification-stats-updated"));
      toast.success("Session completed.");
      setCompleteSession(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to complete session."
      );
    } finally {
      setCompletingSessionId("");
    }
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

  const pageTitle = userRole === "student" ? "My Sessions" : "Session Requests";
  const pageSubtitle =
    userRole === "student"
      ? "Track mentor requests, submit payment receipts, and join verified rooms."
      : "Review requests, verify payments, and open session rooms.";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-bold uppercase tracking-wide text-[#7C3AED]">
            Mentorship
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {pageTitle}
          </h1>
          <p className="max-w-2xl text-sm text-slate-500">{pageSubtitle}</p>
        </header>

        {authStatus === "loading" || isLoading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-surface-dark">
            <Loader2 className="h-4 w-4 animate-spin text-[#7C3AED]" />
            Loading sessions...
          </div>
        ) : userRole !== "student" && userRole !== "teacher" && userRole !== "mentor" ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-surface-dark">
            Sessions are available for student and mentor accounts.
          </div>
        ) : groupedSessions.all.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-surface-dark">
            <User className="mx-auto mb-3 h-8 w-8 text-[#7C3AED]" />
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              No sessions yet
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {userRole === "student"
                ? "Booked mentor sessions will appear here."
                : "Student requests will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  Upcoming Sessions
                </h2>
                <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-black text-[#7C3AED]">
                  {groupedSessions.upcoming.length}
                </span>
              </div>
              {groupedSessions.upcoming.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-surface-dark">
                  No upcoming sessions.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {groupedSessions.upcoming.map((session) =>
                    userRole === "student" ? (
                      <StudentSessionCard
                        key={session._id}
                        session={session}
                        isUploading={uploadingSessionId === session._id}
                        currentTime={currentTime}
                        onUploadReceipt={handleUploadReceipt}
                        onReview={setReviewSession}
                      />
                    ) : (
                      <MentorSessionCard
                        key={session._id}
                        session={session}
                        respondingActionKey={respondingActionKey}
                        isCompleting={completingSessionId === session._id}
                        isVerifying={verifyingSessionId === session._id}
                        isStartingSession={startingSessionId === session._id}
                        currentTime={currentTime}
                        onRespond={handleRespond}
                        onOpenReceipt={setReceiptSession}
                        onComplete={requestCompleteSession}
                        onJoinRoom={markSessionJoined}
                        onStartSession={handleStartSession}
                        hasJoinedRoom={
                          joinedSessionIds.has(session._id) ||
                          Boolean(session.mentorJoinedAt)
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  Past Sessions
                </h2>
                <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-black text-[#7C3AED]">
                  {groupedSessions.past.length}
                </span>
              </div>
              {groupedSessions.past.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-surface-dark">
                  Completed and expired sessions will appear here.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {groupedSessions.past.map((session) =>
                    userRole === "student" ? (
                      <StudentSessionCard
                        key={session._id}
                        session={session}
                        isUploading={uploadingSessionId === session._id}
                        currentTime={currentTime}
                        onUploadReceipt={handleUploadReceipt}
                        onReview={setReviewSession}
                      />
                    ) : (
                      <MentorSessionCard
                        key={session._id}
                        session={session}
                        respondingActionKey={respondingActionKey}
                        isCompleting={completingSessionId === session._id}
                        isVerifying={verifyingSessionId === session._id}
                        isStartingSession={startingSessionId === session._id}
                        currentTime={currentTime}
                        onRespond={handleRespond}
                        onOpenReceipt={setReceiptSession}
                        onComplete={requestCompleteSession}
                        onJoinRoom={markSessionJoined}
                        onStartSession={handleStartSession}
                        hasJoinedRoom={
                          joinedSessionIds.has(session._id) ||
                          Boolean(session.mentorJoinedAt)
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {receiptSession && (
        <ReceiptModal
          session={receiptSession}
          isVerifying={verifyingSessionId === receiptSession._id}
          onClose={() => setReceiptSession(null)}
          onVerify={handleVerifyPayment}
        />
      )}

      {completeSession && (
        <CompleteSessionDialog
          session={completeSession}
          isCompleting={completingSessionId === completeSession._id}
          onClose={() => setCompleteSession(null)}
          onConfirm={handleCompleteSession}
        />
      )}

      <ReviewModal
        isOpen={Boolean(reviewSession)}
        sessionId={reviewSession?._id || ""}
        mentorName={
          reviewSession
            ? getPopulatedUser(reviewSession.mentorId).name || "Mentor"
            : "Mentor"
        }
        subject={reviewSession?.subject || "Mentorship session"}
        onClose={() => setReviewSession(null)}
        onSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}

