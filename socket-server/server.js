/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Study Buddy — Standalone Socket.IO Microservice
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This server hosts all real-time WebSocket functionality for the Study Buddy
 * platform, running independently from the Next.js frontend on Vercel.
 *
 * Deployed on Render (or any long-lived Node.js host) to bypass Vercel's
 * serverless WebSocket limitations.
 *
 * Features:
 *   • /study-room namespace — study rooms, buddy matching, messaging, notifications
 *   • MongoDB integration — room participant management, lifecycle & XP awards
 *   • Upstash Redis integration — room runtime state tracking
 *   • REST /emit endpoint — server-to-server event pushing (webhook)
 *   • Health-check endpoint — GET /health
 * ═══════════════════════════════════════════════════════════════════════════════
 */

require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

// ─── Configuration ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
const EMIT_SECRET = process.env.EMIT_SECRET || "";

const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const MONGODB_URI = process.env.MONGODB_URI || "";

// ─── Constants (mirrored from study-room-constants.ts) ──────────────────────

const STUDY_ROOM_SOCKET_NAMESPACE = "/study-room";
const ROOM_STATE_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const ROOM_AUTO_CLOSE_GRACE_SECONDS = 5 * 60; // 5 minutes
const MIN_ROOM_SESSION_MINUTES_FOR_XP = 10;
const ROOM_XP_PER_MINUTE = 10;

// ─── Mongoose Models ────────────────────────────────────────────────────────────

const { Schema } = mongoose;

const StudyRoomSchema = new Schema(
  {
    roomId: { type: String, required: true, unique: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    participants: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    waitingList: {
      type: [
        {
          userId: { type: String, required: true, trim: true },
          userName: { type: String, required: true, trim: true },
          status: {
            type: String,
            enum: ["waiting", "admitted", "declined"],
            default: "waiting",
            required: true,
          },
        },
      ],
      default: [],
    },
    maxParticipants: { type: Number, default: 20, min: 2 },
    isActive: { type: Boolean, default: true, index: true },
    status: { type: String, default: "active", index: true, trim: true },
    isLive: { type: Boolean, default: true },
    closedAt: { type: Date, default: null },
    sessionDurationMinutes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

StudyRoomSchema.index({ roomId: 1 }, { unique: true });
StudyRoomSchema.index({ isLive: 1, createdAt: -1 });

const UserSchema = new Schema({ email: String }, { strict: false });

const UserProgressSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    todayMinutes: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },
  },
  { strict: false, timestamps: true }
);

const StudyRoom =
  mongoose.models.StudyRoom || mongoose.model("StudyRoom", StudyRoomSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const UserProgress =
  mongoose.models.UserProgress ||
  mongoose.model("UserProgress", UserProgressSchema);

// ─── Redis (Upstash HTTP) ───────────────────────────────────────────────────────

let Redis;
try {
  Redis = require("@upstash/redis").Redis;
} catch {
  Redis = null;
}

let redisClient = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token || !Redis) return null;

  redisClient = new Redis({ url, token });
  return redisClient;
}

// ─── Redis Room State Helpers ───────────────────────────────────────────────────

function normalizeRoomId(roomId) {
  return roomId.trim().toUpperCase();
}

function getStudyRoomStateKey(roomId) {
  return `study-room:state:${normalizeRoomId(roomId)}`;
}

function getStudyRoomEmptyMarkerKey(roomId) {
  return `study-room:empty:${normalizeRoomId(roomId)}`;
}

