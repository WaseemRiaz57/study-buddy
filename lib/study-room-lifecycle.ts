import mongoose from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import {
  clearStudyRoomRuntimeState,
  getStudyRoomEmptyTtlSeconds,
  getStudyRoomState,
  isStudyRoomAutoCloseDue,
} from "@/lib/redis";
import {
  MIN_ROOM_SESSION_MINUTES_FOR_XP,
  ROOM_AUTO_CLOSE_GRACE_SECONDS,
  ROOM_XP_PER_MINUTE,
} from "@/lib/study-room-constants";
import StudyRoom from "@/models/StudyRoom";
import User from "@/models/User";
import UserProgress from "@/models/UserProgress";

export type StudyRoomCloseReason = "manual" | "inactive-disconnect";

export interface CloseStudyRoomResult {
  roomId: string;
  reason: StudyRoomCloseReason;
  closed: boolean;
  alreadyClosed: boolean;
  notFound: boolean;
  sessionDurationMinutes: number;
  xpAwardedPerParticipant: number;
}

export interface AutoCloseStudyRoomResult {
  roomId: string;
  closed: boolean;
  pendingSeconds: number | null;
  reason:
    | "no-runtime-state"
    | "grace-period-active"
    | "participants-connected"
    | "closed"
    | "already-closed"
    | "not-found";
}

function normalizeRoomId(roomId: string): string {
  return roomId.trim().toUpperCase();
}

function normalizeParticipantIds(
  participants: mongoose.Types.ObjectId[]
): string[] {
  return [
    ...new Set(
      participants
        .map((participant) => participant.toString())
        .filter((participantId) => participantId.trim())
    ),
  ];
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function calculateSessionDurationMinutes(
  startedAt: Date,
  endedAt: Date
): number {
  const elapsedMs = Math.max(0, endedAt.getTime() - startedAt.getTime());
  return Math.floor(elapsedMs / (60 * 1000));
}

export function calculateRoomSessionXp(sessionDurationMinutes: number): number {
  if (sessionDurationMinutes < MIN_ROOM_SESSION_MINUTES_FOR_XP) {
    return 0;
  }

  return sessionDurationMinutes * ROOM_XP_PER_MINUTE;
}

async function awardRoomSessionXpToParticipants(
  participantIds: string[],
  sessionDurationMinutes: number,
  closedAt: Date
): Promise<void> {
  const xpAwardPerParticipant = calculateRoomSessionXp(sessionDurationMinutes);

  if (xpAwardPerParticipant <= 0 || participantIds.length === 0) {
    return;
  }

  for (const participantId of participantIds) {
    const user = (await User.findById(participantId, "email").lean()) as
      | { email?: string | null }
      | null;

    const progressKey = user?.email?.trim() || participantId;

    let progress = await UserProgress.findOne({ userId: progressKey });

    if (!progress) {
      progress = await UserProgress.create({ userId: progressKey });
    }

    if (!isSameCalendarDay(new Date(progress.lastActiveDate), closedAt)) {
      progress.todayMinutes = 0;
    }

    progress.xp += xpAwardPerParticipant;
    progress.todayMinutes += sessionDurationMinutes;
    progress.lastActiveDate = closedAt;
    progress.level = Math.floor(progress.xp / 1000) + 1;
    await progress.save();
  }
}

export async function closeStudyRoomAndPersistDuration(
  roomId: string,
  reason: StudyRoomCloseReason = "manual"
): Promise<CloseStudyRoomResult> {
  const normalizedRoomId = normalizeRoomId(roomId);

  await connectMongoDB();

  const existingRoom = await StudyRoom.findOne({ roomId: normalizedRoomId });

  if (!existingRoom) {
    return {
      roomId: normalizedRoomId,
      reason,
      closed: false,
      alreadyClosed: false,
      notFound: true,
      sessionDurationMinutes: 0,
      xpAwardedPerParticipant: 0,
    };
  }

  if (!existingRoom.isLive) {
    return {
      roomId: normalizedRoomId,
      reason,
      closed: false,
      alreadyClosed: true,
      notFound: false,
      sessionDurationMinutes: existingRoom.sessionDurationMinutes || 0,
      xpAwardedPerParticipant: calculateRoomSessionXp(
        existingRoom.sessionDurationMinutes || 0
      ),
    };
  }

  const closedAt = new Date();
  const sessionDurationMinutes = calculateSessionDurationMinutes(
    existingRoom.createdAt,
    closedAt
  );

  const updatedRoom = await StudyRoom.findOneAndUpdate(
    { _id: existingRoom._id, isLive: true },
    {
      isLive: false,
      closedAt,
      sessionDurationMinutes,
    },
    { new: true }
  );

  if (!updatedRoom) {
    return {
      roomId: normalizedRoomId,
      reason,
      closed: false,
      alreadyClosed: true,
      notFound: false,
      sessionDurationMinutes: existingRoom.sessionDurationMinutes || 0,
      xpAwardedPerParticipant: calculateRoomSessionXp(
        existingRoom.sessionDurationMinutes || 0
      ),
    };
  }

  const participantIds = normalizeParticipantIds(existingRoom.participants);
  const xpAwardedPerParticipant = calculateRoomSessionXp(sessionDurationMinutes);

  await awardRoomSessionXpToParticipants(
    participantIds,
    sessionDurationMinutes,
    closedAt
  );

  await clearStudyRoomRuntimeState(normalizedRoomId);

  return {
    roomId: normalizedRoomId,
    reason,
    closed: true,
    alreadyClosed: false,
    notFound: false,
    sessionDurationMinutes,
    xpAwardedPerParticipant,
  };
}

export async function maybeAutoCloseStudyRoom(
  roomId: string
): Promise<AutoCloseStudyRoomResult> {
  const normalizedRoomId = normalizeRoomId(roomId);

  const state = await getStudyRoomState(normalizedRoomId);

  if (!state) {
    return {
      roomId: normalizedRoomId,
      closed: false,
      pendingSeconds: null,
      reason: "no-runtime-state",
    };
  }

  if (!state.awaitingAutoClose) {
    return {
      roomId: normalizedRoomId,
      closed: false,
      pendingSeconds: null,
      reason: "participants-connected",
    };
  }

  const shouldAutoClose = await isStudyRoomAutoCloseDue(normalizedRoomId, state);

  if (!shouldAutoClose) {
    return {
      roomId: normalizedRoomId,
      closed: false,
      pendingSeconds:
        (await getStudyRoomEmptyTtlSeconds(normalizedRoomId)) ||
        ROOM_AUTO_CLOSE_GRACE_SECONDS,
      reason: "grace-period-active",
    };
  }

  const closeResult = await closeStudyRoomAndPersistDuration(
    normalizedRoomId,
    "inactive-disconnect"
  );

  if (closeResult.notFound) {
    return {
      roomId: normalizedRoomId,
      closed: false,
      pendingSeconds: null,
      reason: "not-found",
    };
  }

  if (closeResult.closed) {
    return {
      roomId: normalizedRoomId,
      closed: true,
      pendingSeconds: null,
      reason: "closed",
    };
  }

  return {
    roomId: normalizedRoomId,
    closed: false,
    pendingSeconds: null,
    reason: "already-closed",
  };
}

