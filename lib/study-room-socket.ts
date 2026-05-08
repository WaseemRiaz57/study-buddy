import type { Namespace, Server, Socket } from "socket.io";
import { connectDB } from "@/lib/connectDB";
import {
  markStudyRoomParticipantConnected,
  markStudyRoomParticipantDisconnected,
} from "@/lib/redis";
import { maybeAutoCloseStudyRoom } from "@/lib/study-room-lifecycle";
import {
  ROOM_AUTO_CLOSE_GRACE_SECONDS,
  STUDY_ROOM_SOCKET_NAMESPACE,
} from "@/lib/study-room-constants";
import StudyRoom from "@/models/StudyRoom";

type StudyRoomJoinPayload = {
  roomId?: string;
  userId?: string;
};

type StudyBuddyIdentifyPayload = {
  userId?: string;
};

type KnockRoomPayload = {
  roomId?: string;
  userId?: string;
  userName?: string;
};

type KnockResponsePayload = {
  roomId?: string;
  targetUserId?: string;
  status?: "admitted" | "declined";
};

type BuddyRequestAcceptedPayload = {
  roomId: string;
  requestId: string;
};

type StudyRoomSocketData = {
  roomMemberships?: string[];
  roomUserId?: string;
};

const autoCloseTimers = new Map<string, NodeJS.Timeout>();
let studyRoomNamespace: Namespace | null = null;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeRoomId(roomId: string): string {
  return roomId.trim().toUpperCase();
}

function roomChannel(roomId: string): string {
  return `room:${normalizeRoomId(roomId)}`;
}

function roomHostChannel(roomId: string): string {
  return `room:${normalizeRoomId(roomId)}:host`;
}