function uniqueUserIds(userIds) {
  return [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
}

function createStudyRoomRuntimeState(
  roomId,
  connectedUserIds,
  awaitingAutoClose,
  lastEmptyAt,
  updatedAt = new Date().toISOString()
) {
  return {
    roomId: normalizeRoomId(roomId),
    connectedUserIds: uniqueUserIds(connectedUserIds),
    awaitingAutoClose,
    lastEmptyAt,
    updatedAt,
  };
}

function parseStudyRoomRuntimeState(roomId, rawState) {
  try {
    const parsed =
      typeof rawState === "string" ? JSON.parse(rawState) : rawState;
    return createStudyRoomRuntimeState(
      normalizeRoomId(roomId),
      Array.isArray(parsed.connectedUserIds)
        ? parsed.connectedUserIds.filter((id) => typeof id === "string")
        : [],
      Boolean(parsed.awaitingAutoClose),
      parsed.lastEmptyAt || null,
      parsed.updatedAt || new Date().toISOString()
    );
  } catch {
    return null;
  }
}

async function getStudyRoomState(roomId) {
  const client = getRedisClient();
  if (!client) return null;

  const rawState = await client.get(getStudyRoomStateKey(roomId));
  if (!rawState) return null;

  return parseStudyRoomRuntimeState(roomId, rawState);
}

async function setStudyRoomState(roomId, state, ttlSeconds) {
  const client = getRedisClient();
  if (!client) return;

  const normalizedId = normalizeRoomId(roomId);
  const nextState = createStudyRoomRuntimeState(
    normalizedId,
    state.connectedUserIds,
    state.awaitingAutoClose,
    state.lastEmptyAt
  );

  const ttl =
    ttlSeconds && ttlSeconds > 0
      ? Math.min(ttlSeconds, ROOM_STATE_TTL_SECONDS)
      : ROOM_STATE_TTL_SECONDS;

  await client.set(getStudyRoomStateKey(normalizedId), JSON.stringify(nextState), {
    ex: ttl,
  });
}

async function markStudyRoomParticipantConnected(roomId, userId) {
  const normalizedId = normalizeRoomId(roomId);
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) return getStudyRoomState(normalizedId);

  const existingState =
    (await getStudyRoomState(normalizedId)) ||
    createStudyRoomRuntimeState(normalizedId, [], false, null);

  const nextState = createStudyRoomRuntimeState(
    normalizedId,
    [...existingState.connectedUserIds, normalizedUserId],
    false,
    null
  );

  await setStudyRoomState(normalizedId, nextState);

  const client = getRedisClient();
  if (client) {
    await client.del(getStudyRoomEmptyMarkerKey(normalizedId));
  }

  return nextState;
}

async function markStudyRoomParticipantDisconnected(roomId, userId) {
  const normalizedId = normalizeRoomId(roomId);
  const normalizedUserId = userId.trim();

  const existingState =
    (await getStudyRoomState(normalizedId)) ||
    createStudyRoomRuntimeState(normalizedId, [], false, null);

  const nextConnectedUserIds = existingState.connectedUserIds.filter(
    (id) => id !== normalizedUserId
  );

  const shouldWaitForAutoClose = nextConnectedUserIds.length === 0;
  const nextState = createStudyRoomRuntimeState(
    normalizedId,
    nextConnectedUserIds,
    shouldWaitForAutoClose,
    shouldWaitForAutoClose ? new Date().toISOString() : null
  );

  await setStudyRoomState(normalizedId, nextState);

  const client = getRedisClient();
  if (client) {
    if (shouldWaitForAutoClose) {
      await client.set(
        getStudyRoomEmptyMarkerKey(normalizedId),
        nextState.lastEmptyAt || new Date().toISOString(),
        { ex: ROOM_AUTO_CLOSE_GRACE_SECONDS }
      );
    } else {
      await client.del(getStudyRoomEmptyMarkerKey(normalizedId));
    }
  }

  return nextState;
}

async function isStudyRoomAutoCloseDue(roomId, state) {
  const normalizedId = normalizeRoomId(roomId);
  const runtimeState = state || (await getStudyRoomState(normalizedId));

  if (!runtimeState || !runtimeState.awaitingAutoClose) return false;

  const client = getRedisClient();
  if (client) {
    const ttl = await client.ttl(getStudyRoomEmptyMarkerKey(normalizedId));
    if (ttl === -2) return true;
    if (ttl >= 0) return false;
  }

  if (!runtimeState.lastEmptyAt) return false;

  const elapsedMs = Date.now() - new Date(runtimeState.lastEmptyAt).getTime();
  return elapsedMs >= ROOM_AUTO_CLOSE_GRACE_SECONDS * 1000;
}

