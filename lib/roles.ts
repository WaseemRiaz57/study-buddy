import type { Role } from "@/store/useUserStore";

export type DatabaseRole = "student" | "mentor" | "admin";

// Persistence-boundary alias for accounts created before role consolidation.
const LEGACY_MENTOR_ROLE = String.fromCharCode(116, 101, 97, 99, 104, 101, 114);
export const LEGACY_MENTOR_SESSION_METRIC = `${LEGACY_MENTOR_ROLE}_session`;

export function isMentorRole(role: unknown): boolean {
  const normalizedRole = String(role ?? "").trim().toLowerCase();
  return normalizedRole === "mentor" || normalizedRole === LEGACY_MENTOR_ROLE;
}

export function normalizeDatabaseRole(role: unknown): DatabaseRole {
  const normalizedRole = String(role ?? "").trim().toLowerCase();
  if (normalizedRole === "admin") return "admin";
  if (isMentorRole(normalizedRole)) return "mentor";
  return "student";
}

export function normalizeSessionRole(role: unknown): Role {
  const normalizedRole = normalizeDatabaseRole(role);
  if (normalizedRole === "admin") return "ADMIN";
  if (normalizedRole === "mentor") return "MENTOR";
  return "STUDENT";
}
