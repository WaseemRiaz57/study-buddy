type EmitSocketEventOptions = {
  userId: string;
  event: string;
  payload: unknown;
};

function getSocketServerUrl() {
  return process.env.NEXT_PUBLIC_SOCKET_SERVER_URL?.trim().replace(/\/+$/, "") || "";
}

export async function emitSocketEventToUser({
  userId,
  event,
  payload,
}: EmitSocketEventOptions): Promise<boolean> {
  const socketServerUrl = getSocketServerUrl();
  const normalizedUserId = String(userId || "").trim();
  const normalizedEvent = String(event || "").trim();

  if (!socketServerUrl || !normalizedUserId || !normalizedEvent) {
    return false;
  }

  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    const emitSecret = process.env.EMIT_SECRET;
    if (emitSecret) headers["x-emit-secret"] = emitSecret;

    const response = await fetch(`${socketServerUrl}/emit`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        event: normalizedEvent,
        userId: normalizedUserId,
        payload,
      }),
      signal: AbortSignal.timeout(3000),
    });

    return response.ok;
  } catch (error) {
    console.error("Socket event emit failed:", error);
    return false;
  }
}