async function getStudyRoomEmptyTtlSeconds(roomId) {
  const client = getRedisClient();
  if (!client) return null;

  const ttl = await client.ttl(getStudyRoomEmptyMarkerKey(roomId));
  if (ttl < 0) return null;

  return ttl;
}

async function clearStudyRoomRuntimeState(roomId) {
  const client = getRedisClient();
  if (!client) return;

  await client.del(
    getStudyRoomStateKey(roomId),
    getStudyRoomEmptyMarkerKey(roomId)
  );
}

// ─── Room Lifecycle ─────────────────────────────────────────────────────────────

function calculateSessionDurationMinutes(startedAt, endedAt) {
  const elapsedMs = Math.max(0, endedAt.getTime() - startedAt.getTime());
  return Math.floor(elapsedMs / (60 * 1000));
}

function calculateRoomSessionXp(sessionDurationMinutes) {
  if (sessionDurationMinutes < MIN_ROOM_SESSION_MINUTES_FOR_XP) return 0;
  return sessionDurationMinutes * ROOM_XP_PER_MINUTE;
}

function isSameCalendarDay(a, b) {
  return a.toDateString() === b.toDateString();
}

async function awardRoomSessionXpToParticipants(
  participantIds,
  sessionDurationMinutes,
  closedAt
) {
  const xp = calculateRoomSessionXp(sessionDurationMinutes);
  if (xp <= 0 || participantIds.length === 0) return;

  for (const participantId of participantIds) {
    const user = await User.findById(participantId, "email").lean();
    const progressKey = user?.email?.trim() || participantId;

    let progress = await UserProgress.findOne({ userId: progressKey });
    if (!progress) {
      progress = await UserProgress.create({ userId: progressKey });
    }

    if (!isSameCalendarDay(new Date(progress.lastActiveDate), closedAt)) {
      progress.todayMinutes = 0;
    }

    progress.xp += xp;
    progress.todayMinutes += sessionDurationMinutes;
    progress.lastActiveDate = closedAt;
    progress.level = Math.floor(progress.xp / 1000) + 1;
    await progress.save();
  }
}

async function closeStudyRoomAndPersistDuration(roomId, reason = "manual") {
  const normalizedId = normalizeRoomId(roomId);

  const existingRoom = await StudyRoom.findOne({ roomId: normalizedId });

  if (!existingRoom) {
    return { roomId: normalizedId, reason, closed: false, notFound: true };
  }

  if (!existingRoom.isLive) {
    return {
      roomId: normalizedId,
      reason,
      closed: false,
      alreadyClosed: true,
      notFound: false,
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
      isActive: false,
      status: "ended",
      closedAt,
      sessionDurationMinutes,
    },
    { new: true }
  );

  if (!updatedRoom) {
    return {
      roomId: normalizedId,
      reason,
      closed: false,
      alreadyClosed: true,
      notFound: false,
    };
  }

  const participantIds = [
    ...new Set(
      existingRoom.participants
        .map((p) => p.toString())
        .filter((id) => id.trim())
    ),
  ];

  await awardRoomSessionXpToParticipants(
    participantIds,
    sessionDurationMinutes,
    closedAt
  );

  await clearStudyRoomRuntimeState(normalizedId);

  return {
    roomId: normalizedId,
    reason,
    closed: true,
    alreadyClosed: false,
    notFound: false,
    sessionDurationMinutes,
  };
}

async function maybeAutoCloseStudyRoom(roomId) {
  const normalizedId = normalizeRoomId(roomId);
  const state = await getStudyRoomState(normalizedId);

  if (!state) return { roomId: normalizedId, closed: false };
  if (!state.awaitingAutoClose)
    return { roomId: normalizedId, closed: false };

  const shouldAutoClose = await isStudyRoomAutoCloseDue(normalizedId, state);

  if (!shouldAutoClose) {
    return {
      roomId: normalizedId,
      closed: false,
      pendingSeconds:
        (await getStudyRoomEmptyTtlSeconds(normalizedId)) ||
        ROOM_AUTO_CLOSE_GRACE_SECONDS,
    };
  }

  return closeStudyRoomAndPersistDuration(normalizedId, "inactive-disconnect");
}

