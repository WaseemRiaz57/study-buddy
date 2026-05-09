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
import { toast } from "sonner";
import {
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
} from "livekit-client";
import { motion } from "framer-motion";
import { LogOut, Mic, MicOff, Minus, ShieldAlert, Video, VideoOff } from "lucide-react";
import {
  removeParticipantFromLiveKitRoomAction,
  setParticipantMicrophoneMutedAction,
  setRoomMicrophonesMutedAction,
} from "@/app/actions/livekit-moderation";

type LiveVideoRoomProps = {
  roomId: string;
  token?: string;
  liveKitUrl?: string;
  isHost?: boolean;
  currentUserId?: string;
  userName?: string;
  hostId?: string;
  userId?: string;
  autoJoin?: boolean;
  renderAction: (state: LiveVideoRoomRenderState) => ReactNode;
};

type RoomControlAction =
  | "MUTE_NOTIFY"
  | "ALLOW_UNMUTE"
  | "REQUEST_UNMUTE"
  | "UNMUTE_NOTIFY"
  | "REMOVE_NOTIFY"
  | "SESSION_ENDED";

type RoomControlMessage = {
  action: RoomControlAction;
  type?: RoomControlAction;
  targetId?: string;
  message: string;
  redirectTo?: string;
  muteAllMode?: boolean;
};

export type VaultSharedFile = {
  id: string;
  url: string;
  name: string;
  format: string;
  senderId: string;
  senderName: string;
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
  sharedFiles: VaultSharedFile[];
  remoteParticipantCards: ReactNode[];
  leaveButtonLabel: string;
  isEndingSession: boolean;
  isModeratingAllParticipants: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  sendMessage: (text: string) => void;
  shareVaultFile: (
    file: Omit<VaultSharedFile, "id" | "senderId" | "senderName"> & {
      id?: string;
      senderName?: string;
    }
  ) => void;
  muteParticipant: (participantUid: string | number, trackSid?: string) => void;
  setParticipantMicMuted: (
    participantUid: string | number,
    muted: boolean,
    trackSid?: string
  ) => void;
  muteAllParticipants: () => void;
  unmuteAllParticipants: () => void;
  removeParticipant: (participantUid: string | number) => void;
  leaveRoom: () => Promise<void>;
};

