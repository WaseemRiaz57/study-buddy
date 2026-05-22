import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient } from "@/lib/redis";

const AI_GENERATION_LIMIT = 5;
const AI_GENERATION_WINDOW = "1 m";
const AI_GENERATION_WINDOW_MS = 60 * 1000;

let aiGenerationRateLimit: Ratelimit | null = null;

async function getAiGenerationRateLimit() {
  if (aiGenerationRateLimit) return aiGenerationRateLimit;

  const redis = await getRedisClient();
  if (!redis) return null;

  aiGenerationRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      AI_GENERATION_LIMIT,
      AI_GENERATION_WINDOW
    ),
    analytics: true,
    prefix: "ratelimit:ai-generation",
  });

  return aiGenerationRateLimit;
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();

  return (
    forwardedIp ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export async function checkAiGenerationRateLimit(
  request: Request,
  userId?: string
) {
  const ratelimit = await getAiGenerationRateLimit();
  const ip = getClientIp(request);
  const identifier = userId?.trim() ? `user:${userId.trim()}` : `ip:${ip}`;

  if (!ratelimit) {
    return {
      success: true,
      limit: AI_GENERATION_LIMIT,
      remaining: AI_GENERATION_LIMIT,
      reset: Date.now() + AI_GENERATION_WINDOW_MS,
      pending: Promise.resolve(),
    };
  }

  return ratelimit.limit(identifier, {
    ip,
    userAgent: request.headers.get("user-agent") || undefined,
  });
}
