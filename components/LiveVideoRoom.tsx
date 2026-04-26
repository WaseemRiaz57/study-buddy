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
import { Mic, MicOff, Minus, Video, VideoOff } from "lucide-react";

// 🚨 UPDATE THIS URL TO YOUR RENDER BACKEND
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://studybuddy-backend-pl2i.onrender.com";

type LiveVideoRoomProps = {
  roomId: string;
  isHost?: boolean;
  currentUserId?: string;
  userName?: string;
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
  remoteScreenUser: MediaStream | null;
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

function isScreenTrack(track?: MediaStreamTrack | null): boolean {
  if (!track) return false;
  const label = String(track.label || "").toLowerCase();
  const hint = String((track as any).contentHint || "").toLowerCase();
  return (
    label.includes("screen") ||
    label.includes("window") ||
    label.includes("display") ||
    hint.includes("detail")
  );
}

function getScreenTrackFromStreams(streams: MediaStream[]): MediaStreamTrack | null {
  for (const stream of streams || []) {
    const track = stream.getVideoTracks().find((t) => isScreenTrack(t));
    if (track) return track;
  }
  return null;
}

function getCameraOnlyStream(stream?: MediaStream | null): MediaStream | null {
  if (!stream) return null;
  const cameraTrack = stream.getVideoTracks().find((t) => !isScreenTrack(t));
  if (!cameraTrack) return null;
  const audioTracks = stream.getAudioTracks();
  return new MediaStream([cameraTrack, ...audioTracks]);
}

export default function LiveVideoRoom({
  roomId,
  isHost: isHostProp,
  currentUserId,
  userName,
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
  const displayName = String(userName || `User ${effectiveCurrentUserId.substring(0, 4)}` || "User").trim();
  const normalizedHostId = String(hostId || "").trim();
  const isHost = typeof isHostProp === "boolean" 
    ? isHostProp 
    : Boolean(effectiveCurrentUserId && normalizedHostId && effectiveCurrentUserId === normalizedHostId);

  // States
  const [isConnected, setIsConnected] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
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
  const [remoteScreenUser, setRemoteScreenUser] = useState<MediaStream | null>(null);

  // Refs
  const socketRef = useRef<any>();
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const remoteScreenOwnerRef = useRef<string | null>(null);
  const peersRef = useRef<{ peerID: string, peer: Peer.Instance }[]>([]);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const attachPeerTrackHandlers = useCallback((peer: Peer.Instance, peerID: string) => {
    peer.on("track", (track: MediaStreamTrack) => {
      if (track.kind !== "video") return;

      if (isScreenTrack(track)) {
        remoteScreenOwnerRef.current = peerID;
        setRemoteScreenUser(new MediaStream([track]));

        track.onended = () => {
          if (remoteScreenOwnerRef.current === peerID) {
            remoteScreenOwnerRef.current = null;
            setRemoteScreenUser(null);
          }
        };
      }
    });
  }, []);

  // Effect 1: Media only (pre-join preview)
  useEffect(() => {
    let isActive = true;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setLocalStream(stream);
        streamRef.current = stream;
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        console.log("[Media] Local tracks ready:", {
          hasAudioTrack: Boolean(audioTrack),
          hasVideoTrack: Boolean(videoTrack),
          audioTrackState: audioTrack?.readyState,
          audioTrackEnabled: audioTrack?.enabled,
        });
        setIsMicEnabled(audioTrack ? audioTrack.enabled : true);
        setIsCameraEnabled(videoTrack ? videoTrack.enabled : true);
        setIsJoining(false);
      })
      .catch((err) => {
        console.error("Media error:", err);
        alert("Please allow camera and microphone access.");
        setIsJoining(false);
      });

    return () => {
      isActive = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!previewVideoRef.current || !localStream) return;
    previewVideoRef.current.srcObject = localStream;
  }, [localStream]);

  // Effect 2: Socket + WebRTC (only after explicit join)
  useEffect(() => {
    if (!hasJoined || !effectiveCurrentUserId || !roomId) return;

    setIsJoining(true);
    socketRef.current = io(SOCKET_SERVER_URL);
    setIsConnected(true);

    socketRef.current.emit("join-room", {
      roomId,
      userId: effectiveCurrentUserId,
      name: displayName
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

      if (signal.type === 'screen-toggle') {
        if (signal.isSharing) {
          remoteScreenOwnerRef.current = from;
          const remotePeer = peersRef.current.find((p) => p.peerID === from);
          const remoteStreams = remotePeer?.peer?._remoteStreams || [];
          const remoteScreenTrack = getScreenTrackFromStreams(remoteStreams);
          setRemoteScreenUser(remoteScreenTrack ? new MediaStream([remoteScreenTrack]) : null);
        } else {
          if (remoteScreenOwnerRef.current === from) {
            remoteScreenOwnerRef.current = null;
            setRemoteScreenUser(null);
          }
        }
        return;
      }

      const existingPeer = peersRef.current.find(p => p.peerID === from);

      if (signal.type === 'offer') {
        const peer = addPeer(signal, from, streamRef.current);
        attachPeerTrackHandlers(peer, from);
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
      if (remoteScreenOwnerRef.current === socketId) {
        remoteScreenOwnerRef.current = null;
        setRemoteScreenUser(null);
      }
    });

    socketRef.current.on("room-ended", () => {
      alert("This session was ended by the host.");
      window.location.href = '/dashboard/study-rooms';
    });

    socketRef.current.on("you-are-kicked", () => {
      alert("You have been removed by the host.");
      window.location.href = '/dashboard/study-rooms';
    });

    setIsJoining(false);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      peersRef.current.forEach(p => { if (!p.peer.destroyed) p.peer.destroy(); });
      peersRef.current = [];
      setPeers([]);
      setParticipants([]);
      remoteScreenOwnerRef.current = null;
      setRemoteScreenUser(null);
      setIsConnected(false);
    };
  }, [attachPeerTrackHandlers, hasJoined, roomId, effectiveCurrentUserId, displayName]);

  function createPeer(userToSignal: string, callerID: string, stream: MediaStream | null) {
    console.log("[Publisher] Creating outbound peer:", {
      to: userToSignal,
      hasLocalAudio: Boolean(stream?.getAudioTracks()?.length),
      hasLocalVideo: Boolean(stream?.getVideoTracks()?.length),
    });
    const peer = new Peer({ initiator: true, trickle: true, stream: stream || undefined, config: { iceServers } });
    peer.on("signal", signal => {
      socketRef.current?.emit("webrtc-signal", { signal, to: userToSignal });
    });
    peer.on("connect", () => {
      console.log("[Publisher] Peer connected:", userToSignal);
    });
    peer.on("error", (err) => {
      console.error("[Publisher] Peer error:", userToSignal, err);
    });
    attachPeerTrackHandlers(peer, userToSignal);
    return peer;
  }

  function addPeer(incomingSignal: any, callerID: string, stream: MediaStream | null) {
    console.log("[Subscriber] Creating inbound peer:", {
      from: callerID,
      hasLocalAudio: Boolean(stream?.getAudioTracks()?.length),
      hasLocalVideo: Boolean(stream?.getVideoTracks()?.length),
    });
    const peer = new Peer({ initiator: false, trickle: true, stream: stream || undefined, config: { iceServers } });
    peer.on("signal", signal => {
      socketRef.current?.emit("webrtc-signal", { signal, to: callerID });
    });
    peer.on("connect", () => {
      console.log("[Subscriber] Peer connected:", callerID);
    });
    peer.on("error", (err) => {
      console.error("[Subscriber] Peer error:", callerID, err);
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

  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const newScreenTrack = screenStream.getVideoTracks()[0];

      // Keep camera track intact and publish screen as a separate track.
      setScreenTrack(newScreenTrack);
      screenStreamRef.current = screenStream;

      if (newScreenTrack && screenStreamRef.current) {
        peersRef.current.forEach((p) => {
          if (!p.peer.destroyed) {
            try {
              p.peer.addTrack(newScreenTrack, screenStreamRef.current);
            } catch (err) {
              console.error("Failed to add screen track:", err);
            }
          }
        });
      }

      peersRef.current.forEach((p) => {
        socketRef.current?.emit('webrtc-signal', {
          signal: { type: 'screen-toggle', isSharing: true },
          to: p.peerID,
        });
      });

      newScreenTrack.onended = () => {
        if (newScreenTrack && screenStreamRef.current) {
          peersRef.current.forEach((p) => {
            if (!p.peer.destroyed) {
              try {
                p.peer.removeTrack(newScreenTrack, screenStreamRef.current as MediaStream);
              } catch (err) {
                console.error("Failed to remove screen track:", err);
              }
            }
          });
        }

        peersRef.current.forEach((p) => {
          socketRef.current?.emit('webrtc-signal', {
            signal: { type: 'screen-toggle', isSharing: false },
            to: p.peerID,
          });
        });

        setScreenTrack(null);
        setIsScreenSharing(false);
        screenStreamRef.current = null;
      };

      setIsScreenSharing(true);
      return;
    }

    if (screenTrack) {
      screenTrack.onended = null;
      if (screenStreamRef.current) {
        peersRef.current.forEach((p) => {
          if (!p.peer.destroyed) {
            try {
              p.peer.removeTrack(screenTrack, screenStreamRef.current as MediaStream);
            } catch (err) {
              console.error("Failed to remove screen track:", err);
            }
          }
        });
      }

      screenTrack.stop();
      peersRef.current.forEach((p) => {
        socketRef.current?.emit('webrtc-signal', {
          signal: { type: 'screen-toggle', isSharing: false },
          to: p.peerID,
        });
      });

      setScreenTrack(null);
      setIsScreenSharing(false);
      screenStreamRef.current = null;
      return;
    }

    setScreenTrack(null);
    setIsScreenSharing(false);
    screenStreamRef.current = null;
  }, [isScreenSharing, screenTrack]);

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

    try {
      await fetch("/api/buddies/requests/end", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: roomId }),
      });

      if (isHost) {
        setIsEndingSession(true);
        socketRef.current?.emit("end-room", { roomId });
        await updateSessionDatabase();
      }
    } catch (error) {
      console.error("Leave Room Error:", error);
    } finally {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
      socketRef.current?.disconnect();
      router.push("/dashboard/study-buddy");
    }
  }, [isLeaving, isHost, roomId, router, updateSessionDatabase]);

  const handleCancelPreJoin = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setLocalStream(null);
    setHasJoined(false);
    router.push("/dashboard/study-buddy");
  }, [router]);

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
    remoteScreenUser,
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

  if (!hasJoined) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 text-slate-900 dark:bg-[#0f0c1d] dark:text-white p-4">
        <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#161027]">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ready to join?</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">Check your camera and microphone before entering the room.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 aspect-video dark:border-white/10">
            <video ref={previewVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={toggleMic}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                isMicEnabled
                  ? "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              {isMicEnabled ? <Mic size={16} /> : <MicOff size={16} />}
              {isMicEnabled ? "Mic On" : "Mic Off"}
            </button>

            <button
              onClick={toggleCamera}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                isCameraEnabled
                  ? "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              {isCameraEnabled ? <Video size={16} /> : <VideoOff size={16} />}
              {isCameraEnabled ? "Camera On" : "Camera Off"}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={handleCancelPreJoin}
              type="button"
              className="rounded-xl border border-slate-300 bg-slate-100 px-7 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            >
              Cancel
            </button>
            <button
              onClick={() => setHasJoined(true)}
              disabled={!localStream || isJoining}
              type="button"
              className="rounded-xl bg-gradient-to-r from-[#8c30e8] to-[#6f4bff] px-7 py-3 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isJoining ? "Preparing..." : "Join Room"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{renderAction(renderState)}</>;
}

// Sub-component for rendering incoming WebRTC streams
const VideoPeer = ({ peer, name, isHost, onRemove }: any) => {
  const ref = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastCameraStreamRef = useRef<MediaStream | null>(null);
  const [hasStream, setHasStream] = useState(false); 
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!peer || peer.destroyed) return;

    const attachStream = (stream: MediaStream) => {
      if (ref.current && stream) {
        const cameraOnly = getCameraOnlyStream(stream);
        if (!cameraOnly) {
          return;
        }
        lastCameraStreamRef.current = cameraOnly;
        ref.current.srcObject = cameraOnly;
        setHasStream(true);
        ref.current.play().catch(e => console.warn("Autoplay blocked:", e));
      }

      if (audioRef.current && stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          const remoteAudioStream = new MediaStream([audioTrack]);
          audioRef.current.srcObject = remoteAudioStream;
          audioRef.current.muted = false;
          audioRef.current.volume = 1;
          audioRef.current
            .play()
            .then(() => {
              console.log("[Subscriber] Remote microphone track playing:", {
                participant: name,
                trackState: audioTrack.readyState,
                enabled: audioTrack.enabled,
              });
            })
            .catch((error) => {
              console.error("[Subscriber] Remote microphone playback failed:", {
                participant: name,
                error,
              });
            });
        }
      }
    };

    peer.on("stream", attachStream);
    peer.on("track", (track: any, stream: MediaStream) => {
      if (track?.kind === "audio") {
        console.log("[Subscriber] Remote microphone track subscribed:", {
          participant: name,
          trackState: track.readyState,
          enabled: track.enabled,
        });
      }
      if (stream) attachStream(stream);
    });

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
          <audio ref={audioRef} autoPlay playsInline className="hidden" />

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