const ROOM_CONTROL_TOPIC = "room-control";
const VAULT_FILE_TOPIC = "vault-file";
const DASHBOARD_REDIRECT_PATH = "/dashboard";

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

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
  autoJoin = false,
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
  const [sharedFiles, setSharedFiles] = useState<VaultSharedFile[]>([]);
  const [roomVersion, setRoomVersion] = useState(0);
  const [moderatingParticipants, setModeratingParticipants] = useState<Record<string, boolean>>({});
  const [isModeratingAllParticipants, setIsModeratingAllParticipants] = useState(false);
  const [sessionEndedMessage, setSessionEndedMessage] = useState("");
  const [isMicLockedByHost, setIsMicLockedByHost] = useState(false);
  const [isHostMuteAllMode, setIsHostMuteAllMode] = useState(false);
  const sessionEndRedirectTimerRef = useRef<number | null>(null);
  const hostMuteAllModeRef = useRef(false);

  useEffect(() => {
    hostMuteAllModeRef.current = isHostMuteAllMode;
  }, [isHostMuteAllMode]);

  async function enableMicrophoneFromHostSignal() {
    if (hostMuteAllModeRef.current) {
      toast.error("Mute All is enabled. The host needs to unmute the room first.", {
        icon: <MicOff size={16} />,
      });
      return;
    }

    const room = roomRef.current;

    if (room) {
      await room.localParticipant.setMicrophoneEnabled(true);
      syncRoomState(room);
    } else {
      previewStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      setIsMicEnabled(true);
    }

    setIsMicLockedByHost(false);
  }

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
    if (!autoJoin || hasJoined || !token || !liveKitUrl) return;
    setHasJoined(true);
  }, [autoJoin, hasJoined, liveKitUrl, token]);

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

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      const participantName =
        participant.name || participant.identity || "A participant";

      handleRoomChanged();
      toast.info(`${participantName} has left the study room.`);
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
      if (topic === ROOM_CONTROL_TOPIC) {
        try {
          const parsed = JSON.parse(new TextDecoder().decode(payload)) as RoomControlMessage;
          const message = String(parsed.message || "").trim();

          if (parsed.action === "SESSION_ENDED") {
            setSessionEndedMessage(message || "This study session has ended.");

            if (sessionEndRedirectTimerRef.current) {
              window.clearTimeout(sessionEndRedirectTimerRef.current);
            }

            sessionEndRedirectTimerRef.current = window.setTimeout(() => {
              void room.disconnect();
              router.push(parsed.redirectTo || DASHBOARD_REDIRECT_PATH);
            }, 3500);
            return;
          }

          if (parsed.action === "MUTE_NOTIFY") {
            if (typeof parsed.muteAllMode === "boolean") {
              setIsHostMuteAllMode(parsed.muteAllMode);
            }

            setIsMicLockedByHost(true);
            toast.warning(message || "You have been muted by the host.", {
              icon: <MicOff size={16} />,
            });
            return;
          }

          const signalType = parsed.type || parsed.action;

          if (signalType === "ALLOW_UNMUTE") {
            const targetId = String(parsed.targetId || "").trim();

            if (targetId && targetId !== effectiveCurrentUserId) {
              return;
            }

            if (typeof parsed.muteAllMode === "boolean") {
              setIsHostMuteAllMode(parsed.muteAllMode);
            }

            if (parsed.muteAllMode) {
              toast.warning("Mute All is still enabled. You cannot unmute yet.", {
                icon: <MicOff size={16} />,
              });
              return;
            }

            setIsMicLockedByHost(false);
            toast.success(
              message || "Host has allowed you to unmute your mic",
              { icon: <Mic size={16} />, duration: 8000 }
            );
            return;
          }

          if (parsed.action === "REQUEST_UNMUTE" || parsed.action === "UNMUTE_NOTIFY") {
            if (typeof parsed.muteAllMode === "boolean") {
              setIsHostMuteAllMode(parsed.muteAllMode);
            }

            if (parsed.muteAllMode) {
              toast.warning("Mute All is still enabled. You cannot unmute yet.", {
                icon: <MicOff size={16} />,
              });
              return;
            }

            setIsMicLockedByHost(false);
            toast.success(message || "The host has allowed you to unmute.", {
              icon: <Mic size={16} />,
              action: {
                label: "Turn mic on",
                onClick: () => {
                  void enableMicrophoneFromHostSignal();
                },
              },
              duration: 8000,
            });
            return;
          }

          if (parsed.action === "REMOVE_NOTIFY") {
            toast.error(message || "You have been removed from the room.", {
              icon: <ShieldAlert size={16} />,
              duration: 3500,
            });

            window.setTimeout(() => {
              router.push(DASHBOARD_REDIRECT_PATH);
            }, 2200);
          }
        } catch (error) {
          console.warn("[LiveKit] Invalid room-control payload:", error);
        }

        return;
      }

      if (topic === VAULT_FILE_TOPIC) {
        try {
          const parsed = JSON.parse(new TextDecoder().decode(payload));
          const nextFile: VaultSharedFile = {
            id: String(parsed.id || `${Date.now()}-${parsed.url || parsed.name || "vault"}`),
            url: String(parsed.url || parsed.secure_url || ""),
            name: String(parsed.name || parsed.fileName || "Shared file"),
            format: String(parsed.format || "file"),
            senderId: String(parsed.senderId || participant?.identity || "remote"),
            senderName: String(parsed.senderName || parsed.uploader || participant?.name || "Study Buddy"),
          };

          if (!nextFile.url) return;

          let didAddFile = false;
          setSharedFiles((prev) => {
            if (prev.some((file) => file.id === nextFile.id || file.url === nextFile.url)) {
              return prev;
            }

            didAddFile = true;
            return [nextFile, ...prev];
          });
          if (didAddFile) {
            toast.success("New material shared in Vault!");
          }
        } catch (error) {
          console.warn("[LiveKit] Invalid vault-file payload:", error);
        }

        return;
      }

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
      .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
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
      if (sessionEndRedirectTimerRef.current) {
        window.clearTimeout(sessionEndRedirectTimerRef.current);
        sessionEndRedirectTimerRef.current = null;
      }
      room.disconnect();
      roomRef.current = null;
      setRemoteParticipants([]);
      setRemoteScreenUser(null);
      setScreenTrack(null);
      setIsConnected(false);
    };
  }, [hasJoined, roomId, token, liveKitUrl, router, syncRoomState]);

  const publishRoomControlMessage = useCallback(
    async (message: RoomControlMessage, destinationIdentities?: string[]) => {
      const room = roomRef.current;
      if (!room || !isConnected) return;

      await room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(message)),
        {
          reliable: true,
          topic: ROOM_CONTROL_TOPIC,
          destinationIdentities,
        }
      );
    },
    [isConnected]
  );

  const toggleMic = useCallback(() => {
    const room = roomRef.current;
    const nextEnabled = !isMicEnabled;

    if (!isHost && nextEnabled && isHostMuteAllMode) {
      toast.error("Mute All is enabled. The host needs to unmute the room first.", {
        icon: <MicOff size={16} />,
      });
      return;
    }

    if (!isHost && nextEnabled && isMicLockedByHost) {
      toast.info("Your mic was muted by the host. Wait for the host's unmute request.", {
        icon: <MicOff size={16} />,
      });
      return;
    }

    if (room && isConnected) {
      void room.localParticipant.setMicrophoneEnabled(nextEnabled).then(() => {
        if (nextEnabled) {
          setIsMicLockedByHost(false);
        }
        syncRoomState(room);
      });
      return;
    }

    previewStreamRef.current
      ?.getAudioTracks()
      .forEach((track) => {
        track.enabled = nextEnabled;
      });
    setIsMicEnabled(nextEnabled);
    if (nextEnabled) {
      setIsMicLockedByHost(false);
    }
  }, [isConnected, isHost, isHostMuteAllMode, isMicEnabled, isMicLockedByHost, syncRoomState]);

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

  const shareVaultFile = useCallback(
    (
      file: Omit<VaultSharedFile, "id" | "senderId" | "senderName"> & {
        id?: string;
        senderName?: string;
      }
    ) => {
      const nextFile: VaultSharedFile = {
        id: file.id || `${Date.now()}-${file.name}`,
        url: file.url,
        name: file.name,
        format: file.format,
        senderId: effectiveCurrentUserId,
        senderName: file.senderName || userName || "Study Buddy",
      };

      if (!nextFile.url) return;

      setSharedFiles((prev) => {
        if (prev.some((sharedFile) => sharedFile.id === nextFile.id || sharedFile.url === nextFile.url)) {
          return prev;
        }

        return [nextFile, ...prev];
      });

      const room = roomRef.current;
      if (!room || !isConnected) return;

      void room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(nextFile)),
        { reliable: true, topic: VAULT_FILE_TOPIC }
      );
    },
    [effectiveCurrentUserId, isConnected, userName]
  );

  const moderateParticipant = useCallback(
    async ({
      action,
      participantIdentity,
      trackSid,
      muted,
    }: {
      action: "mute" | "remove";
      participantIdentity: string;
      trackSid?: string;
      muted?: boolean;
    }) => {
      if (!isHost || !participantIdentity) return;

      setModeratingParticipants((prev) => ({
        ...prev,
        [participantIdentity]: true,
      }));

      try {
        if (action === "mute" && muted === false && isHostMuteAllMode) {
          toast.error("Mute All is enabled. Use Unmute All before allowing one participant to unmute.", {
            icon: <MicOff size={16} />,
          });
          return;
        }

        if (action === "remove") {
          await publishRoomControlMessage(
            {
              action: "REMOVE_NOTIFY",
              message: "You have been removed from this StudyBuddy room by the host.",
            },
            [participantIdentity]
          );
          await wait(900);

          await removeParticipantFromLiveKitRoomAction({
            roomId,
            participantIdentity,
          });
        } else if (muted === false) {
          await publishRoomControlMessage(
            {
              action: "ALLOW_UNMUTE",
              type: "ALLOW_UNMUTE",
              targetId: participantIdentity,
              message: "Host has allowed you to unmute your mic",
              muteAllMode: false,
            },
            [participantIdentity]
          );
        } else {
          const result = await setParticipantMicrophoneMutedAction({
            roomId,
            participantIdentity,
            trackSid,
            muted: true,
          });

          if (!result?.success) {
            throw new Error(result?.message || "Failed to mute participant.");
          }

          await publishRoomControlMessage(
            {
              action: "MUTE_NOTIFY",
              message: "You have been muted by the host.",
              muteAllMode: false,
            },
            [participantIdentity]
          );
        }

        const room = roomRef.current;
        if (room) {
          syncRoomState(room);
        }
      } catch (error) {
        console.error("[LiveKit] Moderation failed:", error);
        alert(error instanceof Error ? error.message : "Failed to moderate participant.");
      } finally {
        setModeratingParticipants((prev) => {
          const next = { ...prev };
          delete next[participantIdentity];
          return next;
        });
      }
    },
    [isHost, isHostMuteAllMode, publishRoomControlMessage, roomId, syncRoomState]
  );

  const muteParticipant = useCallback(
    (participantUid: string | number, trackSid?: string) => {
      void moderateParticipant({
        action: "mute",
        participantIdentity: String(participantUid),
        trackSid,
        muted: true,
      });
    },
    [moderateParticipant]
  );

  const setParticipantMicMuted = useCallback(
    (participantUid: string | number, muted: boolean, trackSid?: string) => {
      void moderateParticipant({
        action: "mute",
        participantIdentity: String(participantUid),
        trackSid,
        muted,
      });
    },
    [moderateParticipant]
  );

  const setAllParticipantsMuted = useCallback(
    async (muted: boolean) => {
      if (!isHost || isModeratingAllParticipants) return;

      setIsModeratingAllParticipants(true);

      try {
        await setRoomMicrophonesMutedAction({ roomId, muted });
        setIsHostMuteAllMode(muted);

        const room = roomRef.current;
        const destinationIdentities = room
          ? Array.from(room.remoteParticipants.values()).map((participant) => participant.identity)
          : [];

        if (destinationIdentities.length > 0) {
          await publishRoomControlMessage(
            {
              action: muted ? "MUTE_NOTIFY" : "REQUEST_UNMUTE",
              message: muted
                ? "You have been muted by the host."
                : "The host is requesting everyone to turn microphones back on.",
              muteAllMode: muted,
            },
            destinationIdentities
          );
        }

        if (room) {
          syncRoomState(room);
        }
      } catch (error) {
        console.error("[LiveKit] Bulk moderation failed:", error);
        alert(error instanceof Error ? error.message : "Failed to update participant microphones.");
      } finally {
        setIsModeratingAllParticipants(false);
      }
    },
    [isHost, isModeratingAllParticipants, publishRoomControlMessage, roomId, syncRoomState]
  );

  const muteAllParticipants = useCallback(() => {
    void setAllParticipantsMuted(true);
  }, [setAllParticipantsMuted]);

  const unmuteAllParticipants = useCallback(() => {
    void setAllParticipantsMuted(false);
  }, [setAllParticipantsMuted]);

  const removeParticipant = useCallback(
    (participantUid: string | number) => {
      void moderateParticipant({
        action: "remove",
        participantIdentity: String(participantUid),
      });
    },
    [moderateParticipant]
  );

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

  const resetWaitingRoomStatus = useCallback(async () => {
    try {
      await fetch("/api/study-rooms/waiting-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "leave",
          roomId,
        }),
        keepalive: true,
      });
    } catch (error) {
      console.error("Waiting Room Leave Error:", error);
    }
  }, [roomId]);

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
        setSessionEndedMessage("The host has ended this StudyBuddy session.");
        await publishRoomControlMessage({
          action: "SESSION_ENDED",
          message: "The host has ended this StudyBuddy session.",
          redirectTo: DASHBOARD_REDIRECT_PATH,
        });
        await wait(2500);
        await updateSessionDatabase();
      }
    } catch (error) {
      console.error("Leave Room Error:", error);
    } finally {
      previewStreamRef.current?.getTracks().forEach((track) => track.stop());
      await roomRef.current?.disconnect();
      await resetWaitingRoomStatus();
      router.push(DASHBOARD_REDIRECT_PATH);
    }
  }, [isHost, isLeaving, publishRoomControlMessage, resetWaitingRoomStatus, roomId, router, updateSessionDatabase]);

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
          isModerating={Boolean(moderatingParticipants[participant.identity])}
          onSetMicMuted={(muted, trackSid) =>
            setParticipantMicMuted(participant.identity, muted, trackSid)
          }
          onRemove={() => removeParticipant(participant.identity)}
          updateKey={roomVersion}
        />
      )),
    [isHost, moderatingParticipants, remoteParticipants, removeParticipant, roomVersion, setParticipantMicMuted]
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
    sharedFiles,
    remoteParticipantCards,
    leaveButtonLabel: isHost ? "End Session" : "Leave Room",
    isEndingSession,
    isModeratingAllParticipants,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendMessage,
    shareVaultFile,
    muteParticipant,
    setParticipantMicMuted,
    muteAllParticipants,
    unmuteAllParticipants,
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
                  ? "bg-purple-600 text-white hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:brightness-110"
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

  return (
    <>
      {renderAction(renderState)}
      {sessionEndedMessage ? (
        <SessionEndedModal message={sessionEndedMessage} />
      ) : null}
    </>
  );
}

