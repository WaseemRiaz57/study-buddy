import type { Namespace, Server, Socket } from "socket.io";
import { connectDB } from "@/lib/connectDB";
import {
  markStudyRoomParticipantConnected,
  markStudyRoomParticipantDisconnected,
} from "@/lib/redis";
import {
  closeStudyRoomAndPersistDuration,
  maybeAutoCloseStudyRoom,
} from "@/lib/study-room-lifecycle";
import {
  ROOM_AUTO_CLOSE_GRACE_SECONDS,
  STUDY_ROOM_SOCKET_NAMESPACE,
} from "@/lib/study-room-constants";
import StudyRoom from "@/models/StudyRoom";

type StudyRoomJoinPayload = {
  roomId?: string;
  userId?: string;
};

type MentorEndSessionPayload = {
  roomId?: string;
  mentorId?: string;
  studentId?: string;
  sessionId?: string;
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

type ConversationJoinPayload = {
  conversationId?: string;
  userId?: string;
};

type ConversationMessagePayload = {
  conversationId?: string;
  message?: unknown;
};

type ConversationTypingPayload = {
  conversationId?: string;
  userId?: string;
  userName?: string;
};

type StudyRoomSocketData = {
  roomMemberships?: string[];
  roomUserId?: string;
  conversationMemberships?: string[];
};

const autoCloseTimers = new Map<string, NodeJS.Timeout>();
const socketUserIds = new Map<string, string>();
const userSocketIds = new Map<string, Set<string>>();
const conversationUserSockets = new Map<string, Map<string, Set<string>>>();
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

function conversationChannel(conversationId: string): string {
  return `conversation:${conversationId.trim()}`;
}

function normalizeConversationId(conversationId: string): string {
  return conversationId.trim();
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

function addConversationMembership(socket: Socket, conversationId: string): void {
  const data = getSocketData(socket);
  const normalizedConversationId = normalizeConversationId(conversationId);
  const memberships = Array.isArray(data.conversationMemberships)
    ? data.conversationMemberships
    : [];

  if (!memberships.includes(normalizedConversationId)) {
    memberships.push(normalizedConversationId);
  }

  data.conversationMemberships = memberships;
}

function removeConversationMembership(socket: Socket, conversationId: string): void {
  const data = getSocketData(socket);
  const normalizedConversationId = normalizeConversationId(conversationId);
  const memberships = Array.isArray(data.conversationMemberships)
    ? data.conversationMemberships
    : [];

  data.conversationMemberships = memberships.filter(
    (memberConversationId) => memberConversationId !== normalizedConversationId
  );
}

function markUserOnline(socket: Socket, userId: string): void {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) return;

  socketUserIds.set(socket.id, normalizedUserId);
  const sockets = userSocketIds.get(normalizedUserId) || new Set<string>();
  sockets.add(socket.id);
  userSocketIds.set(normalizedUserId, sockets);
  getSocketData(socket).roomUserId = normalizedUserId;
  socket.join(userChannel(normalizedUserId));

  socket.nsp.emit("user_online", {
    userId: normalizedUserId,
    onlineUserIds: Array.from(userSocketIds.keys()),
  });
}

function markUserOffline(socket: Socket): void {
  const userId = socketUserIds.get(socket.id);
  if (!userId) return;

  socketUserIds.delete(socket.id);
  const sockets = userSocketIds.get(userId);
  sockets?.delete(socket.id);

  if (!sockets || sockets.size === 0) {
    userSocketIds.delete(userId);
    socket.nsp.emit("user_offline", {
      userId,
      onlineUserIds: Array.from(userSocketIds.keys()),
    });
  }
}

function markConversationUserJoined(
  socket: Socket,
  conversationId: string,
  userId: string
): void {
  const normalizedConversationId = normalizeConversationId(conversationId);
  const normalizedUserId = userId.trim();
  const users =
    conversationUserSockets.get(normalizedConversationId) ||
    new Map<string, Set<string>>();
  const sockets = users.get(normalizedUserId) || new Set<string>();
  sockets.add(socket.id);
  users.set(normalizedUserId, sockets);
  conversationUserSockets.set(normalizedConversationId, users);
}

function markConversationUserLeft(
  socket: Socket,
  conversationId: string,
  userId?: string
): void {
  const normalizedConversationId = normalizeConversationId(conversationId);
  const normalizedUserId = String(userId || socketUserIds.get(socket.id) || "").trim();
  if (!normalizedConversationId || !normalizedUserId) return;

  const users = conversationUserSockets.get(normalizedConversationId);
  const sockets = users?.get(normalizedUserId);
  sockets?.delete(socket.id);

  if (sockets && sockets.size > 0) {
    users?.set(normalizedUserId, sockets);
    return;
  }

  users?.delete(normalizedUserId);

  if (!users || users.size === 0) {
    conversationUserSockets.delete(normalizedConversationId);
  }
}

export function isUserInConversationRoom(
  conversationId: string,
  userId: string
): boolean {
  const normalizedConversationId = normalizeConversationId(conversationId);
  const normalizedUserId = userId.trim();
  const sockets = conversationUserSockets
    .get(normalizedConversationId)
    ?.get(normalizedUserId);

  return Boolean(sockets && sockets.size > 0);
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
    const state = await markStudyRoomParticipantDisconnected(normalizedRoomId, userId);
    if (state && state.connectedUserIds.length === 0) {
      clearAutoCloseTimer(normalizedRoomId);
      await closeStudyRoomAndPersistDuration(normalizedRoomId, "inactive-disconnect");
    } else {
      scheduleAutoCloseTimer(normalizedRoomId);
    }
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
    const state = await markStudyRoomParticipantDisconnected(roomId, userId);
    if (state && state.connectedUserIds.length === 0) {
      clearAutoCloseTimer(roomId);
      await closeStudyRoomAndPersistDuration(roomId, "inactive-disconnect");
    } else {
      scheduleAutoCloseTimer(roomId);
    }
  }
}

