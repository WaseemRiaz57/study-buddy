"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";
import { CheckCircle2, Loader2, UserRound, X, XCircle } from "lucide-react";
import { toast } from "sonner";

import { playNotificationSound } from "@/lib/playNotificationSound";
import { getStudyRoomSocketUrl } from "@/lib/socket-client";

type IncomingBuddyRequest = {
  _id: string;
  requester: {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    subjects?: string[];
  };
  subject: string;
  status: "pending";
};

type BuddyRequestSocketPayload = {
  connectionId?: string;
  subject?: string;
  requester?: {
    _id?: string;
    name?: string;
    email?: string;
    image?: string;
    subjects?: string[];
  };
};

function normalizeSocketRequest(
  payload: BuddyRequestSocketPayload
): IncomingBuddyRequest | null {
  const connectionId = String(payload?.connectionId || "").trim();
  const requesterId = String(payload?.requester?._id || "").trim();

  if (!connectionId || !requesterId) {
    return null;
  }

  return {
    _id: connectionId,
    requester: {
      _id: requesterId,
      name: payload.requester?.name || "A student",
      email: payload.requester?.email || "",
      image: payload.requester?.image || "",
      subjects: Array.isArray(payload.requester?.subjects)
        ? payload.requester.subjects
        : [],
    },
    subject: payload.subject || "General Study",
    status: "pending",
  };
}

function requesterInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SB"
  );
}

export function StudyBuddyRealtimeRequests() {
  const { data: session } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<IncomingBuddyRequest[]>([]);
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const joinButtonRef = useRef<HTMLButtonElement>(null);

  const activeRequest = requests[0] || null;
  const requesterName = activeRequest?.requester?.name || "A student";
  const requesterSubjects = useMemo(
    () => activeRequest?.requester?.subjects?.filter(Boolean).slice(0, 4) || [],
    [activeRequest?.requester?.subjects]
  );

  const removeRequest = useCallback((connectionId: string) => {
    setRequests((current) =>
      current.filter((request) => request._id !== connectionId)
    );
  }, []);

  const addOrUpdateRequest = useCallback((request: IncomingBuddyRequest) => {
    setRequests((current) => [
      request,
      ...current.filter((item) => item._id !== request._id),
    ]);
  }, []);

  const handleRespond = useCallback(
    async (connectionId: string, action: "accept" | "decline") => {
      if (respondingRequestId) return;

      try {
        setRespondingRequestId(connectionId);

        const response = await fetch("/api/buddies/requests/respond", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId, action }),
        });
        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.ok) {
          throw new Error(result?.message || "Failed to respond to request.");
        }

        removeRequest(connectionId);

        if (action === "accept") {
          const roomId = String(result.roomId || "").trim();
          if (!roomId) {
            throw new Error("Request accepted, but no room was returned.");
          }

          toast.success("Request accepted. Opening your study room...");
          router.push(`/dashboard/study-rooms/${encodeURIComponent(roomId)}`);
          return;
        }

        toast.success("Request declined.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to respond to request."
        );
      } finally {
        setRespondingRequestId(null);
      }
    },
    [removeRequest, respondingRequestId, router]
  );

  useEffect(() => {
    if (!activeRequest) return;
    joinButtonRef.current?.focus();
  }, [activeRequest]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && activeRequest && !respondingRequestId) {
        void handleRespond(activeRequest._id, "decline");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeRequest, handleRespond, respondingRequestId]);

  useEffect(() => {
    let mounted = true;

    const fetchIncomingRequests = async () => {
      const response = await fetch("/api/buddies/requests/incoming", {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!mounted || !response.ok) return;
      setRequests(Array.isArray(data) ? data : []);
    };

    void fetchIncomingRequests();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const currentUserId = String(session?.user?.id || "").trim();
    if (!currentUserId) return;

    const socketUrl = getStudyRoomSocketUrl();
    if (!socketUrl) return;

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("study-buddy:identify", { userId: currentUserId });
    });

    socket.on("buddy-request-created", (payload: BuddyRequestSocketPayload) => {
      const request = normalizeSocketRequest(payload);
      if (!request) return;

      playNotificationSound();
      addOrUpdateRequest(request);
      toast.info(`${request.requester.name || "A student"} wants to study with you.`);
    });

    return () => {
      socket.off("buddy-request-created");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [addOrUpdateRequest, session?.user?.id]);

  if (!activeRequest) {
    return null;
  }

  const isResponding = respondingRequestId === activeRequest._id;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-buddy-request-title"
        aria-describedby="study-buddy-request-description"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1a1524]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-white/10">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
              Study Buddy Request
            </p>
            <h2
              id="study-buddy-request-title"
              className="mt-1 text-xl font-extrabold text-slate-950 dark:text-white"
            >
              {requesterName} wants to connect
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void handleRespond(activeRequest._id, "decline")}
            disabled={isResponding}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Decline study buddy request"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="px-5 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-lg font-extrabold text-[#7C3AED] dark:border-white/10 dark:bg-white/10">
              {activeRequest.requester?.image ? (
                <Image
                  src={activeRequest.requester.image}
                  alt={`${requesterName} profile photo`}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : requesterName ? (
                requesterInitials(requesterName)
              ) : (
                <UserRound size={28} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p
                id="study-buddy-request-description"
                className="text-sm leading-6 text-slate-600 dark:text-slate-300"
              >
                Join a live study room for{" "}
                <strong className="font-bold text-slate-950 dark:text-white">
                  {activeRequest.subject || "General Study"}
                </strong>
                .
              </p>
              {requesterSubjects.length > 0 && (
                <ul
                  className="mt-3 flex flex-wrap gap-2"
                  aria-label={`${requesterName} study subjects`}
                >
                  {requesterSubjects.map((subject) => (
                    <li
                      key={`${activeRequest._id}-${subject}`}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    >
                      {subject}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <footer className="grid gap-3 border-t border-slate-100 px-5 py-4 sm:grid-cols-2 dark:border-white/10">
          <button
            ref={joinButtonRef}
            type="button"
            onClick={() => void handleRespond(activeRequest._id, "accept")}
            disabled={isResponding}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={`Join room with ${requesterName}`}
          >
            {isResponding ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={18} aria-hidden="true" />
            )}
            Join Room
          </button>
          <button
            type="button"
            onClick={() => void handleRespond(activeRequest._id, "decline")}
            disabled={isResponding}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:text-slate-100 dark:hover:bg-white/10"
            aria-label={`Decline request from ${requesterName}`}
          >
            <XCircle size={18} aria-hidden="true" />
            Decline
          </button>
        </footer>
      </section>
    </div>
  );
}
