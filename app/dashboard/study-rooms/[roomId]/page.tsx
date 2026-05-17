"use client";

import { useCallback, useState, useEffect, use, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion"; 
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import type { LiveVideoRoomRenderState } from "@/components/LiveVideoRoom";
import VaultView from "@/components/study-room/VaultView";
import {
  Mic,
  Video,
  MonitorUp,
  PhoneOff,
  Send,
  FolderOpen,
  MessageSquare,
  Clock,
  VideoOff,
  MicOff,
  Minus,
  Loader2,
  DoorOpen,
} from "lucide-react";

type JoinStatus = "checking" | "waiting" | "admitted" | "declined";

function isPlaybackAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

// Native Video Player Helper (Smarter version for Screen Share Tracks)
const NativeStreamPlayer = ({ stream, muted = false, className = "" }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      console.log("[MainTile] Binding incoming stream to video element:", {
        isTrack: stream instanceof MediaStreamTrack,
        muted,
      });

      // Check: Agar yeh akela 'Track' hai, toh usay 'Stream' mein wrap kar do
      if (stream instanceof MediaStreamTrack) {
        videoRef.current.srcObject = new MediaStream([stream]);
      } else {
        // Agar pehle se poori 'Stream' hai (jaise camera), toh direct chala do
        videoRef.current.srcObject = stream;
      }

      videoRef.current
        .play()
        .then(() => {
          const boundStream = videoRef.current?.srcObject as MediaStream | null;
          console.log("[MainTile] Screen-share video playback started:", {
            hasBoundStream: Boolean(boundStream),
            videoTracks: boundStream?.getVideoTracks().map((t) => ({
              id: t.id,
              label: t.label,
              state: t.readyState,
            })),
          });
        })
        .catch((error) => {
          if (isPlaybackAbortError(error)) {
            return;
          }

          console.error("[MainTile] Screen-share video playback failed:", error);
        });
    }
  }, [stream]);
  
  return <video ref={videoRef} autoPlay playsInline muted={muted} className={className} />;
};

const LiveVideoRoom = dynamic(() => import('@/components/LiveVideoRoom'), {
  ssr: false,
  loading: () => <p className="text-center mt-10 text-slate-500">Loading Room...</p>,
});

function normalizeUserId(value: unknown): string {
  return String(value || "").trim();
}

function createGuestUserId(): string {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `Guest-${randomNumber}`;
}

