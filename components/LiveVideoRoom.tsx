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
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  useLocalScreenTrack,
  usePublish,
  useRemoteUsers,
  useRTCClient,
} from "agora-rtc-react";

type LiveVideoRoomProps = {
  roomId: string;
  userId?: string;
  renderAction: (state: LiveVideoRoomRenderState) => ReactNode;
};

type LiveVideoRoomControllerProps = {
  roomId: string;
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
  remoteUsers: IAgoraRTCRemoteUser[];
  remoteScreenUser: IAgoraRTCRemoteUser | null;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
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
  userId,
  client,
  renderAction,
}: LiveVideoRoomControllerProps) {
  const router = useRouter();
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? "";
  const [agoraUid] = useState(() => Math.floor(Math.random() * 1000000));

  const [token, setToken] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localCameraTrackRef = useRef<ILocalTrack | null>(null);
  const localMicrophoneTrackRef = useRef<ILocalTrack | null>(null);
  const localScreenTrackRef = useRef<ILocalTrack | null>(null);

  useEffect(() => {
    let isActive = true;

    async function fetchRtcToken() {
      setIsTokenLoading(true);
      setTokenError(null);

      try {
        if (!roomId) {
          throw new Error("Room ID is required.");
        }

        const response = await fetch(
          "/api/agora-token?channelName=" + roomId + "&uid=0"
        );

        const data = await response.json();

        if (!response.ok || !data?.token) {
          throw new Error(data?.error || "Failed to fetch RTC token.");
        }

        if (isActive) {
          setToken(String(data.token));
        }
      } catch (error) {
        if (isActive) {
          setTokenError(
            error instanceof Error
              ? error.message
              : "Unable to fetch room token."
          );
        }
      } finally {
        if (isActive) {
          setIsTokenLoading(false);
        }
      }
    }

    void fetchRtcToken();

    return () => {
      isActive = false;
    };
  }, [roomId]);

  const { localMicrophoneTrack, isLoading: isMicLoading } = useLocalMicrophoneTrack();
  const { localCameraTrack, isLoading: isCameraLoading } = useLocalCameraTrack();
  const {
    screenTrack,
    isLoading: _isScreenLoading,
    error: _screenError,
  } = useLocalScreenTrack(isScreenSharing, {}, "disable");

  useEffect(() => {
    localCameraTrackRef.current = localCameraTrack;
  }, [localCameraTrack]);

  useEffect(() => {
    localMicrophoneTrackRef.current = localMicrophoneTrack;
  }, [localMicrophoneTrack]);

  useEffect(() => {
    localScreenTrackRef.current = screenTrack;
  }, [screenTrack]);

  useEffect(() => {
    return () => {
      localCameraTrackRef.current?.stop();
      localCameraTrackRef.current?.close();
      localMicrophoneTrackRef.current?.stop();
      localMicrophoneTrackRef.current?.close();
      localScreenTrackRef.current?.stop();
      localScreenTrackRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!localMicrophoneTrack) {
      return;
    }

    void localMicrophoneTrack.setEnabled(isMicEnabled);
  }, [localMicrophoneTrack, isMicEnabled]);

  useEffect(() => {
    if (!localCameraTrack) {
      return;
    }

    void localCameraTrack.setEnabled(isCameraEnabled);
  }, [localCameraTrack, isCameraEnabled]);

  useEffect(() => {
    if (isScreenSharing || !screenTrack) {
      return;
    }

    screenTrack.stop();
    screenTrack.close();
  }, [isScreenSharing, screenTrack]);

  useEffect(() => {
    if (!screenTrack) {
      return;
    }

    const handleTrackEnded = () => setIsScreenSharing(false);
    (screenTrack as { on?: (event: string, cb: () => void) => void }).on?.(
      "track-ended",
      handleTrackEnded
    );

    return () => {
      (screenTrack as { off?: (event: string, cb: () => void) => void }).off?.(
        "track-ended",
        handleTrackEnded
      );
    };
  }, [screenTrack]);

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

  const activeVideoTrack = isScreenSharing ? screenTrack : localCameraTrack;

  usePublish([localMicrophoneTrack, activeVideoTrack], canJoin);

  const remoteUsers = useRemoteUsers();

  const remoteScreenUser = useMemo(() => {
    return (
      remoteUsers.find(
        (user) => user.hasVideo && isProbablyScreenShareUser(user)
      ) ?? null
    );
  }, [remoteUsers]);

  const leaveRoom = useCallback(async () => {
    if (isLeaving) {
      return;
    }

    setIsLeaving(true);

    const tracksToClose: ILocalTrack[] = [
      localMicrophoneTrack,
      localCameraTrack,
      screenTrack,
    ].filter((track): track is ILocalTrack => Boolean(track));

    try {
      if (tracksToClose.length > 0) {
        await client.unpublish(tracksToClose);
      }
    } catch (error) {
      console.error("Unpublish error:", error);
    }

    try {
      await client.leave();
    } catch (error) {
      console.error("Leave room error:", error);
    } finally {
      tracksToClose.forEach((track) => {
        track.stop();
        track.close();
      });

      router.push("/dashboard");
    }
  }, [
    client,
    isLeaving,
    localCameraTrack,
    localMicrophoneTrack,
    router,
    screenTrack,
  ]);

  const renderState: LiveVideoRoomRenderState = {
    isConnected,
    isJoining: isJoinLoading || isCameraLoading || isMicLoading,
    isTokenLoading,
    tokenError: !appId
      ? "NEXT_PUBLIC_AGORA_APP_ID is missing."
      : tokenError,
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    localCameraTrack,
    localMicrophoneTrack,
    screenTrack,
    remoteUsers,
    remoteScreenUser,
    toggleMic: () => setIsMicEnabled((value) => !value),
    toggleCamera: () => setIsCameraEnabled((value) => !value),
    toggleScreenShare: () => setIsScreenSharing((value) => !value),
    leaveRoom,
  };

  return <>{renderAction(renderState)}</>;
}

export default function LiveVideoRoom({ roomId, userId, renderAction }: LiveVideoRoomProps) {
  const client = useRTCClient(
    useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), [])
  );

  return (
    <AgoraRTCProvider client={client}>
      <LiveVideoRoomController
        roomId={roomId}
        userId={userId}
        client={client}
        renderAction={renderAction}
      />
    </AgoraRTCProvider>
  );
}
