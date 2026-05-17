import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ message: "Unauthorized." }, { status: 401 }),
      session: null,
    };
  }

  if (String(session.user.role || "").toUpperCase() !== "ADMIN") {
    return {
      error: NextResponse.json({ message: "Forbidden." }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}

export function toDateLabel(value?: Date | string | null) {
  if (!value) return "Permanent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toISOString().slice(0, 10);
}
