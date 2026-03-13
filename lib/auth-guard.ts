import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";

export type AllowedRole = "student" | "mentor" | "admin";

/**
 * Returns the authenticated session if the user has one of the allowed roles.
 * Otherwise returns an appropriate NextResponse error.
 *
 * Usage:
 *   const { error, session } = await requireRole("student");
 *   if (error) return error;
 *   // session is guaranteed non-null here
 */
export async function requireRole(...roles: AllowedRole[]) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      error: NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      ),
      session: null,
    };
  }

  // DB stores lowercase roles; session.user.role is uppercased by normalizeRole
  const userRole = session.user.role?.toLowerCase() as AllowedRole;

  if (!roles.includes(userRole)) {
    return {
      error: NextResponse.json(
        {
          message: `Forbidden. This feature is only available to: ${roles.join(", ")}.`,
        },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}
