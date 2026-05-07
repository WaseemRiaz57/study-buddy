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
import {
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
} from "livekit-client";
import { motion } from "framer-motion";
import { Mic, MicOff, Minus, Video, VideoOff } from "lucide-react";

type LiveVideoRoomProps = {
  roomId: string;
  token?: string;
  liveKitUrl?: string;
  isHost?: boolean;
  currentUserId?: string;
  userName?: string;
  hostId?: string;
  userId?: string;
  renderAction: (state: LiveVideoRoomRenderState) => ReactNode;
};

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

function isPlaybackAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function getLocalStreamFromRoom(room: Room): MediaStream | null {
  const tracks: MediaStreamTrack[] = [];
  const cameraTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track
    ?.mediaStreamTrack;
  const microphoneTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone)
    ?.track?.mediaStreamTrack;

  if (cameraTrack) tracks.push(cameraTrack);
  if (microphoneTrack) tracks.push(microphoneTrack);

  return tracks.length > 0 ? new MediaStream(tracks) : null;
}

function getRemoteScreenStream(participants: RemoteParticipant[]): MediaStream | null {
  for (const participant of participants) {
    const screenTrack = participant.getTrackPublication(Track.Source.ScreenShare)?.track
      ?.mediaStreamTrack;

    if (screenTrack && screenTrack.readyState === "live") {
      return new MediaStream([screenTrack]);
    }
  }

  return null;
}

