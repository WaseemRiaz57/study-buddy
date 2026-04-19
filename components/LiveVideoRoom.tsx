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
import AgoraRTC, {
  type IAgoraRTCClient,
  type IAgoraRTCRemoteUser,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type ILocalVideoTrack,
  type ILocalTrack,
} from "agora-rtc-sdk-ng";
import {
  AgoraRTCProvider,
  RemoteUser,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  useLocalScreenTrack,
  usePublish,
  useRemoteAudioTracks,
  useRemoteUsers,
  useRemoteVideoTracks,
  useRTCClient,
} from "agora-rtc-react";

type LiveVideoRoomProps = {
  roomId: string;
  isHost?: boolean;
  currentUserId?: string;
  hostId?: string;
  userId?: string;
  renderAction: (state: LiveVideoRoomRenderState) => ReactNode;
};

type LiveVideoRoomControllerProps = {
  roomId: string;
  isHost?: boolean;
  currentUserId?: string;
  hostId?: string;
  userId?: string;
  client: IAgoraRTCClient;
  renderAction: (state: LiveVideoRoomRenderState) => ReactNode;
};

export type LiveVideoRoomRenderState = {
  isConnected: boolean;
  isJoining: boolean;
  isTokenLoading: boolean;
  tokenError: string | null;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  localCameraTrack: ICameraVideoTrack | null;
  localMicrophoneTrack: IMicrophoneAudioTrack | null;
  screenTrack: ILocalVideoTrack | null;
  currentUserId: string;
  hostId: string;
  isHost: boolean;
  remoteUsers: IAgoraRTCRemoteUser[];
  remoteParticipantCards: ReactNode[];
  remoteScreenUser: IAgoraRTCRemoteUser | null;
  leaveButtonLabel: string;
  isEndingSession: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  removeParticipant: (participantUid: string | number) => void;
  leaveRoom: () => Promise<void>;
};

function isProbablyScreenShareUser(user: IAgoraRTCRemoteUser): boolean {
  const uid = String(user.uid).toLowerCase();
  if (uid.includes("screen")) {
    return true;
  }

  const mediaTrack = (
    user.videoTrack as { getMediaStreamTrack?: () => MediaStreamTrack } | undefined
  )?.getMediaStreamTrack?.();
  const label = mediaTrack?.label?.toLowerCase() ?? "";

  return label.includes("screen") || label.includes("display") || label.includes("window");
}