function userChannel(userId: string): string {
  return `user:${userId.trim()}`;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function resolveRoomHostId(room: unknown): string {
  const createdBy = (room as { createdBy?: { _id?: unknown } | unknown })?.createdBy;
  const host = (room as { host?: { _id?: unknown } | unknown })?.host;
  const owner = createdBy || host;

  return String(
    owner && typeof owner === "object" && "_id" in owner
      ? (owner as { _id?: unknown })._id
      : owner || ""
  ).trim();
}

async function getStudyRoomHostId(roomId: string): Promise<string> {
  const normalizedRoomId = normalizeRoomId(roomId);

  await connectDB();

  const room = await StudyRoom.findOne({
    roomId: { $regex: `^${escapeRegex(normalizedRoomId)}$`, $options: "i" },
  })
    .select("createdBy host roomId")
    .lean();

  return resolveRoomHostId(room);
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
  socket.join(userChannel(normalizedUserId));

  const hostId = await getStudyRoomHostId(normalizedRoomId).catch(() => "");
  const isHost = Boolean(hostId && hostId === normalizedUserId);

  if (isHost) {
    socket.join(roomHostChannel(normalizedRoomId));
  }

  clearAutoCloseTimer(normalizedRoomId);
  await markStudyRoomParticipantConnected(normalizedRoomId, normalizedUserId);

  socket.emit("study-room:joined", {
    roomId: normalizedRoomId,
    isHost,
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
  socket.leave(roomHostChannel(normalizedRoomId));
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

function handleStudyBuddyIdentifyEvent(
  socket: Socket,
  payload: StudyBuddyIdentifyPayload
): void {
  if (!isNonEmptyString(payload.userId)) {
    socket.emit("study-room:error", {
      message: "userId is required for study-buddy:identify",
    });
    return;
  }

  socket.join(userChannel(payload.userId));
  socket.emit("study-buddy:identified", {
    userId: payload.userId.trim(),
    namespace: STUDY_ROOM_SOCKET_NAMESPACE,
  });
}

async function handleKnockRoomEvent(
  socket: Socket,
  payload: KnockRoomPayload
): Promise<void> {
  if (!isNonEmptyString(payload.roomId) || !isNonEmptyString(payload.userId)) {
    socket.emit("study-room:error", {
      message: "roomId and userId are required for knock-room",
    });
    return;
  }

  const normalizedRoomId = normalizeRoomId(payload.roomId);
  const normalizedUserId = payload.userId.trim();
  const userName = isNonEmptyString(payload.userName)
    ? payload.userName.trim()
    : "Study Buddy";
  const hostId = await getStudyRoomHostId(normalizedRoomId).catch(() => "");

  if (!hostId) {
    socket.emit("knock-response", {
      roomId: normalizedRoomId,
      targetUserId: normalizedUserId,
      status: "declined",
      message: "Room host is unavailable.",
    });
    return;
  }

  getSocketData(socket).roomUserId = normalizedUserId;
  addSocketMembership(socket, normalizedRoomId);
  socket.join(roomChannel(normalizedRoomId));
  socket.join(userChannel(normalizedUserId));

  const knockPayload = {
    roomId: normalizedRoomId,
    userId: normalizedUserId,
    userName,
  };

  socket.nsp
    .to([roomHostChannel(normalizedRoomId), userChannel(hostId)])
    .emit("knock-room", knockPayload);

  socket.emit("knock-room:sent", {
    roomId: normalizedRoomId,
    userId: normalizedUserId,
  });
}

async function handleKnockResponseEvent(
  socket: Socket,
  payload: KnockResponsePayload
): Promise<void> {
  if (
    !isNonEmptyString(payload.roomId) ||
    !isNonEmptyString(payload.targetUserId) ||
    (payload.status !== "admitted" && payload.status !== "declined")
  ) {
    socket.emit("study-room:error", {
      message:
        "roomId, targetUserId, and status ('admitted' or 'declined') are required for knock-response",
    });
    return;
  }

  const normalizedRoomId = normalizeRoomId(payload.roomId);
  const targetUserId = payload.targetUserId.trim();
  const responderUserId = getSocketData(socket).roomUserId;
  const hostId = await getStudyRoomHostId(normalizedRoomId).catch(() => "");

  if (!hostId || responderUserId !== hostId) {
    socket.emit("study-room:error", {
      message: "Only the room host can respond to knocks.",
    });
    return;
  }

  socket.nsp.to(userChannel(targetUserId)).emit("knock-response", {
    roomId: normalizedRoomId,
    targetUserId,
    status: payload.status,
  });
}

export function emitBuddyRequestAccepted(
  requesterId: string,
  payload: BuddyRequestAcceptedPayload
): boolean {
  if (!studyRoomNamespace || !isNonEmptyString(requesterId)) {
    return false;
  }

  studyRoomNamespace.to(userChannel(requesterId)).emit("buddy-request-accepted", payload);
  return true;
}

/**
 * Registers the dedicated Socket.IO namespace for study rooms.
 * Namespace path is fixed to /study-room.
 */
export function registerStudyRoomNamespace(io: Server): Namespace {
  const namespace = io.of(STUDY_ROOM_SOCKET_NAMESPACE);
  studyRoomNamespace = namespace;

  namespace.on("connection", (socket: Socket) => {
    socket.on("study-buddy:identify", (payload: StudyBuddyIdentifyPayload) => {
      handleStudyBuddyIdentifyEvent(socket, payload);
    });

    socket.on("study-room:join", async (payload: StudyRoomJoinPayload) => {
      await handleJoinEvent(socket, payload);
    });

    socket.on("study-room:leave", async (payload: StudyRoomJoinPayload) => {
      await handleLeaveEvent(socket, payload);
    });

    socket.on("knock-room", async (payload: KnockRoomPayload) => {
      await handleKnockRoomEvent(socket, payload);
    });

    socket.on("knock-response", async (payload: KnockResponsePayload) => {
      await handleKnockResponseEvent(socket, payload);
    });

    socket.on("disconnecting", async () => {
      await handleDisconnectingEvent(socket);
    });
  });

  return namespace;
}
