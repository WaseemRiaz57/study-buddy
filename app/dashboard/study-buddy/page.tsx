"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";
import dynamic from "next/dynamic";

import ActivePeersView from "@/components/study-buddy/ActivePeersView";
import TopicSelectionView from "@/components/study-buddy/TopicSelectionView";
import { getStudyRoomSocketUrl } from "@/lib/socket-client";

const MatchingLoader = dynamic(() => import("@/components/study-buddy/MatchingLoader"), {
  ssr: false,
});
const PublicProfileModal = dynamic(() => import("@/components/study-buddy/PublicProfileModal"), {
  ssr: false,
});

type ViewState = "dashboard" | "topic" | "loading";
type MatchmakingStatus = "searching" | "match_found" | "no_match";

interface Peer {
  _id?: string;
  userId: string;
  name: string;
  image: string;
  isOnline: boolean;
  isLookingForMatch: boolean;
  currentSubject: string;
  currentTopic: string;
  tags: string[];
}

export interface StudyBuddyListing {
  _id: string;
  subject: string;
  topic: string;
  status: string;
  createdAt?: string;
  student?: {
    _id: string;
    name: string;
    image: string;
  } | null;
}

interface SuggestedPeer {
  userId: string;
  name: string;
  image?: string;
  tags?: string[];
  sharedTags?: string[];
  sharedTagCount?: number;
}

interface IncomingRequest {
  _id: string;
  requester: {
    _id: string;
    name: string;
    email: string;
    image: string;
    subjects?: string[];
  };
  subject: string;
  status: "pending";
}

interface AcceptedRequestConnection {
  _id: string;
  subject?: string;
  roomId?: string;
  recipient?: {
    name?: string;
  };
}