function LiveVideoRoomController({
  roomId,
  isHost: isHostProp,
  currentUserId,
  hostId,
  userId,
  client,
  renderAction,
}: LiveVideoRoomControllerProps) {
  const router = useRouter();
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? "";
  // Keeps the UID random to avoid collision
  const [agoraUid] = useState(() => Math.floor(Math.random() * 1000000));
  
  const effectiveCurrentUserId = String(currentUserId || userId || "").trim();
  const normalizedHostId = String(hostId || "").trim();
  const derivedIsHost = Boolean(
    effectiveCurrentUserId &&
      normalizedHostId &&
      effectiveCurrentUserId === normalizedHostId
  );
  const isHost = typeof isHostProp === "boolean" ? isHostProp : derivedIsHost;

  const [token, setToken] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Fetch Token
  useEffect(() => {
    let isActive = true;

    async function fetchRtcToken() {
      setIsTokenLoading(true);
      setTokenError(null);

      try {
        if (!roomId) throw new Error("Room ID is required.");

        const response = await fetch("/api/agora-token?channelName=" + roomId + "&uid=0");
        const data = await response.json();

        if (!response.ok || !data?.token) {
          throw new Error(data?.error || "Failed to fetch RTC token.");
        }

        if (isActive) setToken(String(data.token));
      } catch (error) {
        if (isActive) {
          setTokenError(error instanceof Error ? error.message : "Unable to fetch room token.");
        }
      } finally {
        if (isActive) setIsTokenLoading(false);
      }
    }

    void fetchRtcToken();

    return () => {
      isActive = false;
    };
  }, [roomId]);

  // Init Local Tracks
  const { localMicrophoneTrack, isLoading: isMicLoading } = useLocalMicrophoneTrack();
  const { localCameraTrack, isLoading: isCameraLoading } = useLocalCameraTrack();
  const {
    screenTrack,
    isLoading: _isScreenLoading,
    error: _screenError,
  } = useLocalScreenTrack(isScreenSharing, {}, "disable");

  // Toggle States
  useEffect(() => {
    if (localMicrophoneTrack) void localMicrophoneTrack.setEnabled(isMicEnabled);
  }, [localMicrophoneTrack, isMicEnabled]);

  useEffect(() => {
    if (localCameraTrack) void localCameraTrack.setEnabled(isCameraEnabled);
  }, [localCameraTrack, isCameraEnabled]);

  // Join Channel
  const canJoin = Boolean(
    appId && roomId && token && !isTokenLoading && !tokenError && !isLeaving
  );

  const { isConnected, isLoading: isJoinLoading } = useJoin(
    {
      appid: appId,
      channel: roomId,
      token: token ?? null,
      uid: agoraUid,
    },
    canJoin
  );

  // Filter out null tracks so Agora doesn't crash if Mic or Camera is blocked
const tracksToPublish = [localMicrophoneTrack, localCameraTrack].filter(Boolean);
usePublish(isConnected && tracksToPublish.length > 0 ? tracksToPublish : []);

  // Remote Users Data
  const remoteUsers = useRemoteUsers();
  // Call these hooks so Agora automatically subscribes and downloads the remote tracks
  useRemoteVideoTracks(remoteUsers);
  useRemoteAudioTracks(remoteUsers);

  const remoteScreenUser = useMemo(() => {
    return remoteUsers.find((user) => user.hasVideo && isProbablyScreenShareUser(user)) ?? null;
  }, [remoteUsers]);

  const removeParticipant = useCallback(
    (participantUid: string | number) => {
      if (!isHost) return;
      console.log("Kick User: ", participantUid);
    },
    [isHost]
  );

  const remoteParticipantCards = useMemo(() => {
    return remoteUsers.map((user) => (
      <div
        key={String(user.uid)}
        className="aspect-video h-full rounded-xl relative overflow-hidden flex-shrink-0 border shadow-sm transition-all bg-white border-slate-200 dark:bg-zinc-800 dark:border-white/10"
      >
        <RemoteUser
          user={user}
          playVideo={true}
          playAudio={true}
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs backdrop-blur-md transition-colors bg-white/80 text-slate-900 font-bold dark:bg-black/50 dark:text-white dark:font-normal">
          User {String(user.uid)}
        </div>
        {isHost ? (
          <button
            onClick={() => removeParticipant(user.uid)}
            className="absolute top-2 right-2 rounded-md bg-red-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-600 z-10"
          >
            Remove
          </button>
        ) : null}
      </div>
    ));
  }, [isHost, remoteUsers, removeParticipant]);

  const updateSessionDatabase = useCallback(async () => {
    if (!isHost) return;
    try {
      await fetch(`/api/study-rooms/${encodeURIComponent(roomId)}/end-session`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error("Session end database update error:", error);
    }
  }, [isHost, roomId]);

  const leaveRoom = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    if (isHost) {
      setIsEndingSession(true);
      try {
        await updateSessionDatabase();
      } finally {
        setIsEndingSession(false);
      }
    }

    try {
      await client.leave();
    } catch (error) {
      console.error("Leave room error:", error);
    } finally {
      // Clean up tracks ONLY on leave
      localCameraTrack?.stop();
      localCameraTrack?.close();
      localMicrophoneTrack?.stop();
      localMicrophoneTrack?.close();
      screenTrack?.stop();
      screenTrack?.close();

      router.push("/dashboard");
    }
  }, [
    client,
    isLeaving,
    isHost,
    localCameraTrack,
    localMicrophoneTrack,
    router,
    screenTrack,
    updateSessionDatabase,
  ]);

  const leaveButtonLabel = isHost ? "End Session" : "Leave Room";

  const renderState: LiveVideoRoomRenderState = {
    isConnected,
    isJoining: isJoinLoading || isCameraLoading || isMicLoading,
    isTokenLoading,
    tokenError: !appId ? "NEXT_PUBLIC_AGORA_APP_ID is missing." : tokenError,
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    localCameraTrack,
    localMicrophoneTrack,
    screenTrack,
    currentUserId: effectiveCurrentUserId,
    hostId: normalizedHostId,
    isHost,
    remoteUsers,
    remoteParticipantCards,
    remoteScreenUser,
    leaveButtonLabel,
    isEndingSession,
    toggleMic: () => setIsMicEnabled((value) => !value),
    toggleCamera: () => setIsCameraEnabled((value) => !value),
    toggleScreenShare: () => setIsScreenSharing((value) => !value),
    removeParticipant,
    leaveRoom,
  };

  return <>{renderAction(renderState)}</>;
}

export default function LiveVideoRoom({
  roomId,
  isHost,
  currentUserId,
  hostId,
  userId,
  renderAction,
}: LiveVideoRoomProps) {
  const client = useRTCClient(
    useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), [])
  );

  return (
    <AgoraRTCProvider client={client}>
      <LiveVideoRoomController
        roomId={roomId}
        isHost={isHost}
        currentUserId={currentUserId}
        hostId={hostId}
        userId={userId}
        client={client}
        renderAction={renderAction}
      />
    </AgoraRTCProvider>
  );
}