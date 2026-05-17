import { RoomServiceClient } from "livekit-server-sdk";
import { connectDB } from "@/lib/connectDB";
import StudyRoom from "@/models/StudyRoom";

type TrackLike = {
  sid?: string;
  source?: unknown;
  type?: unknown;
  name?: string;
  muted?: boolean;
};

type ParticipantLike = {
  identity?: string;
  tracks?: TrackLike[];
};

export type SetParticipantMicrophoneMutedInput = {
  roomId: string;
  requesterId: string;
  participantIdentity: string;
  trackSid?: string;
  muted: boolean;
};

export type SetRoomMicrophonesMutedInput = {
  roomId: string;
  requesterId: string;
  muted: boolean;
};

export type RemoveParticipantInput = {
  roomId: string;
  requesterId: string;
  participantIdentity: string;
};

function normalizeRoomId(roomId: string): string {
  return roomId.trim().toUpperCase();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getLiveKitService() {
  const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const liveKitApiKey = process.env.LIVEKIT_API_KEY;
  const liveKitApiSecret = process.env.LIVEKIT_API_SECRET;

  if (!liveKitUrl || !liveKitApiKey || !liveKitApiSecret) {
    throw new Error("LiveKit config missing");
  }

  return new RoomServiceClient(liveKitUrl, liveKitApiKey, liveKitApiSecret);
}

function findMicrophoneTracks(participant: ParticipantLike): TrackLike[] {
  return (participant.tracks || []).filter((track) => {
    const source = String(track.source || "").toLowerCase();
    const name = String(track.name || "").toLowerCase();
    const type = String(track.type || "").toLowerCase();

    return (
      source.includes("microphone") ||
      name.includes("microphone") ||
      type.includes("audio")
    );
  });
}

async function assertHost(roomName: string, requesterId: string) {
  if (!requesterId) {
    throw new Error("Unauthorized");
  }

  await connectDB();

  const room = await StudyRoom.findOne({
    roomId: { $regex: `^${escapeRegex(roomName)}$`, $options: "i" },
  }).lean();

  if (!room) {
    throw new Error("Room not found");
  }

  const hostId = String((room as { createdBy?: unknown }).createdBy || "").trim();

  if (!hostId || hostId !== requesterId) {
    throw new Error("Forbidden: only the host can moderate participants");
  }
}

export async function assertLiveKitRoomHost({
  roomId,
  requesterId,
}: {
  roomId: string;
  requesterId: string;
}) {
  const roomName = normalizeRoomId(roomId);

  if (!roomName) throw new Error("roomId is required");

  await assertHost(roomName, requesterId);
}

export async function removeLiveKitParticipant({
  roomId,
  requesterId,
  participantIdentity,
}: RemoveParticipantInput) {
  const roomName = normalizeRoomId(roomId);
  const identity = participantIdentity.trim();

  if (!roomName) throw new Error("roomId is required");
  if (!identity) throw new Error("participantIdentity is required");
  if (identity === requesterId) throw new Error("Hosts cannot moderate themselves");

  await assertHost(roomName, requesterId);

  try {
    await StudyRoom.updateOne(
      {
        roomId: { $regex: `^${escapeRegex(roomName)}$`, $options: "i" },
        "waitingList.userId": identity,
      },
      {
        $set: {
          "waitingList.$.status": "declined",
        },
      }
    );
  } catch (error) {
    console.error("Failed to update waiting list for removed participant:", error);
  }

  await getLiveKitService().removeParticipant(roomName, identity);

  return { participantIdentity: identity };
}

export async function setLiveKitParticipantMicrophoneMuted({
  roomId,
  requesterId,
  participantIdentity,
  trackSid,
  muted,
}: SetParticipantMicrophoneMutedInput) {
  const roomName = normalizeRoomId(roomId);
  const identity = participantIdentity.trim();

  if (!roomName) throw new Error("roomId is required");
  if (!identity) throw new Error("participantIdentity is required");
  if (identity === requesterId) throw new Error("Hosts cannot moderate themselves");

  await assertHost(roomName, requesterId);

  if (!muted) {
    return {
      participantIdentity: identity,
      trackSid: trackSid?.trim() || "",
      muted: false,
      allowUnmute: true,
    };
  }

  try {
    const roomService = getLiveKitService();
    const participant = await roomService.getParticipant(roomName, identity);
    const microphoneTrackSid =
      trackSid?.trim() || findMicrophoneTracks(participant).find((track) => track.sid)?.sid;

    if (!microphoneTrackSid) {
      throw new Error("No microphone track found for participant");
    }

    await roomService.mutePublishedTrack(roomName, identity, microphoneTrackSid, true);

    return {
      participantIdentity: identity,
      trackSid: microphoneTrackSid,
      muted: true,
    };
  } catch (error) {
    console.error("LiveKit participant microphone update failed:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to update participant microphone"
    );
  }
}

export async function setLiveKitRoomMicrophonesMuted({
  roomId,
  requesterId,
  muted,
}: SetRoomMicrophonesMutedInput) {
  const roomName = normalizeRoomId(roomId);

  if (!roomName) throw new Error("roomId is required");

  await assertHost(roomName, requesterId);

  const roomService = getLiveKitService();
  const participants = (await roomService.listParticipants(roomName)) as ParticipantLike[];
  const operations = participants
    .filter((participant) => participant.identity && participant.identity !== requesterId)
    .flatMap((participant) =>
      findMicrophoneTracks(participant).flatMap((track) =>
        track.sid ? [{ identity: participant.identity as string, trackSid: track.sid }] : []
      )
    );

  const results = await Promise.allSettled(
    operations.map((operation) =>
      roomService.mutePublishedTrack(
        roomName,
        operation.identity,
        operation.trackSid,
        muted
      )
    )
  );

  return {
    muted,
    total: operations.length,
    changed: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  };
}

