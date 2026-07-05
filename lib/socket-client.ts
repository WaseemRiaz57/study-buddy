import { STUDY_ROOM_SOCKET_NAMESPACE } from "@/lib/study-room-constants";

const PROTOCOL_ONLY_VALUES = new Set(["http", "https", "ws", "wss"]);
let hasWarnedAboutMissingSocketUrl = false;

function normalizeSocketServerUrl(rawUrl: string) {
  const trimmedUrl = rawUrl.trim().replace(/\/+$/, "");

  if (!trimmedUrl || PROTOCOL_ONLY_VALUES.has(trimmedUrl.toLowerCase())) {
    return null;
  }

  if (
    !/^[a-z][a-z\d+.-]*:\/\//i.test(trimmedUrl) &&
    /^[a-z0-9.-]+(?::\d+)?$/i.test(trimmedUrl)
  ) {
    const protocol =
      typeof window !== "undefined" && window.location.protocol === "http:"
        ? "http:"
        : "https:";

    return `${protocol}//${trimmedUrl}`;
  }

  const protocolNormalizedUrl = trimmedUrl
    .replace(/^wss:\/\//i, "https://")
    .replace(/^ws:\/\//i, "http://");

  try {
    const url = new URL(protocolNormalizedUrl);

    if (
      !url.hostname ||
      PROTOCOL_ONLY_VALUES.has(url.hostname.toLowerCase())
    ) {
      return null;
    }

    const pathname = url.pathname.replace(/\/+$/, "");
    const basePath =
      pathname && pathname !== "/" && pathname !== STUDY_ROOM_SOCKET_NAMESPACE
        ? pathname
        : "";

    return `${url.origin}${basePath}`;
  } catch {
    return null;
  }
}

export function getStudyRoomSocketUrl() {
  const socketServerUrl = normalizeSocketServerUrl(
    process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || ""
  );

  if (!socketServerUrl) {
    if (!hasWarnedAboutMissingSocketUrl) {
      console.warn(
        "Study room socket disabled: NEXT_PUBLIC_SOCKET_SERVER_URL is missing or invalid."
      );
      hasWarnedAboutMissingSocketUrl = true;
    }

    return null;
  }

  return `${socketServerUrl}${STUDY_ROOM_SOCKET_NAMESPACE}`;
}
