import { getToken, type JWT } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

type RoomJwtSuccess = {
  error: null;
  userId: string;
  role: string | null;
};

type RoomJwtFailure = {
  error: NextResponse;
  userId: null;
  role: null;
};

export type RoomJwtValidationResult = RoomJwtSuccess | RoomJwtFailure;

function resolveUserIdFromToken(token: JWT): string | null {
  if (typeof token.id === "string" && token.id.trim()) {
    return token.id;
  }

  if (typeof token.sub === "string" && token.sub.trim()) {
    return token.sub;
  }

  return null;
}

function resolveRoleFromToken(token: JWT): string | null {
  if (typeof token.role === "string" && token.role.trim()) {
    return token.role;
  }

  return null;
}

/**
 * Validates NextAuth JWT for study-room endpoints.
 * This helper is designed to run on every room API call.
 */
export async function requireStudyRoomJwt(
  request: NextRequest
): Promise<RoomJwtValidationResult> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      userId: null,
      role: null,
    };
  }

  const userId = resolveUserIdFromToken(token);

  if (!userId) {
    return {
      error: NextResponse.json(
        { message: "Unauthorized: invalid token payload" },
        { status: 401 }
      ),
      userId: null,
      role: null,
    };
  }

  return {
    error: null,
    userId,
    role: resolveRoleFromToken(token),
  };
}