export default function LiveVideoRoom({
  roomId,
  token,
  liveKitUrl,
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
  const normalizedHostId = String(hostId || "").trim();
  const isHost =
    typeof isHostProp === "boolean"
      ? isHostProp
      : Boolean(effectiveCurrentUserId && normalizedHostId && effectiveCurrentUserId === normalizedHostId);

  const roomRef = useRef<Room | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const [hasJoined, setHasJoined] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState<MediaStreamTrack | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [remoteScreenUser, setRemoteScreenUser] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [roomVersion, setRoomVersion] = useState(0);

  const syncRoomState = useCallback((room: Room) => {
    const participants = Array.from(room.remoteParticipants.values());
    const localScreenPublication = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);

    setRemoteParticipants(participants);
    setRemoteScreenUser(getRemoteScreenStream(participants));
    setLocalStream(getLocalStreamFromRoom(room));
    setScreenTrack(localScreenPublication?.track?.mediaStreamTrack ?? null);
    setIsScreenSharing(Boolean(localScreenPublication?.track && !localScreenPublication.isMuted));
    setIsMicEnabled(room.localParticipant.isMicrophoneEnabled);
    setIsCameraEnabled(room.localParticipant.isCameraEnabled);
    setRoomVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        previewStreamRef.current = stream;
        setLocalStream(stream);
        setIsMicEnabled(stream.getAudioTracks()[0]?.enabled ?? true);
        setIsCameraEnabled(stream.getVideoTracks()[0]?.enabled ?? true);
        setIsJoining(false);
      })
      .catch((error) => {
        console.error("Media error:", error);
        alert("Please allow camera and microphone access.");
        setIsJoining(false);
      });

    return () => {
      isActive = false;
      previewStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!previewVideoRef.current || !localStream || hasJoined) return;
    previewVideoRef.current.srcObject = localStream;
  }, [hasJoined, localStream]);

  useEffect(() => {
    if (!hasJoined || !roomId || !token || !liveKitUrl) return;

    let isActive = true;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    roomRef.current = room;

    const subscribeToExistingPublications = () => {
      room.remoteParticipants.forEach((participant) => {
        participant.getTrackPublications().forEach((publication: RemoteTrackPublication) => {
          if (!publication.isSubscribed) {
            publication.setSubscribed(true);
          }
        });
      });
    };

    const handleRoomChanged = () => {
      subscribeToExistingPublications();
      syncRoomState(room);
    };

    const handleTrackSubscribed = (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      console.log("[LiveKit] trackSubscribed", {
        roomId,
        participant: participant.identity,
        source: publication.source,
        kind: track.kind,
      });
      syncRoomState(room);
    };

    const handleTrackUnsubscribed = () => {
      syncRoomState(room);
    };

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: unknown,
      topic?: string
    ) => {
      if (topic && topic !== "chat") return;

      try {
        const parsed = JSON.parse(new TextDecoder().decode(payload));
        setMessages((prev) => [
          ...prev,
          {
            id: parsed.id || Date.now(),
            senderId: parsed.senderId || participant?.identity || "remote",
            text: String(parsed.text || ""),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            senderId: participant?.identity || "remote",
            text: new TextDecoder().decode(payload),
          },
        ]);
      }
    };

    room
      .on(RoomEvent.ParticipantConnected, handleRoomChanged)
      .on(RoomEvent.ParticipantDisconnected, handleRoomChanged)
      .on(RoomEvent.TrackPublished, handleRoomChanged)
      .on(RoomEvent.TrackUnpublished, handleRoomChanged)
      .on(RoomEvent.TrackMuted, handleRoomChanged)
      .on(RoomEvent.TrackUnmuted, handleRoomChanged)
      .on(RoomEvent.LocalTrackPublished, handleRoomChanged)
      .on(RoomEvent.LocalTrackUnpublished, handleRoomChanged)
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.DataReceived, handleDataReceived)
      .on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
      });

    async function connectToRoom() {
      setIsJoining(true);

      try {
        await room.connect(liveKitUrl, token, { autoSubscribe: true });

        if (!isActive) {
          await room.disconnect();
          return;
        }

        const shouldEnableCamera = isCameraEnabled;
        const shouldEnableMic = isMicEnabled;

        previewStreamRef.current?.getTracks().forEach((track) => track.stop());
        previewStreamRef.current = null;

        await Promise.all([
          room.localParticipant.setCameraEnabled(shouldEnableCamera),
          room.localParticipant.setMicrophoneEnabled(shouldEnableMic),
        ]);

        await room.startAudio().catch((error) => {
          if (!isPlaybackAbortError(error)) {
            console.warn("[LiveKit] Audio playback needs a user gesture:", error);
          }
        });

        subscribeToExistingPublications();
        syncRoomState(room);
        setIsConnected(true);
      } catch (error) {
        console.error("[LiveKit] Failed to connect:", error);
        alert("Could not connect to the video room. Please check your LiveKit configuration.");
        setHasJoined(false);
      } finally {
        if (isActive) {
          setIsJoining(false);
        }
      }
    }

    void connectToRoom();

    return () => {
      isActive = false;
      room.disconnect();
      roomRef.current = null;
      setRemoteParticipants([]);
      setRemoteScreenUser(null);
      setScreenTrack(null);
      setIsConnected(false);
    };
  }, [hasJoined, roomId, token, liveKitUrl, syncRoomState]);

  const toggleMic = useCallback(() => {
    const room = roomRef.current;
    const nextEnabled = !isMicEnabled;

    if (room && isConnected) {
      void room.localParticipant.setMicrophoneEnabled(nextEnabled).then(() => syncRoomState(room));
      return;
    }

    previewStreamRef.current
      ?.getAudioTracks()
      .forEach((track) => {
        track.enabled = nextEnabled;
      });
    setIsMicEnabled(nextEnabled);
  }, [isConnected, isMicEnabled, syncRoomState]);

  const toggleCamera = useCallback(() => {
    const room = roomRef.current;
    const nextEnabled = !isCameraEnabled;

    if (room && isConnected) {
      void room.localParticipant.setCameraEnabled(nextEnabled).then(() => syncRoomState(room));
      return;
    }

    previewStreamRef.current
      ?.getVideoTracks()
      .forEach((track) => {
        track.enabled = nextEnabled;
      });
    setIsCameraEnabled(nextEnabled);
  }, [isCameraEnabled, isConnected, syncRoomState]);

  const toggleScreenShare = useCallback(() => {
    const room = roomRef.current;
    if (!room || !isConnected) return;

    const nextEnabled = !isScreenSharing;
    void room.localParticipant
      .setScreenShareEnabled(nextEnabled, { audio: true })
      .then(() => syncRoomState(room))
      .catch((error) => {
        if (nextEnabled) {
          console.error("[LiveKit] Screen share failed:", error);
        }
      });
  }, [isConnected, isScreenSharing, syncRoomState]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText) return;

      const message = {
        id: Date.now(),
        senderId: effectiveCurrentUserId,
        text: trimmedText,
      };

      setMessages((prev) => [...prev, message]);

      const room = roomRef.current;
      if (!room || !isConnected) return;

      void room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(message)),
        { reliable: true, topic: "chat" }
      );
    },
    [effectiveCurrentUserId, isConnected]
  );

  const removeParticipant = useCallback((participantUid: string | number) => {
    console.warn("Participant removal requires a server-side LiveKit RoomService endpoint.", participantUid);
  }, []);

  const updateSessionDatabase = useCallback(async () => {
    if (!isHost) return;
    try {
      await fetch(`/api/study-rooms/${encodeURIComponent(roomId)}/end-session`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error(error);
    }
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
        await updateSessionDatabase();
      }
    } catch (error) {
      console.error("Leave Room Error:", error);
    } finally {
      previewStreamRef.current?.getTracks().forEach((track) => track.stop());
      await roomRef.current?.disconnect();
      router.push("/dashboard/study-buddy");
    }
  }, [isHost, isLeaving, roomId, router, updateSessionDatabase]);

  const handleCancelPreJoin = useCallback(() => {
    previewStreamRef.current?.getTracks().forEach((track) => track.stop());
    previewStreamRef.current = null;
    setLocalStream(null);
    setHasJoined(false);
    router.push("/dashboard/study-buddy");
  }, [router]);

  const remoteParticipantCards = useMemo(
    () =>
      remoteParticipants.map((participant) => (
        <LiveKitRemoteParticipantCard
          key={participant.identity}
          participant={participant}
          isHost={isHost}
          onRemove={() => removeParticipant(participant.identity)}
          updateKey={roomVersion}
        />
      )),
    [isHost, remoteParticipants, removeParticipant, roomVersion]
  );

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
    const isJoinDisabled = !localStream || isJoining || !token || !liveKitUrl;

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
              disabled={isJoinDisabled}
              type="button"
              className="rounded-xl bg-gradient-to-r from-[#8c30e8] to-[#6f4bff] px-7 py-3 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isJoining || !token || !liveKitUrl ? "Preparing..." : "Join Room"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{renderAction(renderState)}</>;
}

