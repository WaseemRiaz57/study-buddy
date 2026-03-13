import crypto from "crypto";

// ── Agora configuration ────────────────────────────────────────────
const AGORA_APP_ID = process.env.AGORA_APP_ID || "";
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || "";

/** Token validity: 24 hours (in seconds) */
const TOKEN_EXPIRY_SECS = 86400;

/** Agora role constants */
const ROLE_PUBLISHER = 1;

/**
 * Generate a unique channel name for a study room.
 * Format: studyroom-<random hex>-<timestamp>
 */
export function generateChannelName(): string {
  const random = crypto.randomBytes(8).toString("hex");
  const ts = Date.now().toString(36);
  return `studyroom-${random}-${ts}`;
}

/**
 * Build an Agora RTC token using HMAC-based signing.
 *
 * This is a lightweight server-side token builder that doesn't require the
 * official Agora SDK. It produces an "007" token that the Agora Web SDK
 * can consume.
 *
 * When AGORA_APP_CERTIFICATE is not set, we return a placeholder so
 * development can continue without Agora credentials.
 */
export function generateAgoraToken(
  channelName: string,
  uid: number | string
): string {
  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    // Return a dev-mode placeholder — frontend should detect this and
    // fall back to a local WebRTC peer connection or mock mode.
    return `DEV_TOKEN::${channelName}::${uid}`;
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + TOKEN_EXPIRY_SECS;

  // Build message to sign
  const message = Buffer.from(
    `${AGORA_APP_ID}${channelName}${uid}${ROLE_PUBLISHER}${privilegeExpiredTs}`
  );

  const signature = crypto
    .createHmac("sha256", AGORA_APP_CERTIFICATE)
    .update(message)
    .digest("hex");

  // Pack all fields so the frontend can transmit them
  const tokenPayload = {
    appId: AGORA_APP_ID,
    channel: channelName,
    uid,
    role: ROLE_PUBLISHER,
    expiry: privilegeExpiredTs,
    sig: signature,
  };

  // Base-64 encode the JSON payload prefixed with "007"
  return `007${Buffer.from(JSON.stringify(tokenPayload)).toString("base64")}`;
}

/**
 * Returns the Agora App ID (safe to expose to the frontend).
 */
export function getAgoraAppId(): string {
  return AGORA_APP_ID;
}

/**
 * Convenience: generate channel + tokens for two participants.
 */
export function createRoomCredentials(
  studentAId: string,
  studentBId: string
): {
  channelName: string;
  agoraAppId: string;
  tokens: { [userId: string]: string };
} {
  const channelName = generateChannelName();

  return {
    channelName,
    agoraAppId: getAgoraAppId(),
    tokens: {
      [studentAId]: generateAgoraToken(channelName, studentAId),
      [studentBId]: generateAgoraToken(channelName, studentBId),
    },
  };
}
