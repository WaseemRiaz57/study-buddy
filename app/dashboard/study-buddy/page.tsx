"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import ActivePeersView from "@/components/study-buddy/ActivePeersView";
import TopicSelectionView from "@/components/study-buddy/TopicSelectionView";
import MatchingLoader from "@/components/study-buddy/MatchingLoader";
import MatchSuccess from "@/components/study-buddy/MatchSuccess";
import MatchRequestNotification from "@/components/study-buddy/MatchRequestNotification";

type ViewState = "dashboard" | "topic" | "loading" | "success";

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

interface MatchRequest {
  sessionId: string;
  requester: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  subject: string;
  topic: string;
}

export default function StudyBuddyPage() {
  const [view, setView] = useState<ViewState>("dashboard");
  const [searchData, setSearchData] = useState({ subject: "", topic: "" });
  const [selectedTopic, setSelectedTopic] = useState("");
  const [peers, setPeers] = useState<Peer[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);

  const [loadingMode, setLoadingMode] = useState<"search" | "direct">("search");

  // Session tracking for the handshake
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [matchedPeerData, setMatchedPeerData] = useState({
    name: "",
    image: "",
    tags: [] as string[],
  });

  // Incoming match requests (User B)
  const [incomingRequests, setIncomingRequests] = useState<MatchRequest[]>([]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Stop Polling Helpers ───
  const stopStatusPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const stopNotifPolling = useCallback(() => {
    if (notifPollingRef.current) {
      clearInterval(notifPollingRef.current);
      notifPollingRef.current = null;
    }
  }, []);

  // ─── Poll for Incoming Notifications (User B) ───
  const startNotifPolling = useCallback(() => {
    if (notifPollingRef.current) return;

    const poll = async () => {
      try {
        const res = await fetch("/api/study-buddy/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (data.notifications && data.notifications.length > 0) {
          setIncomingRequests(data.notifications);
        }
      } catch {
        // silently retry
      }
    };

    poll();
    notifPollingRef.current = setInterval(poll, 4000);
  }, []);

  useEffect(() => {
    startNotifPolling();
    return () => stopNotifPolling();
  }, [startNotifPolling, stopNotifPolling]);

  // ─── Poll Session Status (User A) ───
  const startStatusPolling = useCallback(
    (sessionId: string) => {
      if (pollingRef.current) clearInterval(pollingRef.current);

      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/study-buddy/status?sessionId=${sessionId}`
          );
          if (!res.ok) return;
          const data = await res.json();

          if (data.status === "accepted") {
            stopStatusPolling();
            setMatchedPeerData({
              name: data.peer.name,
              image: data.peer.image,
              tags: [],
            });
            setView("success");
          } else if (data.status === "rejected") {
            stopStatusPolling();
            toast.info("Your study request was declined.");
            setView("dashboard");
            setActiveSessionId(null);
          }
        } catch {
          // silently retry
        }
      }, 3000);
    },
    [stopStatusPolling]
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
    setView("loading");

    try {
      const subject = encodeURIComponent(data.subject);
      const res = await fetch(`/api/buddies/discover?subject=${subject}`);
      const result = await res.json();
      console.log("[StudyBuddy] Discover API response:", result);

      if (!res.ok) {
        throw new Error(result.message || "Discover failed");
      }

      setPeers(Array.isArray(result.matches) ? result.matches : []);
      setView("dashboard");
    } catch {
      toast.error("Matchmaking failed. Please try again.");
      setView("dashboard");
    } finally {
      setPeersLoading(false);
    }
  };

  // ─── Animation finished callback from MatchingLoader ───
  const handleMatchFound = () => {
    if (matchedPeerData.name && activeSessionId) {
      setView("success");
    }
  };

  // ─── User B: Accept Request ───
  const handleRequestAccepted = (
    sessionId: string,
    peerName: string,
    peerImage: string
  ) => {
    stopNotifPolling();
    setIncomingRequests((prev) =>
      prev.filter((r) => r.sessionId !== sessionId)
    );
    setActiveSessionId(sessionId);
    setMatchedPeerData({ name: peerName, image: peerImage, tags: [] });
    setView("success");
  };

  // ─── User B: Decline Request ───
  const handleRequestDeclined = (sessionId: string) => {
    setIncomingRequests((prev) =>
      prev.filter((r) => r.sessionId !== sessionId)
    );
  };

  // ─── Close / Reset ───
  const handleClose = () => {
    stopStatusPolling();
    setView("dashboard");
    setSearchData({ subject: "", topic: "" });
    setMatchedPeerData({ name: "", image: "", tags: [] });
    setActiveSessionId(null);
    startNotifPolling();
  };

  const handleCancelLoading = () => {
    stopStatusPolling();
    setView("dashboard");
    setActiveSessionId(null);
  };

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => {
      stopStatusPolling();
      stopNotifPolling();
    };
  }, [stopStatusPolling, stopNotifPolling]);

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0f0a16] text-slate-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
      
      <div className="fixed inset-0 pointer-events-none opacity-30 dark:opacity-100 transition-opacity">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px]" />
      </div>

      {/* ── Incoming Match Request Notifications (User B) ── */}
      {incomingRequests.length > 0 && view !== "loading" && view !== "success" && (
        <MatchRequestNotification
          request={incomingRequests[0]}
          onAcceptedAction={handleRequestAccepted}
          onDeclinedAction={handleRequestDeclined}
        />
      )}

      <main className="relative z-10 w-full h-full pt-6">
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
                loading={peersLoading}
                selectedTopic={selectedTopic}
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
                onMatchFound={handleMatchFound} 
                mode={loadingMode}
                peerName={matchedPeerData.name}
              />
            </motion.div>
          )}

          {view === "success" && activeSessionId && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 1.05 }}
              className="fixed inset-0 z-50 bg-white/90 dark:bg-[#0f0a16]/95 backdrop-blur-md"
            >
              <MatchSuccess 
                onCloseAction={handleClose} 
                matchData={matchedPeerData}
                sessionId={activeSessionId}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}