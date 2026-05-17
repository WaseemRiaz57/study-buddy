export const STUDY_ROOM_SOCKET_NAMESPACE = "/study-room";

export const ROOM_STATE_TTL_SECONDS = 6 * 60 * 60; // 6 hours max
export const ROOM_AUTO_CLOSE_GRACE_SECONDS = 5 * 60; // 5 minutes

export const MIN_ROOM_SESSION_MINUTES_FOR_XP = 10;
export const ROOM_XP_PER_MINUTE = 10;

export const MAX_UPLOAD_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export const ALLOWED_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".png",
  ".jpg",
  ".jpeg",
  ".xlsx",
] as const;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
] as const;

export function getLowerCaseExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

export function isAllowedUploadType(fileName: string, mimeType: string): boolean {
  const extension = getLowerCaseExtension(fileName);
  const normalizedMime = mimeType.trim().toLowerCase();

  return (
    ALLOWED_UPLOAD_EXTENSIONS.includes(
      extension as (typeof ALLOWED_UPLOAD_EXTENSIONS)[number]
    ) ||
    ALLOWED_UPLOAD_MIME_TYPES.includes(
      normalizedMime as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number]
    )
  );
}