// ─── Socket Helpers ─────────────────────────────────────────────────────────────

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function roomChannel(roomId) {
  return `room:${normalizeRoomId(roomId)}`;
}

function roomHostChannel(roomId) {
  return `room:${normalizeRoomId(roomId)}:host`;
}

function userChannel(userId) {
  return `user:${userId.trim()}`;
}

function conversationChannel(conversationId) {
  return `conversation:${conversationId.trim()}`;
}

function normalizeConversationId(conversationId) {
  return conversationId.trim();
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── In-Memory Maps ─────────────────────────────────────────────────────────────

const autoCloseTimers = new Map();
const socketUserIds = new Map();
const userSocketIds = new Map();
const conversationUserSockets = new Map();

// ─── Socket Data Helpers ────────────────────────────────────────────────────────

function getSocketData(socket) {
  return socket.data;
}

function addSocketMembership(socket, roomId) {
  const data = getSocketData(socket);
  if (!Array.isArray(data.roomMemberships)) data.roomMemberships = [];
  if (!data.roomMemberships.includes(roomId)) {
    data.roomMemberships.push(roomId);
  }
}

function removeSocketMembership(socket, roomId) {
  const data = getSocketData(socket);
  if (!Array.isArray(data.roomMemberships)) return;
  data.roomMemberships = data.roomMemberships.filter((id) => id !== roomId);
}

function addConversationMembership(socket, conversationId) {
  const data = getSocketData(socket);
  const normalizedId = normalizeConversationId(conversationId);
  if (!Array.isArray(data.conversationMemberships))
    data.conversationMemberships = [];
  if (!data.conversationMemberships.includes(normalizedId)) {
    data.conversationMemberships.push(normalizedId);
  }
}

function removeConversationMembership(socket, conversationId) {
  const data = getSocketData(socket);
  const normalizedId = normalizeConversationId(conversationId);
  if (!Array.isArray(data.conversationMemberships)) return;
  data.conversationMemberships = data.conversationMemberships.filter(
    (id) => id !== normalizedId
  );
}

// ─── Online Presence ────────────────────────────────────────────────────────────

function markUserOnline(socket, userId, namespace) {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) return;

  socketUserIds.set(socket.id, normalizedUserId);
  const sockets = userSocketIds.get(normalizedUserId) || new Set();
  sockets.add(socket.id);
  userSocketIds.set(normalizedUserId, sockets);
  getSocketData(socket).roomUserId = normalizedUserId;
  socket.join(userChannel(normalizedUserId));

  namespace.emit("user_online", {
    userId: normalizedUserId,
    onlineUserIds: Array.from(userSocketIds.keys()),
  });
}

function markUserOffline(socket, namespace) {
  const userId = socketUserIds.get(socket.id);
  if (!userId) return;

  socketUserIds.delete(socket.id);
  const sockets = userSocketIds.get(userId);
  sockets?.delete(socket.id);

  if (!sockets || sockets.size === 0) {
    userSocketIds.delete(userId);
    namespace.emit("user_offline", {
      userId,
      onlineUserIds: Array.from(userSocketIds.keys()),
    });
  }
}

// ─── Conversation Presence ──────────────────────────────────────────────────────

function markConversationUserJoined(socket, conversationId, userId) {
  const normalizedConvId = normalizeConversationId(conversationId);
  const normalizedUserId = userId.trim();
  const users =
    conversationUserSockets.get(normalizedConvId) || new Map();
  const sockets = users.get(normalizedUserId) || new Set();
  sockets.add(socket.id);
  users.set(normalizedUserId, sockets);
  conversationUserSockets.set(normalizedConvId, users);
}

