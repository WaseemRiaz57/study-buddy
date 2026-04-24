// @ts-nocheck
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { Minus } from "lucide-react";

// 🚨 UPDATE THIS URL TO YOUR RENDER BACKEND
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://studybuddy-backend-pl2i.onrender.com";

type LiveVideoRoomProps = {
  roomId: string;
  isHost?: boolean;
  currentUserId?: string;
  hostId?: string;
  userId?: string;
  renderAction: (state: LiveVideoRoomRenderState) => ReactNode;
};

// Adapted Render State for Native WebRTC
export type LiveVideoRoomRenderState = {
  isConnected: boolean;
  isJoining: boolean;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  remoteScreenUser: any; 
  screenTrack: MediaStreamTrack | null;
  localStream: MediaStream | null; 
  currentUserId: string;
  hostId: string;
  isHost: boolean;
  messages: any[];
  remoteParticipantCards: ReactNode[];
  leaveButtonLabel: string;
  isEndingSession: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  sendMessage: (text: string) => void;
  removeParticipant: (participantUid: string | number) => void;
  leaveRoom: () => Promise<void>;
};

const iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" }
];

export default function LiveVideoRoom({
  roomId,
  isHost: isHostProp,
  currentUserId,
  hostId,
  userId,
  renderAction,
}: LiveVideoRoomProps) {
  const router = useRouter();
  const [stableGuestId] = useState(() => {
    try {
      const existingId = sessionStorage.getItem("studyBuddyId");
      if (existingId) return existingId;

      const generatedId = `Guest-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("studyBuddyId", generatedId);
      return generatedId;
    } catch {
      return `Guest-${Math.random().toString(36).slice(2, 10)}`;
    }
  });
  
  const effectiveCurrentUserId = String(currentUserId || userId || stableGuestId || "").trim();
  const normalizedHostId = String(hostId || "").trim();
  const isHost = typeof isHostProp === "boolean" 
    ? isHostProp 
    : Boolean(effectiveCurrentUserId && normalizedHostId && effectiveCurrentUserId === normalizedHostId);

  // States
  const [isConnected, setIsConnected] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState<MediaStreamTrack | null>(null);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState([]);
  const [peers, setPeers] = useState<{ peerID: string, peer: Peer.Instance }[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Refs
  const socketRef = useRef<any>();
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ peerID: string, peer: Peer.Instance }[]>([]);

  // Initialize Connection
  useEffect(() => {
    if (!effectiveCurrentUserId || !roomId) return;

    socketRef.current = io(SOCKET_SERVER_URL);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        streamRef.current = stream;
        setIsJoining(false);
        setIsConnected(true);

        socketRef.current.emit("join-room", { 
          roomId, 
          userId: effectiveCurrentUserId, 
          name: `User ${effectiveCurrentUserId.substring(0, 4)}` 
        });

        socketRef.current.on("room-users", (users) => {
          setParticipants(users);
          const currentSocketIds = users.map((u: any) => u.socketId);
          
          // Cleanup stale peers
          peersRef.current = peersRef.current.filter(p => {
            if (!currentSocketIds.includes(p.peerID)) {
              if (!p.peer.destroyed) p.peer.destroy();
              return false;
            }
            return true;
          });

          // Connect to new peers
          const mySocketId = socketRef.current.id;
          users.forEach((otherUser: any) => {
            if (otherUser.socketId !== mySocketId) {
              const existingPeer = peersRef.current.find(p => p.peerID === otherUser.socketId);
              if (!existingPeer && mySocketId < otherUser.socketId) {
                const peer = createPeer(otherUser.socketId, mySocketId, streamRef.current);
                peersRef.current.push({ peerID: otherUser.socketId, peer });
              }
            }
          });
          setPeers([...peersRef.current]);
        });

        socketRef.current.on("webrtc-signal", (payload: any) => {
          const { signal, from } = payload;

          if (signal.type === 'kick') {
            alert('You have been removed by the host.');
            window.location.href = '/dashboard/study-rooms';
            return;
          }

          if (signal.type === 'chat') {
            setMessages((prev) => [
              ...prev,
              { id: Date.now(), senderId: signal.senderId, text: signal.text },
            ]);
            return;
          }

          const existingPeer = peersRef.current.find(p => p.peerID === from);

          if (signal.type === 'offer') {
            const peer = addPeer(signal, from, streamRef.current);
            peersRef.current.push({ peerID: from, peer });
            setPeers([...peersRef.current]);
          } else if (existingPeer && !existingPeer.peer.destroyed) {
            try { existingPeer.peer.signal(signal); } catch (e) { console.error(e); }
          }
        });

        socketRef.current.on("user-left", (socketId: string) => {
          const peerObj = peersRef.current.find(p => p.peerID === socketId);
          if (peerObj && !peerObj.peer.destroyed) peerObj.peer.destroy();
          peersRef.current = peersRef.current.filter(p => p.peerID !== socketId);
          setPeers((prev) => prev.filter((p) => p.peerID !== socketId));
          setParticipants((prev: any[]) => prev.filter((p) => p.socketId !== socketId));
        });

        socketRef.current.on("room-ended", () => {
          alert("This session was ended by the host.");
          window.location.href = '/dashboard/study-rooms';
        });

        socketRef.current.on("you-are-kicked", () => {
          alert("You have been removed by the host.");
          window.location.href = '/dashboard/study-rooms';
        });

      })
      .catch((err) => {
        console.error("Media error:", err);
        alert("Please allow camera and microphone access.");
        setIsJoining(false);
      });

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (socketRef.current) socketRef.current.disconnect();
      peersRef.current.forEach(p => { if (!p.peer.destroyed) p.peer.destroy(); });
    };
  }, [roomId, effectiveCurrentUserId]);

  function createPeer(userToSignal: string, callerID: string, stream: MediaStream | null) {
    const peer = new Peer({ initiator: true, trickle: true, stream: stream || undefined, config: { iceServers } });
    peer.on("signal", signal => {
      socketRef.current?.emit("webrtc-signal", { signal, to: userToSignal });
    });
    return peer;
  }

  function addPeer(incomingSignal: any, callerID: string, stream: MediaStream | null) {
    const peer = new Peer({ initiator: false, trickle: true, stream: stream || undefined, config: { iceServers } });
    peer.on("signal", signal => {
      socketRef.current?.emit("webrtc-signal", { signal, to: callerID });
    });
    peer.signal(incomingSignal);
    return peer;
  }

  // Toggles
  const toggleMic = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicEnabled(audioTrack.enabled);
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraEnabled(videoTrack.enabled);
      }
    }
  }, []);

  const revertToCameraTrack = useCallback((activeScreenTrack?: MediaStreamTrack | null) => {
    const currentScreenTrack = activeScreenTrack || screenTrack;
    const oldCameraTrack = streamRef.current?.getVideoTracks()[0];

    if (currentScreenTrack && oldCameraTrack && streamRef.current) {
      peersRef.current.forEach((p) => {
        if (!p.peer.destroyed) {
          p.peer.replaceTrack(currentScreenTrack, oldCameraTrack, streamRef.current);
        }
      });
    }

    setScreenTrack(null);
    setIsScreenSharing(false);
  }, [screenTrack]);

  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const newScreenTrack = screenStream.getVideoTracks()[0];

      setScreenTrack(newScreenTrack);

      const oldCameraTrack = streamRef.current?.getVideoTracks()[0];

      if (oldCameraTrack && newScreenTrack && streamRef.current) {
        peersRef.current.forEach((p) => {
          if (!p.peer.destroyed) {
            p.peer.replaceTrack(oldCameraTrack, newScreenTrack, streamRef.current);
          }
        });
      }

      newScreenTrack.onended = () => {
        revertToCameraTrack(newScreenTrack);
      };

      setIsScreenSharing(true);
      return;
    }

    if (screenTrack) {
      screenTrack.stop();

      const oldCameraTrack = streamRef.current?.getVideoTracks()[0];
      if (oldCameraTrack && streamRef.current) {
        peersRef.current.forEach((p) => {
          if (!p.peer.destroyed) {
            p.peer.replaceTrack(screenTrack, oldCameraTrack, streamRef.current);
          }
        });
      }
    }

    setScreenTrack(null);
    setIsScreenSharing(false);
  }, [isScreenSharing, screenTrack, revertToCameraTrack]);

  const sendMessage = useCallback((text: string) => {
    const messageObject = { id: Date.now(), senderId: effectiveCurrentUserId, text };
    setMessages((prev) => [...prev, messageObject]);
    peersRef.current.forEach((p) => {
      socketRef.current?.emit('webrtc-signal', {
        signal: { type: 'chat', text, senderId: effectiveCurrentUserId },
        to: p.peerID,
      });
    });
  }, [effectiveCurrentUserId]);

  const removeParticipant = useCallback((participantUid: string | number) => {
    if (!isHost) return;
    socketRef.current?.emit('webrtc-signal', { signal: { type: 'kick' }, to: participantUid });
  }, [isHost]);

  // Leave & End Room
  const updateSessionDatabase = useCallback(async () => {
    if (!isHost) return;
    try {
      await fetch(`/api/study-rooms/${encodeURIComponent(roomId)}/end-session`, { method: "PATCH" });
    } catch (error) { console.error(error); }
  }, [isHost, roomId]);

  const leaveRoom = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    if (isHost) {
      setIsEndingSession(true);
      socketRef.current?.emit("end-room", { roomId });
      await updateSessionDatabase();
    }

    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    socketRef.current?.disconnect();
    router.push("/dashboard/study-rooms");
  }, [isLeaving, isHost, roomId, router, updateSessionDatabase]);

  // Render Remote Cards
  const remoteParticipantCards = useMemo(() => {
    return peers.map((peerObj) => {
      const remoteUser = participants.find((p: any) => p.socketId === peerObj.peerID);
      return <VideoPeer key={peerObj.peerID} peer={peerObj.peer} name={remoteUser?.name || 'User'} isHost={isHost} onRemove={() => removeParticipant(peerObj.peerID)} />;
    });
  }, [peers, participants, isHost, removeParticipant]);

  const renderState: LiveVideoRoomRenderState = {
    isConnected,
    isJoining,
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    remoteScreenUser: null, 
    screenTrack,
    localStream, 
    currentUserId: effectiveCurrentUserId,
    hostId: normalizedHostId,
    isHost,
    messages,
    remoteParticipantCards,
    leaveButtonLabel: isHost ? "End Session" : "Leave Room",
    isEndingSession,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendMessage,
    removeParticipant,
    leaveRoom,
  };

  return <>{renderAction(renderState)}</>;
}

// Sub-component for rendering incoming WebRTC streams
const VideoPeer = ({ peer, name, isHost, onRemove }: any) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [hasStream, setHasStream] = useState(false); 
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!peer || peer.destroyed) return;

    const attachStream = (stream: MediaStream) => {
      if (ref.current && stream) {
        ref.current.srcObject = stream;
        setHasStream(true);
        ref.current.play().catch(e => console.warn("Autoplay blocked:", e));
      }
    };

    peer.on("stream", attachStream);
    peer.on("track", (track: any, stream: MediaStream) => { if (stream) attachStream(stream); });

    if (peer._remoteStreams && peer._remoteStreams[0]) {
      attachStream(peer._remoteStreams[0]);
    }

    return () => {
      peer.off("stream", attachStream);
    };
  }, [peer]);

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className={`relative overflow-hidden flex-shrink-0 border shadow-sm transition-all bg-black border-slate-200 dark:border-white/10 ${
        isMinimized ? "h-24 w-36 rounded-lg" : "aspect-video h-full rounded-xl"
      }`}
    >
      <button
        onClick={() => setIsMinimized((prev) => !prev)}
        className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-1 text-white hover:bg-black/80 z-20"
        aria-label={isMinimized ? "Expand participant video" : "Minimize participant video"}
      >
        <Minus size={12} />
      </button>

      {!isMinimized ? (
        <>
          <video ref={ref} autoPlay playsInline className="h-full w-full object-cover" />

          {!hasStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/90 z-0">
              <span className="text-xs text-gray-400 font-medium animate-pulse">Connecting Video...</span>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-800/90">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
            {String(name || "U").slice(0, 1).toUpperCase()}
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs backdrop-blur-md bg-black/50 text-white font-normal z-10">
        {name}
      </div>

      {isHost && !isMinimized && (
        <button onClick={onRemove} className="absolute top-2 right-2 rounded-md bg-red-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-600 z-10">
          Remove
        </button>
      )}
    </motion.div>
  );
};