function cleanupConversationMemberships(socket: Socket): void {
  const data = getSocketData(socket);
  const userId = data.roomUserId || socketUserIds.get(socket.id);
  const memberships = Array.isArray(data.conversationMemberships)
    ? [...new Set(data.conversationMemberships)]
    : [];

  for (const conversationId of memberships) {
    markConversationUserLeft(socket, conversationId, userId);
  }

  data.conversationMemberships = [];
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

  const userId = payload.userId.trim();
  markUserOnline(socket, userId);
  socket.emit("study-buddy:identified", {
    userId,
    namespace: STUDY_ROOM_SOCKET_NAMESPACE,
    onlineUserIds: Array.from(userSocketIds.keys()),
  });
}

function handleJoinConversationEvent(
  socket: Socket,
  payload: ConversationJoinPayload
): void {
  if (!isNonEmptyString(payload.conversationId) || !isNonEmptyString(payload.userId)) {
    socket.emit("messages:error", {
      message: "conversationId and userId are required for join-conversation",
    });
    return;
  }

  const conversationId = payload.conversationId.trim();
  const userId = payload.userId.trim();

  markUserOnline(socket, userId);
  addConversationMembership(socket, conversationId);
  markConversationUserJoined(socket, conversationId, userId);
  socket.join(conversationChannel(conversationId));
  socket.join(userChannel(userId));
  socket.emit("conversation-joined", { conversationId });
}

function handleLeaveConversationEvent(
  socket: Socket,
  payload: ConversationJoinPayload
): void {
  if (!isNonEmptyString(payload.conversationId)) {
    return;
  }

  const conversationId = payload.conversationId.trim();
  const userId = isNonEmptyString(payload.userId)
    ? payload.userId.trim()
    : getSocketData(socket).roomUserId;

  socket.leave(conversationChannel(conversationId));
  removeConversationMembership(socket, conversationId);
  markConversationUserLeft(socket, conversationId, userId);
}