export default function StudyRoomSessionPage({ params }: { params: Promise<{ roomId: string }> }) {
  const router = useRouter();
  // Unwrap params
  const { roomId } = use(params);
  const normalizedRoomId = String(roomId || "").trim();
  const { data: session } = useSession();

  const currentUserName = session?.user?.name || "You";
  const sessionUserId = normalizeUserId(session?.user?.id);
  const [guestUserId] = useState(() => createGuestUserId());
  const effectiveCurrentUserId = normalizeUserId(sessionUserId || guestUserId);

  const [activeTab, setActiveTab] = useState<"chat" | "vault">("chat");
  const [showChat, setShowChat] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [isLocalVideoMinimized, setIsLocalVideoMinimized] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [apiCurrentUserId, setApiCurrentUserId] = useState<string>("");
  const [roomTopic, setRoomTopic] = useState<string>("");
  const [roomHostId, setRoomHostId] = useState<string>("");
  const [liveKitToken, setLiveKitToken] = useState<string>("");
  const [liveKitUrl, setLiveKitUrl] = useState<string>("");
  const [liveKitRoomName, setLiveKitRoomName] = useState<string>("");
  const [isRoomLoading, setIsRoomLoading] = useState(true);
  const [joinStatus, setJoinStatus] = useState<JoinStatus>("checking");
  const [isStudyBuddyRoom, setIsStudyBuddyRoom] = useState(false);
  const knockToastIdsRef = useRef<Set<string>>(new Set());
  const participantPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hostPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSentKnockRef = useRef(false);
  const currentUserId = normalizeUserId(apiCurrentUserId || sessionUserId || guestUserId || effectiveCurrentUserId);

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const applyRoomMetadata = useCallback(
    (data: any) => {
      const room = data?.room ?? {};
      const fetchedCurrentUserId = normalizeUserId(
        data?.currentUserId || sessionUserId || guestUserId
      );
      const fetchedHostId = normalizeUserId(
        data?.hostId || room?.createdBy?._id || room?.createdBy || room?.host?._id || room?.host
      );

      setApiCurrentUserId(fetchedCurrentUserId);
      setLiveKitRoomName(String(data?.roomName || normalizedRoomId).trim());
      setIsStudyBuddyRoom(Boolean(data?.isStudyBuddyRoom));
      setRoomTopic(
        typeof room?.title === "string"
          ? room.title
          : typeof data?.topic === "string"
            ? data.topic
            : ""
      );
      setRoomHostId(fetchedHostId);

      return {
        fetchedCurrentUserId,
        fetchedHostId,
        isHost: Boolean(fetchedCurrentUserId && fetchedHostId && fetchedCurrentUserId === fetchedHostId),
      };
    },
    [guestUserId, normalizedRoomId, sessionUserId]
  );

  const fetchLiveKitToken = useCallback(async () => {
    if (!normalizedRoomId) return;

    setIsRoomLoading(true);

    try {
      const response = await fetch(
        `/api/study-rooms/${encodeURIComponent(normalizedRoomId)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load room details.");
      }

      applyRoomMetadata(data);
      setLiveKitToken(String(data?.token || ""));
      setLiveKitUrl(String(data?.liveKitUrl || ""));
    } catch (error) {
      setLiveKitToken("");
      setLiveKitUrl("");
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load the LiveKit room."
      );
      setJoinStatus("declined");
    } finally {
      setIsRoomLoading(false);
    }
  }, [applyRoomMetadata, normalizedRoomId]);

  useEffect(() => {
    let isActive = true;

    async function runGatekeeperCheck() {
      if (!normalizedRoomId) {
        setRoomTopic("");
        setIsRoomLoading(false);
        setJoinStatus("declined");
        return;
      }

      setJoinStatus("checking");
      setIsRoomLoading(true);
      setLiveKitToken("");
      setLiveKitUrl("");
      hasSentKnockRef.current = false;

      try {
        const response = await fetch(
          `/api/study-rooms/${encodeURIComponent(normalizedRoomId)}?metadataOnly=true`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to check room access.");
        }

        if (!isActive) return;

        const { fetchedCurrentUserId, fetchedHostId } = applyRoomMetadata(data);
        const isHost =
          String(fetchedCurrentUserId || "").trim() ===
          String(fetchedHostId || "").trim();

        if (isHost || Boolean(data?.isStudyBuddyRoom)) {
          setJoinStatus("admitted");
          setIsRoomLoading(false);
          void fetchLiveKitToken();
          return;
        }

        setJoinStatus("waiting");
        setIsRoomLoading(false);
      } catch (error) {
        if (!isActive) return;

        setJoinStatus("declined");
        toast.error(
          error instanceof Error ? error.message : "Failed to check room access."
        );
        router.push("/dashboard/study-rooms");
      } finally {
        if (isActive) {
          setIsRoomLoading(false);
        }
      }
    }

    void runGatekeeperCheck();

    return () => {
      isActive = false;
      knockToastIdsRef.current.clear();
    };
  }, [
    applyRoomMetadata,
    fetchLiveKitToken,
    normalizedRoomId,
    router,
  ]);

  const respondToWaitingUser = useCallback(
    async (
      targetUserId: string,
      status: "admitted" | "declined",
      toastKey: string,
      toastId: string | number
    ) => {
      try {
        const response = await fetch("/api/study-rooms/waiting-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "respond",
            roomId: normalizedRoomId,
            targetUserId,
            status,
          }),
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || "Failed to update waiting room.");
        }

        knockToastIdsRef.current.delete(toastKey);
        toast.dismiss(toastId);
        toast.success(status === "admitted" ? "Participant admitted." : "Participant declined.");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update waiting room."
        );
      }
    },
    [normalizedRoomId]
  );

  useEffect(() => {
    if (joinStatus !== "waiting" || !currentUserId || !normalizedRoomId) return;

    let isActive = true;

    async function sendKnockOnce() {
      if (hasSentKnockRef.current) return;

      hasSentKnockRef.current = true;

      try {
        const response = await fetch("/api/study-rooms/waiting-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "knock",
            roomId: normalizedRoomId,
            userId: currentUserId,
            userName: currentUserName,
          }),
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || "Failed to enter waiting room.");
        }
      } catch (error) {
        hasSentKnockRef.current = false;
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to enter waiting room."
        );
      }
    }

    async function pollWaitingStatus() {
      try {
        const response = await fetch(
          `/api/study-rooms/waiting-room?roomId=${encodeURIComponent(normalizedRoomId)}`,
          { cache: "no-store" }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || "Failed to check waiting room status.");
        }

        const status = result?.entry?.status;

        if (status === "admitted") {
          if (participantPollingRef.current) {
            clearInterval(participantPollingRef.current);
            participantPollingRef.current = null;
          }

          if (!isActive) return;

          toast.success("The host admitted you. Joining room...");
          setJoinStatus("admitted");
          void fetchLiveKitToken();
          return;
        }

        if (status === "declined") {
          if (participantPollingRef.current) {
            clearInterval(participantPollingRef.current);
            participantPollingRef.current = null;
          }

          if (!isActive) return;

          setJoinStatus("declined");
          toast.error("The host declined your request to join.");
          window.setTimeout(() => {
            router.push("/dashboard/study-rooms");
          }, 1200);
        }
      } catch {
        // Keep polling; transient serverless/database hiccups should not strand the user.
      }
    }

    void sendKnockOnce();
    void pollWaitingStatus();
    participantPollingRef.current = setInterval(pollWaitingStatus, 3000);

    return () => {
      isActive = false;
      if (participantPollingRef.current) {
        clearInterval(participantPollingRef.current);
        participantPollingRef.current = null;
      }
    };
  }, [
    currentUserId,
    currentUserName,
    fetchLiveKitToken,
    joinStatus,
    normalizedRoomId,
    router,
  ]);

  useEffect(() => {
    const isHost =
      joinStatus === "admitted" &&
      Boolean(currentUserId) &&
      String(currentUserId) === String(roomHostId);

    if (!isHost || !normalizedRoomId) return;

    async function pollWaitingList() {
      try {
        const response = await fetch(
          `/api/study-rooms/waiting-room?roomId=${encodeURIComponent(normalizedRoomId)}`,
          { cache: "no-store" }
        );
        const result = await response.json();

        if (!response.ok || !Array.isArray(result?.waitingList)) return;

        result.waitingList.forEach((entry: { userId?: string; userName?: string }) => {
          const targetUserId = normalizeUserId(entry.userId);
          if (!targetUserId) return;

          const toastKey = `${normalizedRoomId.toUpperCase()}:${targetUserId}`;
          if (knockToastIdsRef.current.has(toastKey)) return;
          knockToastIdsRef.current.add(toastKey);

          toast.custom(
            (toastId) => (
              <div className="w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#161027] dark:text-white">
                <p className="text-sm font-bold">Waiting Room</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">
                  {entry.userName || "A participant"} wants to join this study room.
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void respondToWaitingUser(
                        targetUserId,
                        "declined",
                        toastKey,
                        toastId
                      )
                    }
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void respondToWaitingUser(
                        targetUserId,
                        "admitted",
                        toastKey,
                        toastId
                      )
                    }
                    className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-purple-700 dark:bg-[#8c30e8]"
                  >
                    Admit
                  </button>
                </div>
              </div>
            ),
            {
              duration: Infinity,
            }
          );
        });
      } catch {
        // Host polling is best-effort; try again on the next interval.
      }
    }

    void pollWaitingList();
    hostPollingRef.current = setInterval(pollWaitingList, 5000);

    return () => {
      if (hostPollingRef.current) {
        clearInterval(hostPollingRef.current);
        hostPollingRef.current = null;
      }
      knockToastIdsRef.current.clear();
    };
  }, [currentUserId, joinStatus, normalizedRoomId, respondToWaitingUser, roomHostId]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (joinStatus === "checking") {
    return (
      <RoomGateShell>
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-300" />
        <h1 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
          Checking room access
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
          Preparing the waiting room gate...
        </p>
      </RoomGateShell>
    );
  }

  if (joinStatus === "waiting") {
    return (
      <RoomGateShell>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
          <DoorOpen size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
          You are in the waiting room
        </h1>
        <p className="mt-2 max-w-sm text-center text-sm leading-6 text-slate-500 dark:text-gray-400">
          Please wait, the host will let you in soon. Keep this tab open while your request is pending.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
          <Loader2 className="h-4 w-4 animate-spin text-purple-600 dark:text-purple-300" />
          Waiting for host approval
        </div>
      </RoomGateShell>
    );
  }

  if (joinStatus === "declined") {
    return (
      <RoomGateShell>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
          <DoorOpen size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
          Room request declined
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-gray-400">
          Redirecting you back to study rooms.
        </p>
      </RoomGateShell>
    );
  }

  if (!liveKitToken || !liveKitUrl) {
    return (
      <RoomGateShell>
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-300" />
        <h1 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
          Joining study room
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
          Fetching your LiveKit access token...
        </p>
      </RoomGateShell>
    );
  }

  return (
    <LiveVideoRoom
      roomId={liveKitRoomName || normalizedRoomId}
      token={liveKitToken}
      liveKitUrl={liveKitUrl}
      currentUserId={currentUserId}
      userName={currentUserName}
      hostId={roomHostId}
      autoJoin={isStudyBuddyRoom}
      isHost={Boolean((apiCurrentUserId || sessionUserId || guestUserId) && roomHostId && (apiCurrentUserId || sessionUserId || guestUserId) === roomHostId)}
      renderAction={(liveRoom: LiveVideoRoomRenderState) => (
        (() => {
          const hasScreenShare = liveRoom.isScreenSharing || Boolean(liveRoom.remoteScreenUser);

          return (
        <div className="fixed inset-0 z-50 overflow-hidden flex flex-col font-sans transition-colors duration-300
          bg-slate-50 text-slate-900 
          dark:bg-[#0f0c1d] dark:text-white">
      
      {/* ── Background Ambience (Dark Only) ── */}
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#8c30e8]/5 rounded-full blur-[120px]" />
      </div>

      {/* ── Top Bar ── */}
      <header className="relative z-20 flex items-center justify-between px-4 md:px-6 py-3 border-b backdrop-blur-md transition-colors
        bg-white/80 border-slate-200
        dark:bg-[#0f0a16]/80 dark:border-white/5">
        
        {/* Left: Room Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-colors
              bg-purple-100 text-purple-600
              dark:bg-[#7C3AED]   dark:text-white">
              SB
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                Study Room {normalizedRoomId}
                <span className="px-1.5 py-0.5 rounded text-[10px] border font-mono transition-colors
                  bg-red-50 text-red-500 border-red-200
                  dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">LIVE</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {isRoomLoading ? "Loading Room..." : roomTopic || "Study Room"}
              </p>
            </div>
          </div>
          
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10 mx-2 hidden md:block" />
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono transition-colors
            bg-slate-100 border-slate-200 text-slate-600
            dark:bg-white/5 dark:border-white/10 dark:text-gray-300">
            <Clock size={14} className="text-purple-500" />
            <span>{formatTime(seconds)}</span>
          </div>
        </div>

        {/* Center: Tabs */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1 p-1 rounded-xl border shadow-sm transition-colors
          bg-white border-slate-200
          dark:bg-[#1a1524] dark:border-white/10">
          <button 
            onClick={() => setActiveTab("chat")} 
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'chat' 
              ? 'bg-slate-100 text-slate-900 shadow-sm dark:bg-white/10 dark:text-white' 
              : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'}`}
          >
            <MessageSquare size={14} /> Chat
          </button>
          <button 
            onClick={() => setActiveTab("vault")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'vault' 
              ? 'bg-slate-100 text-slate-900 shadow-sm dark:bg-white/10 dark:text-white' 
              : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'}`}
          >
            <FolderOpen size={14} /> Vault
          </button>
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {liveRoom.isHost ? (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={liveRoom.muteAllParticipants}
                disabled={liveRoom.isModeratingAllParticipants}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition-all hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
              >
                <MicOff size={15} /> Mute All
              </button>
              <button
                onClick={liveRoom.unmuteAllParticipants}
                disabled={liveRoom.isModeratingAllParticipants}
                className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 transition-all hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-500/20"
              >
                <Mic size={15} /> Unmute All
              </button>
            </div>
          ) : null}
          <button onClick={() => void liveRoom.leaveRoom()} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2">
            <PhoneOff size={16} /> <span className="hidden sm:inline">{liveRoom.leaveButtonLabel}</span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <main className="relative z-10 flex-1 min-h-0 flex overflow-hidden">
        
        {/* LEFT: Collaboration Canvas */}
        <motion.section layout className="flex-1 min-w-0 relative flex flex-col transition-colors duration-300
          bg-slate-100 dark:bg-[#130d1a]">
          
          {/* Canvas Area (Screen Share) */}
          <div className="flex-1 min-h-0 relative overflow-hidden p-4">
            {hasScreenShare ? (
              <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="flex min-h-0 flex-col rounded-2xl border shadow-sm transition-colors
                  bg-white border-slate-200
                  dark:bg-black/40 dark:border-white/10 dark:shadow-none">
                  <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl p-3">
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg shadow-red-500/20">LIVE</span>
                      <div className="px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md transition-colors
                        bg-slate-100 text-slate-900 border border-slate-200
                        dark:bg-black/60 dark:text-white dark:border-white/10">
                        {liveRoom.isScreenSharing
                          ? "You are sharing your screen"
                          : liveRoom.remoteScreenUser
                          ? `A participant is sharing`
                          : "No active screen share"}
                      </div>
                    </div>

                    <div className="h-full w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#110d1b]">
                      <div className="h-full w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 dark:border-white/10 relative">
                        {liveRoom.isScreenSharing && liveRoom.screenTrack ? (
                          <NativeStreamPlayer stream={liveRoom.screenTrack} muted className="h-full w-full object-cover" />
                        ) : liveRoom.remoteScreenUser ? (
                          <NativeStreamPlayer stream={liveRoom.remoteScreenUser} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-slate-200">
                            Welcome to Study Room
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  drag
                  dragConstraints={{ left: -220, right: 40, top: -120, bottom: 120 }}
                  dragElastic={0.18}
                  className="flex min-h-0 flex-col gap-4 rounded-2xl border shadow-sm transition-colors
                  bg-white border-slate-200
                  dark:bg-[#110d1b] dark:border-white/10 cursor-grab active:cursor-grabbing"
                >
                  <div className="px-4 pt-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors dark:border-white/10 dark:bg-white/5">
                      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                        Camera Rail
                      </div>
                      <div className="flex max-h-[calc(100vh-280px)] flex-col gap-3 overflow-y-auto pr-1">
                        <motion.div
                          layout
                          transition={{ type: "spring", stiffness: 240, damping: 22 }}
                          className={`relative overflow-hidden border shadow-sm transition-all
                            bg-white border-slate-200
                            dark:bg-zinc-800 dark:border-white/10 ring-2 ring-purple-500 dark:shadow-[0_0_0_2px_#ffd700] ${
                              isLocalVideoMinimized ? "h-24 w-36 rounded-lg" : "aspect-video w-full rounded-xl"
                            }`}
                        >
                          <button
                            onClick={() => setIsLocalVideoMinimized((prev) => !prev)}
                            className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-1 text-white hover:bg-black/80 z-20"
                            aria-label={isLocalVideoMinimized ? "Expand local video" : "Minimize local video"}
                          >
                            <Minus size={12} />
                          </button>

                          {!isLocalVideoMinimized ? (
                            liveRoom.localStream ? (
                              <NativeStreamPlayer stream={liveRoom.localStream} muted className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-slate-200">
                                Camera unavailable
                              </div>
                            )
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-900/80">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                                {String(currentUserName || "Y").slice(0, 1).toUpperCase()}
                              </div>
                            </div>
                          )}

                          <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs backdrop-blur-md transition-colors
                            bg-white/80 text-slate-900 font-bold
                            dark:bg-black/50 dark:text-white dark:font-normal">
                            {currentUserName}
                          </div>
                        </motion.div>

                        {liveRoom.remoteParticipantCards}

                        {(!liveRoom.remoteParticipantCards || liveRoom.remoteParticipantCards.length === 0) ? (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
                            Waiting for participants...
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="w-full h-full rounded-2xl border flex items-center justify-center flex-col gap-4 relative overflow-hidden transition-colors shadow-sm
                bg-white border-slate-200
                dark:bg-black/40 dark:border-white/10 dark:shadow-none">
                
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg shadow-red-500/20">LIVE</span>
                  <div className="px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md transition-colors
                    bg-slate-100 text-slate-900 border border-slate-200
                    dark:bg-black/60 dark:text-white dark:border-white/10">
                    No active screen share
                  </div>
                </div>
                
                <div className="h-[90%] w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#110d1b]">
                  <div className="h-full w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 dark:border-white/10 relative">
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-200">
                      Welcome to Study Room
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Video Strip */}
          {!hasScreenShare ? (
            <div className="h-48 flex gap-4 overflow-x-auto pb-4 px-4">
              {/* My Local Video */}
              <div
                className="aspect-video h-full rounded-xl relative overflow-hidden flex-shrink-0 border shadow-sm transition-all
                  bg-white border-slate-200
                  dark:bg-zinc-800 dark:border-white/10 ring-2 ring-purple-500 dark:shadow-[0_0_0_2px_#ffd700]"
              >
                {liveRoom.localStream ? (
                  <NativeStreamPlayer stream={liveRoom.localStream} muted className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-200">
                    Camera unavailable
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs backdrop-blur-md transition-colors
                  bg-white/80 text-slate-900 font-bold
                  dark:bg-black/50 dark:text-white dark:font-normal">
                  {currentUserName}
                </div>
              </div>

              {/* Remote Videos */}
              {liveRoom.remoteParticipantCards}

              {/* Waiting State */}
              {(!liveRoom.remoteParticipantCards || liveRoom.remoteParticipantCards.length === 0) ? (
                <div className="aspect-video h-full rounded-xl relative overflow-hidden flex-shrink-0 border shadow-sm transition-all bg-slate-100 border-dashed border-slate-300 text-slate-500 flex items-center justify-center text-xs">
                  Waiting for participants...
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Host Management Panel */}
          {liveRoom.isHost ? (
            <div className="px-4 pb-4">
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:bg-[#1a1524] dark:border-white/10">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                    Manage Participants
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={liveRoom.muteAllParticipants}
                      disabled={liveRoom.isModeratingAllParticipants}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <MicOff size={14} /> Mute All
                    </button>
                    <button
                      onClick={liveRoom.unmuteAllParticipants}
                      disabled={liveRoom.isModeratingAllParticipants}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#8c30e8]"
                    >
                      <Mic size={14} /> Unmute All
                    </button>
                  </div>
                </div>
                {(!liveRoom.remoteParticipantCards || liveRoom.remoteParticipantCards.length === 0) ? (
                  <p className="text-xs text-slate-500 dark:text-gray-400">No participants to manage.</p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-gray-400">Use the mic icon on each video card for one participant, or update everyone at once here.</p>
                )}
              </div>
            </div>
          ) : null}

          {/* Bottom Floating Controls */}
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: -500, bottom: 0 }}
            dragElastic={0.2}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl shadow-2xl border backdrop-blur-xl transition-colors
              bg-white/90 border-slate-200
              dark:bg-[#191121]/90 dark:border-white/10">
              
              <ControlBtn isActive={liveRoom.isMicEnabled} onClick={liveRoom.toggleMic} iconOn={Mic} iconOff={MicOff} />
              <ControlBtn isActive={liveRoom.isCameraEnabled} onClick={liveRoom.toggleCamera} iconOn={Video} iconOff={VideoOff} />
              
              <div className="w-[1px] h-8 bg-slate-200 dark:bg-white/10 mx-2" />
              
              <button onClick={liveRoom.toggleScreenShare} className="flex flex-col items-center gap-1 group px-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110
                  bg-purple-600 text-white
                  dark:bg-[#8c30e8]">
                  <MonitorUp size={18} />
                </div>
                <span className="text-[10px] font-medium text-purple-600 dark:text-[#8c30e8]">
                  {liveRoom.isScreenSharing ? "Sharing" : "Share"}
                </span>
              </button>

              <div className="w-[1px] h-8 bg-slate-200 dark:bg-white/10 mx-2" />
              
              <button 
                onClick={() => setShowChat(!showChat)}
                className={`p-3 rounded-xl transition-all ${
                  showChat 
                  ? 'bg-purple-100 text-purple-600 dark:bg-[#8c30e8] dark:text-white' 
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-white/10'}`}
              >
                <MessageSquare size={20} />
              </button>
            </div>
          </motion.div>
        </motion.section>

        {/* RIGHT: Sidebar (Video + Chat) */}
        <AnimatePresence>
          {showChat && (
            <motion.aside 
              layout
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex flex-col shadow-xl z-20 border-l transition-colors
                bg-white border-slate-200
                dark:bg-[#0f0a16] dark:border-white/5"
            >
              {activeTab === "vault" ? (
                <VaultView
                  senderName={currentUserName}
                  sharedFiles={liveRoom.sharedFiles}
                  onShareFile={liveRoom.shareVaultFile}
                />
              ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Chat Container */}
                <div className="px-4 py-3 border-b flex justify-between items-center transition-colors
                  bg-white border-slate-100
                  dark:bg-[#130d1a]/50 dark:border-white/5">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Room Chat</h3>
                </div>
                
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {(!liveRoom.messages || liveRoom.messages.length === 0) ? (
                    <div className="flex justify-center">
                      <span className="text-[10px] px-2 py-1 rounded-full transition-colors
                        bg-slate-100 text-slate-500
                        dark:bg-white/5 dark:text-gray-500">No messages yet</span>
                    </div>
                  ) : (
                    liveRoom.messages.map((message: any) => {
                      const isMine = String(message?.senderId || "") === currentUserId;

                      return (
                        <div key={String(message?.id)} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm transition-colors ${
                            isMine
                              ? "bg-purple-600 text-white dark:bg-[#8c30e8]"
                              : "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-gray-100"
                          }`}>
                            {String(message?.text || "")}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t transition-colors
                  bg-white border-slate-100
                  dark:bg-[#130d1a] dark:border-white/5">
                  <div className="relative flex items-center gap-2 rounded-full px-2 py-1 pr-1 border transition-colors
                    bg-slate-50 border-slate-200
                    dark:bg-[#1a1524] dark:border-white/10">
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const trimmedMessage = chatInput.trim();
                          if (!trimmedMessage) return;
                          liveRoom.sendMessage(trimmedMessage);
                          setChatInput("");
                        }
                      }}
                      className="flex-1 bg-transparent border-none text-sm focus:ring-0 py-2.5 pl-3 transition-colors
                        text-slate-900 placeholder-slate-400
                        dark:text-white dark:placeholder-gray-600"
                    />
                    <button
                      onClick={() => {
                        const trimmedMessage = chatInput.trim();
                        if (!trimmedMessage) return;
                        liveRoom.sendMessage(trimmedMessage);
                        setChatInput("");
                      }}
                      className="p-2 rounded-full text-white transition-colors bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8]"
                    >
                        <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </main>
    </div>
      );
        })()
      )}
    />
  );
}

function RoomGateShell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-4 text-slate-900 dark:bg-[#0f0c1d] dark:text-white">
      <div className="absolute inset-0 pointer-events-none opacity-0 transition-opacity dark:opacity-100">
        <div className="absolute left-[-10%] top-[-20%] h-[560px] w-[560px] rounded-full bg-[#8c30e8]/10 blur-[120px]" />
      </div>
      <div className="relative flex w-full max-w-md flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-[#161027]">
        {children}
      </div>
    </div>
  );
}

// Button Component
function ControlBtn({ isActive, onClick, iconOn: IconOn, iconOff: IconOff }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:brightness-110'
          : 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20'
      }`}
    >
      {isActive ? <IconOn size={20} /> : <IconOff size={20} />}
    </button>
  );
}

