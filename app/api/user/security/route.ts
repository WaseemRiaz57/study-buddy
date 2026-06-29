import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import Session from "@/models/Session";
import { computeSecurityScore } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/user/security
 * Returns the user's MFA settings, calculated security score, and every active
 * device session. The session matching the caller's JWT `sid` is flagged as the
 * current session.
 */
export async function GET(request: NextRequest) {
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

    const user = await User.findById(userId)
      .select("emailMfaEnabled biometricEnabled passwordStrong password")
      .lean<{
        emailMfaEnabled?: boolean;
        biometricEnabled?: boolean;
        passwordStrong?: boolean;
        password?: string;
      }>();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Keep the current device's activity fresh on every load.
    if (currentSid) {
      await Session.updateOne(
        { sid: currentSid, userId },
        { $set: { lastActive: new Date() } }
      );
    }

    const rawSessions = await Session.find({ userId })
      .sort({ lastActive: -1 })
      .lean<
        Array<{
          _id: unknown;
          sid: string;
          device: string;
          os: string;
          browser: string;
          deviceType: string;
          location: string;
          ipAddress: string;
          lastActive: Date;
        }>
      >();

    const sessions = rawSessions.map((s) => ({
      id: String(s._id),
      device: s.device,
      os: s.os,
      browser: s.browser,
      deviceType: s.deviceType || "laptop",
      location: s.location,
      ipAddress: s.ipAddress,
      lastActive: s.lastActive,
      isCurrentSession: Boolean(currentSid && s.sid === currentSid),
    }));

    const emailMfaEnabled = Boolean(user.emailMfaEnabled);
    const biometricEnabled = Boolean(user.biometricEnabled);
    const passwordStrong = Boolean(user.passwordStrong);
    const securityScore = computeSecurityScore({
      mfaEnabled: emailMfaEnabled || biometricEnabled,
      passwordStrong,
    });

    return NextResponse.json({
      securityScore,
      emailMfaEnabled,
      biometricEnabled,
      passwordStrong,
      hasPassword: Boolean(user.password),
      sessions,
    });
  } catch (error) {
    console.error("GET /api/user/security error:", error);
    return NextResponse.json(
      { message: "Failed to load security settings." },
      { status: 500 }
    );
  }
}
