import { createClient, RedisClientType } from "redis";

let redisClient: RedisClientType | null = null;
let connectionFailed = false;

/**
 * Returns a connected Redis client.
 * If Redis is unavailable, returns null so callers can fall back to MongoDB.
 */
export async function getRedisClient(): Promise<RedisClientType | null> {
  if (connectionFailed) return null;

  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const url = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    redisClient = createClient({ url }) as RedisClientType;

    redisClient.on("error", (err: Error) => {
      console.error("Redis Client Error:", err.message);
    });

    await redisClient.connect();
    console.log("Redis connected successfully");
    return redisClient;
  } catch {
    console.warn(
      "Redis unavailable — falling back to MongoDB for online status."
    );
    connectionFailed = true;
    redisClient = null;
    return null;
  }
}

// ── Online-status helpers ──────────────────────────────────────────

const ONLINE_SET_KEY = "study-buddy:online-students";
const ONLINE_TTL = 300; // 5 minutes — student must heartbeat to stay online

/**
 * Mark a student as online in Redis.
 */
export async function setStudentOnline(studentId: string): Promise<void> {
  const client = await getRedisClient();
  if (client) {
    await client.sAdd(ONLINE_SET_KEY, studentId);
    // Per-student key with TTL for auto-expiry
    await client.set(`online:${studentId}`, "1", { EX: ONLINE_TTL });
  }
}

/**
 * Mark a student as offline in Redis.
 */
export async function setStudentOffline(studentId: string): Promise<void> {
  const client = await getRedisClient();
  if (client) {
    await client.sRem(ONLINE_SET_KEY, studentId);
    await client.del(`online:${studentId}`);
  }
}

/**
 * Returns all currently online student IDs from Redis.
 * Returns null when Redis is unavailable (caller should fall back to MongoDB).
 */
export async function getOnlineStudentIds(): Promise<string[] | null> {
  const client = await getRedisClient();
  if (!client) return null;

  return client.sMembers(ONLINE_SET_KEY);
}