function markConversationUserLeft(socket, conversationId, userId) {
  const normalizedConvId = normalizeConversationId(conversationId);
  const normalizedUserId = String(
    userId || socketUserIds.get(socket.id) || ""
  ).trim();
  if (!normalizedConvId || !normalizedUserId) return;

  const users = conversationUserSockets.get(normalizedConvId);
  const sockets = users?.get(normalizedUserId);
  sockets?.delete(socket.id);

  if (sockets && sockets.size > 0) {
    users?.set(normalizedUserId, sockets);
    return;
  }

  users?.delete(normalizedUserId);
  if (!users || users.size === 0) {
    conversationUserSockets.delete(normalizedConvId);
  }
}

function cleanupConversationMemberships(socket) {
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

// ─── Auto-Close Timers ──────────────────────────────────────────────────────────

function clearAutoCloseTimer(roomId) {
  const normalizedId = normalizeRoomId(roomId);
  const timer = autoCloseTimers.get(normalizedId);
  if (!timer) return;
  clearTimeout(timer);
  autoCloseTimers.delete(normalizedId);
}

function scheduleAutoCloseTimer(roomId) {
  const normalizedId = normalizeRoomId(roomId);
  clearAutoCloseTimer(normalizedId);

  const timer = setTimeout(async () => {
    autoCloseTimers.delete(normalizedId);
    await maybeAutoCloseStudyRoom(normalizedId);
  }, ROOM_AUTO_CLOSE_GRACE_SECONDS * 1000);

  autoCloseTimers.set(normalizedId, timer);
}

// ─── Room Host Resolution ───────────────────────────────────────────────────────

function resolveRoomHostId(room) {
  const createdBy = room?.createdBy;
  const host = room?.host;
  const owner = createdBy || host;
  return String(
    owner && typeof owner === "object" && "_id" in owner
      ? owner._id
      : owner || ""
  ).trim();
}

async function getStudyRoomHostId(roomId) {
  const normalizedId = normalizeRoomId(roomId);

  const room = await StudyRoom.findOne({
    roomId: { $regex: `^${escapeRegex(normalizedId)}$`, $options: "i" },
  })
    .select("createdBy host roomId")
    .lean();

  return resolveRoomHostId(room);
}

async function removeStudyRoomParticipant(roomId, userId) {
  const normalizedId = normalizeRoomId(roomId);
  const normalizedUserId = userId.trim();

  if (!/^[a-f\d]{24}$/i.test(normalizedUserId)) return null;

  const updatedRoom = await StudyRoom.findOneAndUpdate(
    {
      roomId: { $regex: `^${escapeRegex(normalizedId)}$`, $options: "i" },
    },
    { $pull: { participants: normalizedUserId } },
    { new: true }
  )
    .select("participants")
    .lean();

  if (!updatedRoom) return null;

  return Array.isArray(updatedRoom.participants)
    ? updatedRoom.participants.length
    : 0;
}

// ─── Socket Event Handlers ──────────────────────────────────────────────────────

async function handleJoinEvent(socket, payload) {
  if (!isNonEmptyString(payload.roomId) || !isNonEmptyString(payload.userId)) {
    socket.emit("study-room:error", {
      message: "roomId and userId are required for study-room:join",
    });
    return;
  }

  const normalizedId = normalizeRoomId(payload.roomId);
  const normalizedUserId = payload.userId.trim();

  getSocketData(socket).roomUserId = normalizedUserId;
  addSocketMembership(socket, normalizedId);
  socket.join(roomChannel(normalizedId));
  socket.join(userChannel(normalizedUserId));

  const hostId = await getStudyRoomHostId(normalizedId).catch(() => "");
  const isHost = Boolean(hostId && hostId === normalizedUserId);

  if (isHost) {
    socket.join(roomHostChannel(normalizedId));
  }

  clearAutoCloseTimer(normalizedId);
  await markStudyRoomParticipantConnected(normalizedId, normalizedUserId);

  socket.emit("study-room:joined", {
    roomId: normalizedId,
    isHost,
    namespace: STUDY_ROOM_SOCKET_NAMESPACE,
  });
}

async function handleLeaveEvent(socket, payload) {
  if (!isNonEmptyString(payload.roomId)) {
    socket.emit("study-room:error", {
      message: "roomId is required for study-room:leave",
    });
    return;
  }

  const normalizedId = normalizeRoomId(payload.roomId);
  const userId = getSocketData(socket).roomUserId;

  socket.leave(roomChannel(normalizedId));
  socket.leave(roomHostChannel(normalizedId));
  removeSocketMembership(socket, normalizedId);

  if (isNonEmptyString(userId)) {
    const participantCount = await removeStudyRoomParticipant(
      normalizedId,
      userId
    );
    const state = await markStudyRoomParticipantDisconnected(
      normalizedId,
      userId
    );
    if (
      participantCount === 0 ||
      (state && state.connectedUserIds.length === 0)
    ) {
      clearAutoCloseTimer(normalizedId);
      await closeStudyRoomAndPersistDuration(normalizedId, "inactive-disconnect");
    } else {
      scheduleAutoCloseTimer(normalizedId);
    }
  }

  socket.emit("study-room:left", {
    roomId: normalizedId,
    namespace: STUDY_ROOM_SOCKET_NAMESPACE,
  });
}

async function handleDisconnectingEvent(socket) {
  const data = getSocketData(socket);
  const userId = data.roomUserId;
  const memberships = Array.isArray(data.roomMemberships)
    ? [...new Set(data.roomMemberships)]
    : [];

  if (!isNonEmptyString(userId) || memberships.length === 0) return;

  for (const roomId of memberships) {
    const participantCount = await removeStudyRoomParticipant(roomId, userId);
    const state = await markStudyRoomParticipantDisconnected(roomId, userId);
    if (
      participantCount === 0 ||
      (state && state.connectedUserIds.length === 0)
    ) {
      clearAutoCloseTimer(roomId);
      await closeStudyRoomAndPersistDuration(roomId, "inactive-disconnect");
    } else {
      scheduleAutoCloseTimer(roomId);
    }
  }
}

function handleStudyBuddyIdentifyEvent(socket, payload, namespace) {
  if (!isNonEmptyString(payload.userId)) {
    socket.emit("study-room:error", {
      message: "userId is required for study-buddy:identify",
    });
    return;
  }

  const userId = payload.userId.trim();
  markUserOnline(socket, userId, namespace);
  socket.emit("study-buddy:identified", {
    userId,
    namespace: STUDY_ROOM_SOCKET_NAMESPACE,
    onlineUserIds: Array.from(userSocketIds.keys()),
  });
}

function handleJoinConversationEvent(socket, payload, namespace) {
  if (
    !isNonEmptyString(payload.conversationId) ||
    !isNonEmptyString(payload.userId)
  ) {
    socket.emit("messages:error", {
      message:
        "conversationId and userId are required for join-conversation",
    });
    return;
  }

  const conversationId = payload.conversationId.trim();
  const userId = payload.userId.trim();

  markUserOnline(socket, userId, namespace);
  addConversationMembership(socket, conversationId);
  markConversationUserJoined(socket, conversationId, userId);
  socket.join(conversationChannel(conversationId));
  socket.join(userChannel(userId));
  socket.emit("conversation-joined", { conversationId });
}

function handleLeaveConversationEvent(socket, payload) {
  if (!isNonEmptyString(payload.conversationId)) return;

  const conversationId = payload.conversationId.trim();
  const userId = isNonEmptyString(payload.userId)
    ? payload.userId.trim()
    : getSocketData(socket).roomUserId;

  socket.leave(conversationChannel(conversationId));
  removeConversationMembership(socket, conversationId);
  markConversationUserLeft(socket, conversationId, userId);
}

function handleSendMessageEvent(socket, payload) {
  if (!isNonEmptyString(payload.conversationId) || !payload.message) {
    socket.emit("messages:error", {
      message: "conversationId and message are required for send-message",
    });
    return;
  }

  const conversationId = payload.conversationId.trim();
  socket.nsp
    .to(conversationChannel(conversationId))
    .emit("receive-message", {
      conversationId,
      message: payload.message,
    });
}

function handleTypingEvent(socket, payload, eventName) {
  if (
    !isNonEmptyString(payload.conversationId) ||
    !isNonEmptyString(payload.userId)
  )
    return;

  const conversationId = payload.conversationId.trim();
  const userId = payload.userId.trim();

  socket.to(conversationChannel(conversationId)).emit(eventName, {
    conversationId,
    userId,
    userName: isNonEmptyString(payload.userName)
      ? payload.userName.trim()
      : "User",
  });
}

function handleMentorWantsToEndEvent(socket, payload) {
  if (
    !isNonEmptyString(payload.roomId) ||
    !isNonEmptyString(payload.studentId)
  ) {
    socket.emit("study-room:error", {
      message: "roomId and studentId are required for mentor_wants_to_end",
    });
    return;
  }

  socket.nsp.to(userChannel(payload.studentId.trim())).emit("mentor_wants_to_end", {
    roomId: normalizeRoomId(payload.roomId),
    mentorId: isNonEmptyString(payload.mentorId)
      ? payload.mentorId.trim()
      : "",
    sessionId: isNonEmptyString(payload.sessionId)
      ? payload.sessionId.trim()
      : "",
  });
}

function handleStudentEndSessionResponseEvent(socket, payload) {
  if (
    !isNonEmptyString(payload.roomId) ||
    !isNonEmptyString(payload.mentorId)
  ) {
    socket.emit("study-room:error", {
      message:
        "roomId and mentorId are required for student_end_session_response",
    });
    return;
  }

  socket.nsp
    .to(userChannel(payload.mentorId.trim()))
    .emit("student_end_session_response", {
      roomId: normalizeRoomId(payload.roomId),
      sessionId: isNonEmptyString(payload.sessionId)
        ? payload.sessionId.trim()
        : "",
      approved: Boolean(payload.approved),
    });
}

async function handleKnockRoomEvent(socket, payload) {
  if (
    !isNonEmptyString(payload.roomId) ||
    !isNonEmptyString(payload.userId)
  ) {
    socket.emit("study-room:error", {
      message: "roomId and userId are required for knock-room",
    });
    return;
  }

  const normalizedId = normalizeRoomId(payload.roomId);
  const normalizedUserId = payload.userId.trim();
  const userName = isNonEmptyString(payload.userName)
    ? payload.userName.trim()
    : "Study Buddy";
  const hostId = await getStudyRoomHostId(normalizedId).catch(() => "");

  if (!hostId) {
    socket.emit("knock-response", {
      roomId: normalizedId,
      targetUserId: normalizedUserId,
      status: "declined",
      message: "Room host is unavailable.",
    });
    return;
  }

  getSocketData(socket).roomUserId = normalizedUserId;
  addSocketMembership(socket, normalizedId);
  socket.join(roomChannel(normalizedId));
  socket.join(userChannel(normalizedUserId));

  const knockPayload = {
    roomId: normalizedId,
    userId: normalizedUserId,
    userName,
  };

  socket.nsp
    .to([roomHostChannel(normalizedId), userChannel(hostId)])
    .emit("knock-room", knockPayload);

  socket.emit("knock-room:sent", {
    roomId: normalizedId,
    userId: normalizedUserId,
  });
}

async function handleKnockResponseEvent(socket, payload) {
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

  const normalizedId = normalizeRoomId(payload.roomId);
  const targetUserId = payload.targetUserId.trim();
  const responderUserId = getSocketData(socket).roomUserId;
  const hostId = await getStudyRoomHostId(normalizedId).catch(() => "");

  if (!hostId || responderUserId !== hostId) {
    socket.emit("study-room:error", {
      message: "Only the room host can respond to knocks.",
    });
    return;
  }

  socket.nsp.to(userChannel(targetUserId)).emit("knock-response", {
    roomId: normalizedId,
    targetUserId,
    status: payload.status,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPRESS & SOCKET.IO SERVER
// ═══════════════════════════════════════════════════════════════════════════════

const app = express();
const server = http.createServer(app);

// ─── CORS Middleware ────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: CORS_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

// ─── Socket.IO Server ──────────────────────────────────────────────────────────

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── /study-room Namespace ──────────────────────────────────────────────────────

const studyRoomNamespace = io.of(STUDY_ROOM_SOCKET_NAMESPACE);

studyRoomNamespace.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on("study-buddy:identify", (payload) => {
    handleStudyBuddyIdentifyEvent(socket, payload, studyRoomNamespace);
  });

  socket.on("join-conversation", (payload) => {
    handleJoinConversationEvent(socket, payload, studyRoomNamespace);
  });

  socket.on("leave-conversation", (payload) => {
    handleLeaveConversationEvent(socket, payload);
  });

  socket.on("send-message", (payload) => {
    handleSendMessageEvent(socket, payload);
  });

  socket.on("typing", (payload) => {
    handleTypingEvent(socket, payload, "typing");
  });

  socket.on("stop_typing", (payload) => {
    handleTypingEvent(socket, payload, "stop_typing");
  });

  socket.on("mentor_wants_to_end", (payload) => {
    handleMentorWantsToEndEvent(socket, payload);
  });

  socket.on("student_end_session_response", (payload) => {
    handleStudentEndSessionResponseEvent(socket, payload);
  });

  socket.on("study-room:join", async (payload) => {
    await handleJoinEvent(socket, payload);
  });

  socket.on("study-room:leave", async (payload) => {
    await handleLeaveEvent(socket, payload);
  });

  socket.on("knock-room", async (payload) => {
    await handleKnockRoomEvent(socket, payload);
  });

  socket.on("knock-response", async (payload) => {
    await handleKnockResponseEvent(socket, payload);
  });

  socket.on("disconnecting", async () => {
    cleanupConversationMemberships(socket);
    await handleDisconnectingEvent(socket);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    markUserOffline(socket, studyRoomNamespace);
  });
});

// ─── REST Endpoints ─────────────────────────────────────────────────────────────

/**
 * GET /health
 * Health-check for Render zero-downtime deploys and uptime monitors.
 */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    connections: studyRoomNamespace.sockets?.size || 0,
  });
});