function SessionEndedModal({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-white/10 dark:bg-[#161027]"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
          <LogOut size={22} />
        </div>
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">Session Ended</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-gray-300">
          {message}
        </p>
        <p className="mt-4 text-xs font-medium text-slate-500 dark:text-gray-400">
          Redirecting to your dashboard...
        </p>
      </motion.div>
    </div>
  );
}

function LiveKitRemoteParticipantCard({
  participant,
  isHost,
  isModerating,
  onSetMicMuted,
  onRemove,
  updateKey,
}: {
  participant: RemoteParticipant;
  isHost: boolean;
  isModerating: boolean;
  onSetMicMuted: (muted: boolean, trackSid?: string) => void;
  onRemove: () => void;
  updateKey: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    const audioElement = audioRef.current;
    const videoTrack = participant.getTrackPublication(Track.Source.Camera)?.track;
    const audioPublication = participant.getTrackPublication(Track.Source.Microphone);
    const audioTrack = audioPublication?.track;

    setIsMicMuted(Boolean(audioPublication?.isMuted));

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
  const microphoneTrackSid = participant.getTrackPublication(Track.Source.Microphone)?.trackSid;

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

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`h-full w-full object-cover transition-opacity ${
          isMinimized ? "opacity-0" : "opacity-100"
        }`}
      />
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {!isMinimized && !hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/90 z-0">
          <span className="text-xs text-gray-400 font-medium animate-pulse">Connecting Video...</span>
        </div>
      )}

      {isMinimized && (
        <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gray-800/90">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
            {String(name || "U").slice(0, 1).toUpperCase()}
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs backdrop-blur-md bg-black/50 text-white font-normal z-10">
        {name}
      </div>

      {isHost && !isMinimized && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          <button
            onClick={() => onSetMicMuted(!isMicMuted, microphoneTrackSid)}
            disabled={isModerating || !microphoneTrackSid}
            className={`rounded-md p-1.5 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isMicMuted
                ? "bg-red-500 hover:bg-red-600"
                : "bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8]"
            }`}
            aria-label={isMicMuted ? `Unmute ${name}` : `Mute ${name}`}
            title={isMicMuted ? "Unmute" : "Mute"}
          >
            {isMicMuted ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
          <button
            onClick={onRemove}
            disabled={isModerating}
            className="rounded-md bg-red-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Remove
          </button>
        </div>
      )}
    </motion.div>
  );
}
