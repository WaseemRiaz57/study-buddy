"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
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
  return setLiveKitParticipantMicrophoneMuted({
    ...input,
    requesterId: await getRequesterId(),
  });
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
