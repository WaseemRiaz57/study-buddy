import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Session from "@/models/Session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/user/security/sessions
 * - With `{ sessionId }`: signs out that one device (never the current one).
 * - With no body: "Sign out all devices" — removes every session for the user
 *   EXCEPT the current one (identified by the JWT `sid`).
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = String(session?.user?.id || "").trim();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const currentSid =
      typeof token?.sid === "string" ? token.sid : undefined;

    const body = await request.json().catch(() => ({}));
    const sessionId = String(body?.sessionId || "").trim();

    // Sign out a single, specific device.
    if (sessionId) {
      const target = await Session.findOne({ _id: sessionId, userId }).select(
        "sid"
      );

      if (!target) {
        return NextResponse.json(
          { message: "Session not found." },
          { status: 404 }
        );
      }

      if (currentSid && target.sid === currentSid) {
        return NextResponse.json(
          { message: "You cannot sign out the device you are currently using here." },
          { status: 400 }
        );
      }

      await Session.deleteOne({ _id: sessionId, userId });

      return NextResponse.json({
        message: "Device signed out.",
        signedOut: 1,
      });
    }

    // Sign out of all OTHER devices.
    const filter = currentSid
      ? { userId, sid: { $ne: currentSid } }
      : { userId };

    const result = await Session.deleteMany(filter);

    return NextResponse.json({
      message: "Signed out of all other devices.",
      signedOut: result.deletedCount ?? 0,
    });
  } catch (error) {
    console.error("DELETE /api/user/security/sessions error:", error);
    return NextResponse.json(
      { message: "Failed to sign out devices." },
      { status: 500 }
    );
  }
}
