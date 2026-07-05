import mongoose from "mongoose";
import StudyRoom from "@/models/StudyRoom";
import MentorSession from "@/models/MentorSession";

export const MENTOR_SESSION_ACTIVE_STATUS = "active" as const;

type SessionParticipantFields = {
  _id?: unknown;
  mentorId?: unknown;
  studentId?: unknown;
  students?: unknown[];
  duration?: unknown;
  isSessionStarted?: unknown;
  actualStartTime?: unknown;
};

function normalizeId(value: unknown): string {
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id?: unknown })._id || "").trim();
  }

  return String(value || "").trim();
}

export function normalizeStudyRoomId(roomId: unknown): string {
  return String(roomId || "").trim().toUpperCase();
}

export function escapeStudyRoomRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function resolveMentorId(session: SessionParticipantFields | null | undefined) {
  return normalizeId(session?.mentorId);
}

export function resolveStudentIds(session: SessionParticipantFields | null | undefined) {
  const ids = new Set<string>();
  const primaryStudentId = normalizeId(session?.studentId);

  if (primaryStudentId) ids.add(primaryStudentId);

  if (Array.isArray(session?.students)) {
    for (const student of session.students) {
      const studentId = normalizeId(student);
      if (studentId) ids.add(studentId);
    }
  }

  return Array.from(ids);
}

export function isMentorForSession(
  session: SessionParticipantFields | null | undefined,
  userId: unknown
) {
  const mentorId = resolveMentorId(session);
  const normalizedUserId = normalizeId(userId);

  return Boolean(mentorId && normalizedUserId && mentorId === normalizedUserId);
}

export function isStudentForSession(
  session: SessionParticipantFields | null | undefined,
  userId: unknown
) {
  const normalizedUserId = normalizeId(userId);

  return Boolean(
    normalizedUserId &&
      resolveStudentIds(session).some((studentId) => studentId === normalizedUserId)
  );
}

export function getMentorSessionExpiresAt(
  session: SessionParticipantFields | null | undefined
) {
  if (!session?.isSessionStarted || !session.actualStartTime) return null;

  const startMs = new Date(String(session.actualStartTime)).getTime();
  const durationMinutes = Number(session.duration || 60);

  if (!Number.isFinite(startMs) || !Number.isFinite(durationMinutes)) return null;

  return new Date(startMs + Math.max(1, durationMinutes) * 60 * 1000);
}

export function hasMentorSessionExpired(
  session: SessionParticipantFields | null | undefined,
  now = new Date()
) {
  const expiresAt = getMentorSessionExpiresAt(session);
  return Boolean(expiresAt && now.getTime() > expiresAt.getTime());
}

function resolveRoomHostId(room: unknown): string {
  const createdBy = (room as { createdBy?: { _id?: unknown } | unknown })?.createdBy;
  const host = (room as { host?: { _id?: unknown } | unknown })?.host;
  const owner = createdBy || host;

  return normalizeId(owner);
}

export async function findMentorSessionByRoomId(roomId: unknown) {
  const rawRoomId = String(roomId || "").trim();

  if (!mongoose.Types.ObjectId.isValid(rawRoomId)) return null;

  return MentorSession.findById(rawRoomId)
    .select(
      "mentorId students studentId scheduledAt duration status isSessionStarted actualStartTime roomId"
    )
    .lean();
}

export async function resolveRoomHostIdForLifecycle(roomId: unknown) {
  const normalizedRoomId = normalizeStudyRoomId(roomId);
  const mentorSession = await findMentorSessionByRoomId(roomId);

  if (mentorSession) {
    return resolveMentorId(mentorSession);
  }

  const room = await StudyRoom.findOne({
    roomId: { $regex: `^${escapeStudyRoomRegex(normalizedRoomId)}$`, $options: "i" },
  })
    .select("createdBy host roomId")
    .lean();

  return resolveRoomHostId(room);
}

