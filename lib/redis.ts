import { Redis } from "@upstash/redis";
import {
  ROOM_AUTO_CLOSE_GRACE_SECONDS,
  ROOM_STATE_TTL_SECONDS,
} from "@/lib/study-room-constants";

let redisClient: Redis | null = null;

/**
 * Returns an HTTP-based Redis client.
 * If Upstash is not configured, returns null so callers can fall back to MongoDB.
 */
export async function getRedisClient(): Promise<Redis | null> {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  redisClient = new Redis({ url, token });
  return redisClient;
}

const ONLINE_SET_KEY = "study-buddy:online-students";
const ONLINE_TTL = 300;

export async function setStudentOnline(studentId: string): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  await client.sadd(ONLINE_SET_KEY, studentId);
  await client.set(`online:${studentId}`, "1", { ex: ONLINE_TTL });
}

export async function setStudentOffline(studentId: string): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  await client.srem(ONLINE_SET_KEY, studentId);
  await client.del(`online:${studentId}`);
}

export async function getOnlineStudentIds(): Promise<string[] | null> {
  const client = await getRedisClient();
  if (!client) return null;

  return client.smembers<string[]>(ONLINE_SET_KEY);
}

export interface StudyRoomRuntimeState {
  roomId: string;
  connectedUserIds: string[];
  awaitingAutoClose: boolean;
  lastEmptyAt: string | null;
  updatedAt: string;
}

function normalizeRoomId(roomId: string): string {
  return roomId.trim().toUpperCase();
}

function getStudyRoomStateKey(roomId: string): string {
  return `study-room:state:${normalizeRoomId(roomId)}`;
}

function getStudyRoomEmptyMarkerKey(roomId: string): string {
  return `study-room:empty:${normalizeRoomId(roomId)}`;
}

function uniqueUserIds(userIds: string[]): string[] {
  return [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
}

function clampRoomStateTtlSeconds(ttlSeconds?: number): number {
  if (!ttlSeconds || ttlSeconds <= 0) return ROOM_STATE_TTL_SECONDS;
  return Math.min(ttlSeconds, ROOM_STATE_TTL_SECONDS);
}

function normalizeIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString();
}

function createStudyRoomRuntimeState(
  roomId: string,
  connectedUserIds: string[],
  awaitingAutoClose: boolean,
  lastEmptyAt: string | null,
  updatedAt = new Date().toISOString()
): StudyRoomRuntimeState {
  return {
    roomId: normalizeRoomId(roomId),
    connectedUserIds: uniqueUserIds(connectedUserIds),
    awaitingAutoClose,
    lastEmptyAt,
    updatedAt,
  };
}

function parseStudyRoomRuntimeState(
  roomId: string,
  rawState: unknown
): StudyRoomRuntimeState | null {
  try {
    const parsed =
      typeof rawState === "string"
        ? (JSON.parse(rawState) as Partial<StudyRoomRuntimeState>)
        : (rawState as Partial<StudyRoomRuntimeState>);
    const normalizedRoomId = normalizeRoomId(roomId);

    return createStudyRoomRuntimeState(
      normalizedRoomId,
      Array.isArray(parsed.connectedUserIds)
        ? parsed.connectedUserIds.filter(
            (userId): userId is string => typeof userId === "string"
          )
        : [],
      Boolean(parsed.awaitingAutoClose),
      normalizeIsoDate(parsed.lastEmptyAt),
      normalizeIsoDate(parsed.updatedAt) || new Date().toISOString()
    );
  } catch {
    return null;
  }
}

export async function getStudyRoomState(
  roomId: string
): Promise<StudyRoomRuntimeState | null> {
  const client = await getRedisClient();
  if (!client) return null;

  const rawState = await client.get(getStudyRoomStateKey(roomId));
  if (!rawState) return null;

  return parseStudyRoomRuntimeState(roomId, rawState);
}

export async function setStudyRoomState(
  roomId: string,
  state: StudyRoomRuntimeState,
  ttlSeconds?: number
): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  const normalizedRoomId = normalizeRoomId(roomId);
  const nextState = createStudyRoomRuntimeState(
    normalizedRoomId,
    state.connectedUserIds,
    state.awaitingAutoClose,
    state.lastEmptyAt
  );

  await client.set(getStudyRoomStateKey(normalizedRoomId), JSON.stringify(nextState), {
    ex: clampRoomStateTtlSeconds(ttlSeconds),
  });
}

