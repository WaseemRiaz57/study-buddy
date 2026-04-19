import type { Namespace, Server, Socket } from "socket.io";
import {
  markStudyRoomParticipantConnected,
  markStudyRoomParticipantDisconnected,
} from "@/lib/redis";
import { maybeAutoCloseStudyRoom } from "@/lib/study-room-lifecycle";
import {
  ROOM_AUTO_CLOSE_GRACE_SECONDS,
  STUDY_ROOM_SOCKET_NAMESPACE,
} from "@/lib/study-room-constants";

type StudyRoomJoinPayload = {
  roomId?: string;
  userId?: string;
};

type StudyRoomSocketData = {
  roomMemberships?: string[];
  roomUserId?: string;
};

const autoCloseTimers = new Map<string, NodeJS.Timeout>();

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeRoomId(roomId: string): string {
  return roomId.trim().toUpperCase();
}

function roomChannel(roomId: string): string {
  return `room:${normalizeRoomId(roomId)}`;
}

function getSocketData(socket: Socket): StudyRoomSocketData {
  return socket.data as StudyRoomSocketData;
}

function clearAutoCloseTimer(roomId: string): void {
  const normalizedRoomId = normalizeRoomId(roomId);
  const existingTimer = autoCloseTimers.get(normalizedRoomId);

  if (!existingTimer) {
    return;
  }

  clearTimeout(existingTimer);
  autoCloseTimers.delete(normalizedRoomId);
}

function scheduleAutoCloseTimer(roomId: string): void {
  const normalizedRoomId = normalizeRoomId(roomId);
  clearAutoCloseTimer(normalizedRoomId);

  const timer = setTimeout(async () => {
    autoCloseTimers.delete(normalizedRoomId);
    await maybeAutoCloseStudyRoom(normalizedRoomId);
  }, ROOM_AUTO_CLOSE_GRACE_SECONDS * 1000);

  autoCloseTimers.set(normalizedRoomId, timer);
}

function addSocketMembership(socket: Socket, roomId: string): void {
  const data = getSocketData(socket);
  const memberships = Array.isArray(data.roomMemberships)
    ? data.roomMemberships
    : [];

  if (!memberships.includes(roomId)) {
    memberships.push(roomId);
  }

  data.roomMemberships = memberships;
}

function removeSocketMembership(socket: Socket, roomId: string): void {
  const data = getSocketData(socket);
  const memberships = Array.isArray(data.roomMemberships)
    ? data.roomMemberships
    : [];

  data.roomMemberships = memberships.filter((memberRoomId) => memberRoomId !== roomId);
}

async function handleJoinEvent(
  socket: Socket,
  payload: StudyRoomJoinPayload
): Promise<void> {
  if (!isNonEmptyString(payload.roomId) || !isNonEmptyString(payload.userId)) {
    socket.emit("study-room:error", {
      message: "roomId and userId are required for study-room:join",
    });
    return;
  }

  const normalizedRoomId = normalizeRoomId(payload.roomId);
  const normalizedUserId = payload.userId.trim();

  getSocketData(socket).roomUserId = normalizedUserId;
  addSocketMembership(socket, normalizedRoomId);
  socket.join(roomChannel(normalizedRoomId));

  clearAutoCloseTimer(normalizedRoomId);
  await markStudyRoomParticipantConnected(normalizedRoomId, normalizedUserId);

  socket.emit("study-room:joined", {
    roomId: normalizedRoomId,
    namespace: STUDY_ROOM_SOCKET_NAMESPACE,
  });
}

async function handleLeaveEvent(
  socket: Socket,
  payload: StudyRoomJoinPayload
): Promise<void> {
  if (!isNonEmptyString(payload.roomId)) {
    socket.emit("study-room:error", {
      message: "roomId is required for study-room:leave",
    });
    return;
  }

  const normalizedRoomId = normalizeRoomId(payload.roomId);
  const userId = getSocketData(socket).roomUserId;

  socket.leave(roomChannel(normalizedRoomId));
  removeSocketMembership(socket, normalizedRoomId);

  if (isNonEmptyString(userId)) {
    await markStudyRoomParticipantDisconnected(normalizedRoomId, userId);
    scheduleAutoCloseTimer(normalizedRoomId);
  }

  socket.emit("study-room:left", {
    roomId: normalizedRoomId,
    namespace: STUDY_ROOM_SOCKET_NAMESPACE,
  });
}

async function handleDisconnectingEvent(socket: Socket): Promise<void> {
  const data = getSocketData(socket);
  const userId = data.roomUserId;
  const memberships = Array.isArray(data.roomMemberships)
    ? [...new Set(data.roomMemberships)]
    : [];

  if (!isNonEmptyString(userId) || memberships.length === 0) {
    return;
  }

  for (const roomId of memberships) {
    await markStudyRoomParticipantDisconnected(roomId, userId);
    scheduleAutoCloseTimer(roomId);
  }
}

/**
 * Registers the dedicated Socket.IO namespace for study rooms.
 * Namespace path is fixed to /study-room.
 */
export function registerStudyRoomNamespace(io: Server): Namespace {
  const namespace = io.of(STUDY_ROOM_SOCKET_NAMESPACE);

  namespace.on("connection", (socket: Socket) => {
    socket.on("study-room:join", async (payload: StudyRoomJoinPayload) => {
      await handleJoinEvent(socket, payload);
    });

    socket.on("study-room:leave", async (payload: StudyRoomJoinPayload) => {
      await handleLeaveEvent(socket, payload);
    });

    socket.on("disconnecting", async () => {
      await handleDisconnectingEvent(socket);
    });
  });

  return namespace;
}