function handleSendMessageEvent(
  socket: Socket,
  payload: ConversationMessagePayload
): void {
  if (!isNonEmptyString(payload.conversationId) || !payload.message) {
    socket.emit("messages:error", {
      message: "conversationId and message are required for send-message",
    });
    return;
  }

  const conversationId = payload.conversationId.trim();
  socket.nsp.to(conversationChannel(conversationId)).emit("receive-message", {
    conversationId,
    message: payload.message,
  });
}

function handleTypingEvent(
  socket: Socket,
  payload: ConversationTypingPayload,
  eventName: "typing" | "stop_typing"
): void {
  if (!isNonEmptyString(payload.conversationId) || !isNonEmptyString(payload.userId)) {
    return;
  }

  const conversationId = payload.conversationId.trim();
  const userId = payload.userId.trim();

  socket.to(conversationChannel(conversationId)).emit(eventName, {
    conversationId,
    userId,
    userName: isNonEmptyString(payload.userName) ? payload.userName.trim() : "User",
  });
}

function handleMentorWantsToEndEvent(
  socket: Socket,
  payload: MentorEndSessionPayload
): void {
  if (!isNonEmptyString(payload.roomId) || !isNonEmptyString(payload.studentId)) {
    socket.emit("study-room:error", {
      message: "roomId and studentId are required for mentor_wants_to_end",
    });
    return;
  }

  socket.nsp.to(userChannel(payload.studentId.trim())).emit("mentor_wants_to_end", {
    roomId: normalizeRoomId(payload.roomId),
    mentorId: isNonEmptyString(payload.mentorId) ? payload.mentorId.trim() : "",
    sessionId: isNonEmptyString(payload.sessionId) ? payload.sessionId.trim() : "",
  });
}

function handleStudentEndSessionResponseEvent(
  socket: Socket,
  payload: MentorEndSessionPayload & { approved?: boolean }
): void {
  if (!isNonEmptyString(payload.roomId) || !isNonEmptyString(payload.mentorId)) {
    socket.emit("study-room:error", {
      message: "roomId and mentorId are required for student_end_session_response",
    });
    return;
  }

  socket.nsp.to(userChannel(payload.mentorId.trim())).emit("student_end_session_response", {
    roomId: normalizeRoomId(payload.roomId),
    sessionId: isNonEmptyString(payload.sessionId) ? payload.sessionId.trim() : "",
    approved: Boolean(payload.approved),
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

export function emitUserNotification(userId: string, notification: unknown): boolean {
  if (!studyRoomNamespace || !isNonEmptyString(userId)) {
    return false;
  }

  studyRoomNamespace.to(userChannel(userId)).emit("notification:new", notification);
  return true;
}

export function emitSessionCompleted(
  studentId: string,
  payload: { sessionId: string; mentorName?: string; subject?: string }
): boolean {
  if (!studyRoomNamespace || !isNonEmptyString(studentId)) {
    return false;
  }

  studyRoomNamespace.to(userChannel(studentId)).emit("session_completed", payload);
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

    socket.on("join-conversation", (payload: ConversationJoinPayload) => {
      handleJoinConversationEvent(socket, payload);
    });

    socket.on("leave-conversation", (payload: ConversationJoinPayload) => {
      handleLeaveConversationEvent(socket, payload);
    });

    socket.on("send-message", (payload: ConversationMessagePayload) => {
      handleSendMessageEvent(socket, payload);
    });

    socket.on("typing", (payload: ConversationTypingPayload) => {
      handleTypingEvent(socket, payload, "typing");
    });

    socket.on("stop_typing", (payload: ConversationTypingPayload) => {
      handleTypingEvent(socket, payload, "stop_typing");
    });

    socket.on("mentor_wants_to_end", (payload: MentorEndSessionPayload) => {
      handleMentorWantsToEndEvent(socket, payload);
    });

    socket.on(
      "student_end_session_response",
      (payload: MentorEndSessionPayload & { approved?: boolean }) => {
        handleStudentEndSessionResponseEvent(socket, payload);
      }
    );

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
      cleanupConversationMemberships(socket);
      await handleDisconnectingEvent(socket);
    });

    socket.on("disconnect", () => {
      markUserOffline(socket);
    });
  });

  return namespace;
}