type BuddyRequestCreatedPayload = {
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

export default function StudyBuddyPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [view, setView] = useState<ViewState>("dashboard");
  const [searchData, setSearchData] = useState({ subject: "", topic: "" });
  const [selectedTopic, setSelectedTopic] = useState("");
  const [peers, setPeers] = useState<Peer[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [myListings, setMyListings] = useState<StudyBuddyListing[]>([]);
  const [otherListings, setOtherListings] = useState<StudyBuddyListing[]>([]);
  const [suggestedPeers, setSuggestedPeers] = useState<SuggestedPeer[]>([]);
  const [suggestedPeersLoading, setSuggestedPeersLoading] = useState(false);

  const [loadingMode, setLoadingMode] = useState<"search" | "direct">("search");
  const [matchmakingStatus, setMatchmakingStatus] =
    useState<MatchmakingStatus>("searching");
  const [matchedListing, setMatchedListing] =
    useState<StudyBuddyListing | null>(null);
  const [isSendingMatchRequest, setIsSendingMatchRequest] = useState(false);
  const [publicProfileUserId, setPublicProfileUserId] = useState<string | null>(null);

  // Session tracking for the handshake
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [matchedPeerData, setMatchedPeerData] = useState({
    userId: "",
    name: "",
    image: "",
    tags: [] as string[],
  });

  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [acceptedConnection, setAcceptedConnection] =
    useState<AcceptedRequestConnection | null>(null);
  const [acceptedRoomId, setAcceptedRoomId] = useState<string | null>(null);
  const [isCancellingActiveSession, setIsCancellingActiveSession] =
    useState(false);
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);
  const [respondingAction, setRespondingAction] = useState<"accept" | "decline" | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pendingRequestIdRef = useRef<string | null>(null);

  // ─── Stop Polling Helpers ───
  const stopStatusPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchActiveListings = useCallback(async () => {
    setPeersLoading(true);

    try {
      const res = await fetch("/api/study-buddy/listings/active");

      // Gracefully handle non-ok responses without crashing the UI
      if (!res.ok) {
        let errorMessage = "Failed to fetch active listings.";
        try {
          const errData = await res.json();
          errorMessage = errData?.error || errData?.message || errorMessage;
        } catch {
          // Response body was not JSON – keep the default message
        }
        setMyListings([]);
        setOtherListings([]);
        toast.error(errorMessage);
        return;
      }

      const data = await res.json();
      setMyListings(Array.isArray(data.myListings) ? data.myListings : []);
      setOtherListings(Array.isArray(data.otherListings) ? data.otherListings : []);
    } catch (error) {
      // Network-level failure – still show empty state instead of breaking
      setMyListings([]);
      setOtherListings([]);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch active listings."
      );
    } finally {
      setPeersLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchActiveListings();
  }, [fetchActiveListings]);

  const fetchSuggestedPeers = useCallback(async () => {
    setSuggestedPeersLoading(true);

    try {
      const res = await fetch("/api/study-buddy/suggested-peers");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch online peers.");
      }

      setSuggestedPeers(Array.isArray(data.peers) ? data.peers : []);
    } catch (error) {
      setSuggestedPeers([]);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch online peers."
      );
    } finally {
      setSuggestedPeersLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSuggestedPeers();
  }, [fetchSuggestedPeers]);

  useEffect(() => {
    const userId = String(session?.user?.id || "").trim();

    if (!userId) return;

    const socketUrl = getStudyRoomSocketUrl();

    if (!socketUrl) return;

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("study-buddy:identify", { userId });
    });

    socket.on(
      "buddy-request-accepted",
      (payload: { roomId?: string; requestId?: string }) => {
        const roomId = String(payload?.roomId || "").trim();
        const requestId = String(payload?.requestId || "").trim();

        if (!roomId) return;
        if (
          pendingRequestIdRef.current &&
          requestId &&
          pendingRequestIdRef.current !== requestId
        ) {
          return;
        }

        stopStatusPolling();
        pendingRequestIdRef.current = null;
        setAcceptedRoomId(roomId);
        setActiveSessionId(roomId);
        void fetchActiveListings();
        setView("dashboard");
        toast.success("Match Found!");
        router.push(`/dashboard/study-rooms/${encodeURIComponent(roomId)}`);
      }
    );

    socket.on("buddy-request-declined", (payload: { requestId?: string }) => {
      const requestId = String(payload?.requestId || "").trim();
      if (
        pendingRequestIdRef.current &&
        requestId &&
        pendingRequestIdRef.current !== requestId
      ) {
        return;
      }

      stopStatusPolling();
      pendingRequestIdRef.current = null;
      setView("dashboard");
      setActiveSessionId(null);
      setMatchmakingStatus("searching");
      toast.info("Your study buddy request was declined.");
    });

    socket.on("buddy-request-created", (payload: BuddyRequestCreatedPayload) => {
      const connectionId = String(payload?.connectionId || "").trim();
      const requesterId = String(payload?.requester?._id || "").trim();

      if (!connectionId || !requesterId) return;

      setIncomingRequests((current) => [
        {
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
        },
        ...current.filter((request) => request._id !== connectionId),
      ]);
    });

    return () => {
      socket.off("buddy-request-accepted");
      socket.off("buddy-request-declined");
      socket.off("buddy-request-created");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [fetchActiveListings, router, session?.user?.id, stopStatusPolling]);

  // ─── Fetch incoming pending buddy requests ───
  useEffect(() => {
    const fetchIncomingRequests = async () => {
      try {
        const res = await fetch("/api/buddies/requests/incoming");
        if (!res.ok) {
          throw new Error("Failed to fetch incoming requests");
        }
        const data = await res.json();
        setIncomingRequests(Array.isArray(data) ? data : []);
      } catch {
        setIncomingRequests([]);
      }
    };

    fetchIncomingRequests();
  }, []);

  // ─── Poll accepted outgoing buddy request for sender session alert ───
  useEffect(() => {
    let mounted = true;

    const fetchAcceptedConnection = async () => {
      try {
        const res = await fetch("/api/buddies/requests/accepted");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        setAcceptedConnection(data?.connection ?? null);
      } catch {
        if (mounted) {
          setAcceptedConnection(null);
        }
      }
    };

    fetchAcceptedConnection();
    const interval = setInterval(fetchAcceptedConnection, 4000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // ─── Poll Session Status (User A) ───
  const startStatusPolling = useCallback(
    (id: string, type: "request" | "match" = "request") => {
      if (pollingRef.current) clearInterval(pollingRef.current);

      pollingRef.current = setInterval(async () => {
        try {
          const queryParam = type === "match" ? "matchId" : "requestId";
          const res = await fetch(
            `/api/study-buddy/status?${queryParam}=${encodeURIComponent(id)}`
          );
          if (!res.ok) return;
          const data = await res.json();

          if (data.matchFound && data.roomId) {
            stopStatusPolling();
            pendingRequestIdRef.current = null;
            setActiveSessionId(String(data.roomId));
            setMatchedPeerData({
              userId: data.peer?.id || data.peer?._id || "",
              name: data.peer?.name || "Study Buddy",
              image: data.peer?.image || "",
              tags: [],
            });
            router.push(`/dashboard/study-rooms/${encodeURIComponent(String(data.roomId))}`);
          } else if (data.status === "rejected") {
            stopStatusPolling();
            pendingRequestIdRef.current = null;
            toast.info("Your study match was cancelled.");
            setView("dashboard");
            setActiveSessionId(null);
          }
        } catch {
          // silently retry
        }
      }, 3000);
    },
    [router, stopStatusPolling]
  );

  // ─── "Add New" → Search Mode ───
  const handleAddNew = () => {
    setLoadingMode("search");
    setView("topic");
  };

  // ─── Search Submit → Discover peers by selected subject ───
  const handleSearch = async (data: { subject: string; topic: string }) => {
    setSearchData(data);
    setSelectedTopic(data.subject);
    setPeersLoading(true);
    setLoadingMode("search");
    setMatchmakingStatus("searching");
    setMatchedListing(null);
    setView("loading");

    try {
      const params = new URLSearchParams({
        subject: data.subject,
        topic: data.topic,
      });
      const res = await fetch(`/api/study-buddy/match?${params.toString()}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Matchmaking failed.");
      }

      if (result.matchFound) {
        const listing = result.listing as StudyBuddyListing;
        const peer = listing?.student || null;

        if (!listing?._id || !peer?._id) {
          throw new Error("Match found, but the listing owner was not available.");
        }

        setMatchedListing(listing);
        setMatchedPeerData({
          userId: peer._id,
          name: peer.name || "Study Buddy",
          image: peer.image || "",
          tags: [],
        });
        setMatchmakingStatus("match_found");
        return;
      }

      setMatchedListing(result.listing || null);
      setPeers([]);
      setMatchmakingStatus("no_match");
      void fetchActiveListings();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Matchmaking failed. Please try again."
      );
      setView("dashboard");
    } finally {
      setPeersLoading(false);
    }
  };

  const handleCancelListing = async (listingId: string) => {
    try {
      const res = await fetch(
        `/api/study-buddy/listings/${encodeURIComponent(listingId)}`,
        { method: "DELETE" }
      );
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Failed to cancel listing.");
      }

      toast.success("Listing cancelled.");
      await fetchActiveListings();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to cancel listing."
      );
    }
  };

  const handleConnectListing = async (listing: StudyBuddyListing) => {
    setLoadingMode("direct");
    setMatchmakingStatus("searching");

    try {
      const res = await fetch("/api/buddies/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing._id,
          subject: listing.subject,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Failed to send request.");
      }

      const requestId = String(result.connection?._id || result.requestId || "").trim();

      if (!requestId) {
        throw new Error("Request sent, but no requestId was returned.");
      }

      setOtherListings((current) =>
        current.filter((activeListing) => activeListing._id !== listing._id)
      );
      setMatchedPeerData({
        userId: listing.student?._id || "",
        name: listing.student?.name || "Study Buddy",
        image: listing.student?.image || "",
        tags: [],
      });
      pendingRequestIdRef.current = requestId;
      toast.success("Request sent! Waiting for approval...");
      setView("loading");
      startStatusPolling(requestId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send request."
      );
      setView("dashboard");
    }
  };

  const handleSendMatchedListingRequest = async () => {
    if (!matchedListing) return;

    setIsSendingMatchRequest(true);
    try {
      await handleConnectListing(matchedListing);
    } finally {
      setIsSendingMatchRequest(false);
    }
  };

  const handlePingSuggestedPeer = async (peer: SuggestedPeer) => {
    setLoadingMode("direct");
    setMatchmakingStatus("searching");

    try {
      const recipientId = String(peer.userId || "").trim();
      const subject =
        searchData.subject ||
        peer.sharedTags?.[0] ||
        peer.tags?.[0] ||
        "General Study";

      if (!recipientId) {
        throw new Error("Unable to identify this peer.");
      }

      const res = await fetch("/api/buddies/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          subject,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Failed to send invitation.");
      }

      const requestId = String(result.connection?._id || result.requestId || "").trim();

      if (!requestId) {
        throw new Error("Invitation sent, but no requestId was returned.");
      }

      setMatchedPeerData({
        userId: peer.userId,
        name: peer.name || "Study Buddy",
        image: peer.image || "",
        tags: peer.tags || [],
      });
      pendingRequestIdRef.current = requestId;
      toast.success("Ping sent! Waiting for approval...");
      setView("loading");
      startStatusPolling(requestId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send invitation."
      );
      setView("dashboard");
    }
  };

  const handleOpenPublicProfile = (userId: string) => {
    const normalizedUserId = String(userId || "").trim();
    if (normalizedUserId) {
      setPublicProfileUserId(normalizedUserId);
    }
  };

  const handleConnectFromPublicProfile = async (profile: {
    _id: string;
    name: string;
    image: string;
    preferredSubjects: string[];
  }) => {
    const recipientId = String(profile._id || "").trim();
    const subject =
      profile.preferredSubjects?.[0] || searchData.subject || "General Study";

    if (!recipientId) {
      toast.error("Unable to identify this student.");
      return;
    }

    try {
      const res = await fetch("/api/buddies/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, subject }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Failed to send request.");
      }

      const requestId = String(result.connection?._id || result.requestId || "").trim();
      if (!requestId) {
        throw new Error("Request sent, but no requestId was returned.");
      }

      setPublicProfileUserId(null);
      setLoadingMode("direct");
      setMatchmakingStatus("searching");
      setMatchedPeerData({
        userId: recipientId,
        name: profile.name || "Study Buddy",
        image: profile.image || "",
        tags: profile.preferredSubjects || [],
      });
      pendingRequestIdRef.current = requestId;
      toast.success("Request sent! Waiting for approval...");
      setView("loading");
      startStatusPolling(requestId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send request."
      );
    }
  };

  const handleRespond = async (
    connectionId: string,
    action: "accept" | "decline"
  ) => {
    try {
      setRespondingRequestId(connectionId);
      setRespondingAction(action);
      const res = await fetch("/api/buddies/requests/respond", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action }),
      });

      const result = await res.json();
      if (!res.ok || !result?.ok) {
        throw new Error(result?.message || "Failed to respond to request.");
      }

      if (action === "accept") {
        toast.success("Request accepted. Redirecting to study room...");
        setIncomingRequests((prev) =>
          prev.filter((request) => request._id !== connectionId)
        );
        void fetchActiveListings();
        router.push(`/dashboard/study-rooms/${result.roomId || connectionId}`);
        return;
      }

      setIncomingRequests((prev) =>
        prev.filter((request) => request._id !== connectionId)
      );
      toast.success("Request declined.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to respond to request.";
      toast.error(message);
    } finally {
      setRespondingRequestId(null);
      setRespondingAction(null);
    }
  };

  // ─── Close / Reset ───
  const handleClose = () => {
    stopStatusPolling();
    setView("dashboard");
    setSearchData({ subject: "", topic: "" });
    setMatchedPeerData({ userId: "", name: "", image: "", tags: [] });
    setMatchedListing(null);
    setMatchmakingStatus("searching");
    setActiveSessionId(null);
    pendingRequestIdRef.current = null;
  };

  const handleCancelLoading = () => {
    stopStatusPolling();
    setView("dashboard");
    setMatchedListing(null);
    setMatchmakingStatus("searching");
    setActiveSessionId(null);
    pendingRequestIdRef.current = null;
  };

  const handleCancelActiveSession = async ({
    connectionId,
    roomId,
  }: {
    connectionId?: string;
    roomId?: string;
  }) => {
    try {
      setIsCancellingActiveSession(true);

      const response = await fetch("/api/study-buddy/active", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, roomId }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Failed to cancel session.");
      }

      setAcceptedConnection(null);
      setAcceptedRoomId(null);
      setActiveSessionId(null);
      setMatchedPeerData({ userId: "", name: "", image: "", tags: [] });
      stopStatusPolling();
      toast.success("Session cancelled");
      void fetchActiveListings();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel session."
      );
    } finally {
      setIsCancellingActiveSession(false);
    }
  };

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => {
      stopStatusPolling();
    };
  }, [stopStatusPolling]);

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0f0a16] text-slate-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
      <main className="relative z-10 w-full h-full pt-6">
        {acceptedConnection && view === "dashboard" && (
          <section className="w-full max-w-6xl mx-auto px-4 mb-6">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-400/25 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    Active Session
                  </h2>
                  <p className="text-sm text-emerald-700/90 dark:text-emerald-200/90 mt-1">
                    Your request was accepted!
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/dashboard/study-rooms/${
                          acceptedConnection.roomId || acceptedConnection._id
                        }`
                      )
                    }
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    aria-label="Join active video room"
                  >
                    Join Video Room
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void handleCancelActiveSession({
                        connectionId: acceptedConnection._id,
                        roomId: acceptedConnection.roomId,
                      })
                    }
                    disabled={isCancellingActiveSession}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-500/10"
                    aria-label="Cancel active session"
                  >
                    {isCancellingActiveSession ? "Cancelling..." : "Cancel"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {acceptedRoomId && view === "dashboard" && (
          <section className="w-full max-w-6xl mx-auto px-4 mb-6">
            <div className="bg-white dark:bg-[#1a1524] border border-[#7C3AED]/25 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#7C3AED]">
                    Match Found!
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-gray-300 mt-1">
                    Your study buddy accepted the request.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/dashboard/study-rooms/${acceptedRoomId}`)
                    }
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#7C3AED] text-white transition-opacity hover:opacity-90"
                    aria-label="Join accepted study room"
                  >
                    Join Study Room
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void handleCancelActiveSession({
                        roomId: acceptedRoomId,
                      })
                    }
                    disabled={isCancellingActiveSession}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-500/10"
                    aria-label="Cancel active session"
                  >
                    {isCancellingActiveSession ? "Cancelling..." : "Cancel"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {incomingRequests.length > 0 && view === "dashboard" && (
          <section className="w-full max-w-6xl mx-auto px-4 mb-6">
            <div className="bg-white dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Pending Requests
              </h2>
              <div className="space-y-3">
                {incomingRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-200 dark:border-white/10 rounded-xl p-4 bg-slate-50/70 dark:bg-white/[0.03]"
                  >
                    <div>
                      {request.requester?._id ? (
                        <button
                          type="button"
                          onClick={() => handleOpenPublicProfile(request.requester._id)}
                          className="font-semibold text-slate-900 transition-colors hover:text-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:text-white"
                        >
                          {request.requester?.name || "Unknown requester"}
                        </button>
                      ) : (
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {request.requester?.name || "Unknown requester"}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(request.requester?.subjects || []).map((subj) => (
                          <span
                            key={`${request._id}-${subj}`}
                            className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/5"
                          >
                            {subj}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRespond(request._id, "accept")}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(request._id, "decline")}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <AnimatePresence mode="wait">
          
          {view === "dashboard" && (
            <motion.div 
              key="dashboard"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              className="w-full"
            >
              <ActivePeersView 
                onAddNewAction={handleAddNew} 
                peers={peers}
                myListings={myListings}
                otherListings={otherListings}
                suggestedPeers={suggestedPeers}
                loading={peersLoading}
                suggestedPeersLoading={suggestedPeersLoading}
                selectedTopic={selectedTopic}
                onCancelListing={handleCancelListing}
                onConnectListing={handleConnectListing}
                onPingSuggestedPeer={handlePingSuggestedPeer}
                onViewProfile={handleOpenPublicProfile}
              />
            </motion.div>
          )}

          {view === "topic" && (
            <motion.div 
              key="topic"
              className="w-full"
            >
              <TopicSelectionView 
                onSearch={handleSearch} 
                onBack={() => setView("dashboard")} 
              />
            </motion.div>
          )}

          {view === "loading" && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-white/90 dark:bg-[#0f0a16]/95 backdrop-blur-md"
            >
              <MatchingLoader 
                onCancel={handleCancelLoading} 
                status={matchmakingStatus}
                mode={loadingMode}
                peerName={matchedPeerData.name}
                subject={searchData.subject}
                matchedUser={
                  matchmakingStatus === "match_found" && matchedListing?.student
                    ? {
                        userId: matchedListing.student._id,
                        name: matchedListing.student.name || "Study Buddy",
                        image: matchedListing.student.image || "",
                        subject: matchedListing.subject,
                        topic: matchedListing.topic,
                      }
                    : null
                }
                isSendingRequest={isSendingMatchRequest}
                onSendJoinRequest={() => void handleSendMatchedListingRequest()}
                onGoBack={handleCancelLoading}
                onOpenProfile={handleOpenPublicProfile}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
      <PublicProfileModal
        userId={publicProfileUserId}
        onClose={() => setPublicProfileUserId(null)}
        onConnect={handleConnectFromPublicProfile}
      />
    </div>
  );
}