function LiveKitRemoteParticipantCard({
  participant,
  isHost,
  onRemove,
  updateKey,
}: {
  participant: RemoteParticipant;
  isHost: boolean;
  onRemove: () => void;
  updateKey: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    const audioElement = audioRef.current;
    const videoTrack = participant.getTrackPublication(Track.Source.Camera)?.track;
    const audioTrack = participant.getTrackPublication(Track.Source.Microphone)?.track;

    if (videoElement && videoTrack) {
      videoTrack.attach(videoElement);
      setHasVideo(true);
      videoElement.play().catch((error) => {
        if (!isPlaybackAbortError(error)) {
          console.warn("[LiveKit] Remote video playback failed:", error);
        }
      });
    } else {
      setHasVideo(false);
    }

    if (audioElement && audioTrack) {
      audioTrack.attach(audioElement);
      audioElement.play().catch((error) => {
        if (!isPlaybackAbortError(error)) {
          console.warn("[LiveKit] Remote audio playback failed:", error);
        }
      });
    }

    return () => {
      if (videoElement && videoTrack) {
        videoTrack.detach(videoElement);
      }
      if (audioElement && audioTrack) {
        audioTrack.detach(audioElement);
      }
    };
  }, [participant, updateKey]);

  const name = participant.name || participant.identity || "User";

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
          <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
          <audio ref={audioRef} autoPlay playsInline className="hidden" />

          {!hasVideo && (
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
}