export async function initializeStudyRoomState(
  roomId: string,
  connectedUserIds: string[] = []
): Promise<StudyRoomRuntimeState> {
  const normalizedRoomId = normalizeRoomId(roomId);
  const state = createStudyRoomRuntimeState(
    normalizedRoomId,
    connectedUserIds,
    false,
    null
  );

  await setStudyRoomState(normalizedRoomId, state);
  return state;
}

export async function touchStudyRoomState(
  roomId: string,
  ttlSeconds?: number
): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  await client.expire(
    getStudyRoomStateKey(roomId),
    clampRoomStateTtlSeconds(ttlSeconds)
  );
}

export async function markStudyRoomParticipantConnected(
  roomId: string,
  userId: string
): Promise<StudyRoomRuntimeState | null> {
  const normalizedRoomId = normalizeRoomId(roomId);
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    return getStudyRoomState(normalizedRoomId);
  }

  const existingState =
    (await getStudyRoomState(normalizedRoomId)) ||
    createStudyRoomRuntimeState(normalizedRoomId, [], false, null);

  const nextState = createStudyRoomRuntimeState(
    normalizedRoomId,
    [...existingState.connectedUserIds, normalizedUserId],
    false,
    null
  );

  await setStudyRoomState(normalizedRoomId, nextState);

  const client = await getRedisClient();
  if (client) {
    await client.del(getStudyRoomEmptyMarkerKey(normalizedRoomId));
  }

  return nextState;
}

export async function markStudyRoomParticipantDisconnected(
  roomId: string,
  userId: string
): Promise<StudyRoomRuntimeState | null> {
  const normalizedRoomId = normalizeRoomId(roomId);
  const normalizedUserId = userId.trim();

  const existingState =
    (await getStudyRoomState(normalizedRoomId)) ||
    createStudyRoomRuntimeState(normalizedRoomId, [], false, null);

  const nextConnectedUserIds = existingState.connectedUserIds.filter(
    (connectedUserId) => connectedUserId !== normalizedUserId
  );

  const shouldWaitForAutoClose = nextConnectedUserIds.length === 0;
  const nextState = createStudyRoomRuntimeState(
    normalizedRoomId,
    nextConnectedUserIds,
    shouldWaitForAutoClose,
    shouldWaitForAutoClose ? new Date().toISOString() : null
  );

  await setStudyRoomState(normalizedRoomId, nextState);

  const client = await getRedisClient();
  if (client) {
    if (shouldWaitForAutoClose) {
      await client.set(
        getStudyRoomEmptyMarkerKey(normalizedRoomId),
        nextState.lastEmptyAt || new Date().toISOString(),
        { ex: ROOM_AUTO_CLOSE_GRACE_SECONDS }
      );
    } else {
      await client.del(getStudyRoomEmptyMarkerKey(normalizedRoomId));
    }
  }

  return nextState;
}

export async function getStudyRoomEmptyTtlSeconds(
  roomId: string
): Promise<number | null> {
  const client = await getRedisClient();
  if (!client) return null;

  const ttl = await client.ttl(getStudyRoomEmptyMarkerKey(roomId));
  if (ttl < 0) return null;

  return ttl;
}

export async function isStudyRoomAutoCloseDue(
  roomId: string,
  state?: StudyRoomRuntimeState | null
): Promise<boolean> {
  const normalizedRoomId = normalizeRoomId(roomId);
  const runtimeState = state ?? (await getStudyRoomState(normalizedRoomId));

  if (!runtimeState || !runtimeState.awaitingAutoClose) {
    return false;
  }

  const client = await getRedisClient();
  if (client) {
    const ttl = await client.ttl(getStudyRoomEmptyMarkerKey(normalizedRoomId));

    if (ttl === -2) return true;
    if (ttl >= 0) return false;
  }

  if (!runtimeState.lastEmptyAt) return false;

  const elapsedMs = Date.now() - new Date(runtimeState.lastEmptyAt).getTime();
  return elapsedMs >= ROOM_AUTO_CLOSE_GRACE_SECONDS * 1000;
}

export async function clearStudyRoomRuntimeState(roomId: string): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  await client.del(
    getStudyRoomStateKey(roomId),
    getStudyRoomEmptyMarkerKey(roomId)
  );
}
