"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
  assertLiveKitRoomHost,
  removeLiveKitParticipant,
  setLiveKitParticipantMicrophoneMuted,
  setLiveKitRoomMicrophonesMuted,
} from "@/lib/livekit-moderation";

type ParticipantMuteActionInput = {
  roomId: string;
  participantIdentity: string;
  trackSid?: string;
  muted: boolean;
};

type RoomMuteActionInput = {
  roomId: string;
  muted: boolean;
};

type RemoveParticipantActionInput = {
  roomId: string;
  participantIdentity: string;
};

async function getRequesterId() {
  const session = await getServerSession(authOptions);
  return String(session?.user?.id || "").trim();
}

export async function setParticipantMicrophoneMutedAction(
  input: ParticipantMuteActionInput
) {
  try {
    const requesterId = await getRequesterId();

    if (!input.muted) {
      const participantIdentity = String(input.participantIdentity || "").trim();

      if (!participantIdentity) {
        return {
          success: false,
          message: "participantIdentity is required",
        };
      }

      if (participantIdentity === requesterId) {
        return {
          success: false,
          message: "Hosts cannot moderate themselves",
        };
      }

      await assertLiveKitRoomHost({
        roomId: input.roomId,
        requesterId,
      });

      return {
        success: true,
        participantIdentity,
        muted: false,
        allowUnmute: true,
      };
    }

    const result = await setLiveKitParticipantMicrophoneMuted({
      ...input,
      requesterId,
    });

    return {
      success: true,
      participantIdentity: result.participantIdentity,
      trackSid: result.trackSid,
      muted: result.muted,
    };
  } catch (error) {
    console.error("Participant microphone moderation failed:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update participant microphone.",
    };
  }
}

export async function setRoomMicrophonesMutedAction(input: RoomMuteActionInput) {
  return setLiveKitRoomMicrophonesMuted({
    ...input,
    requesterId: await getRequesterId(),
  });
}

export async function removeParticipantFromLiveKitRoomAction(
  input: RemoveParticipantActionInput
) {
  return removeLiveKitParticipant({
    ...input,
    requesterId: await getRequesterId(),
  });
}