/**
 * POST /emit
 * Server-to-server webhook for pushing socket events from the Next.js backend.
 *
 * Body: { event: string, userId: string, payload: object }
 * Header: x-emit-secret: <EMIT_SECRET>
 *
 * Supported events:
 *   • buddy-request-accepted  — relay match acceptance to a user
 *   • notification:new        — push a notification to a user
 *   • session_completed       — notify student of session completion
 */
app.post("/emit", (req, res) => {
  // Validate shared secret
  if (EMIT_SECRET && req.headers["x-emit-secret"] !== EMIT_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { event, userId, payload, room, data } = req.body;
  const targetUserId =
    isNonEmptyString(userId)
      ? userId.trim()
      : isNonEmptyString(room) && room.startsWith("user:")
        ? room.replace(/^user:/, "").trim()
        : "";
  const eventPayload = payload !== undefined ? payload : data;

  if (!event || !targetUserId) {
    return res
      .status(400)
      .json({ error: "event and userId are required" });
  }

  const targetChannel = userChannel(targetUserId);
  studyRoomNamespace.to(targetChannel).emit(event, eventPayload || {});

  return res.json({ ok: true, event, userId: targetUserId });
});

// ─── MongoDB Connection & Server Start ──────────────────────────────────────────

async function start() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI, { bufferCommands: false });
      console.log("✅ MongoDB connected");
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err.message);
      console.warn("⚠️  Server starting without database — room lifecycle features will be unavailable");
    }
  } else {
    console.warn("⚠️  MONGODB_URI not set — room lifecycle features will be unavailable");
  }

  server.listen(PORT, () => {
    console.log(`\n🚀 Study Buddy Socket Server running on port ${PORT}`);
    console.log(`   Namespace: ${STUDY_ROOM_SOCKET_NAMESPACE}`);
    console.log(`   CORS origins: ${CORS_ORIGINS.join(", ")}`);
    console.log(`   Health check: http://localhost:${PORT}/health\n`);
  });
}

start();
