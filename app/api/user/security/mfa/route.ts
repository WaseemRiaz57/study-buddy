import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import { computeSecurityScore } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUT /api/user/security/mfa
 * Toggles the Email MFA and/or Biometric login flags. Only the fields present in
 * the request body are updated, so the endpoint can drive either toggle.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = String(session?.user?.id || "").trim();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const update: { emailMfaEnabled?: boolean; biometricEnabled?: boolean } = {};
    if (typeof body?.emailMfaEnabled === "boolean") {
      update.emailMfaEnabled = body.emailMfaEnabled;
    }
    if (typeof body?.biometricEnabled === "boolean") {
      update.biometricEnabled = body.biometricEnabled;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { message: "No valid MFA settings provided." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    ).select("emailMfaEnabled biometricEnabled passwordStrong");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const emailMfaEnabled = Boolean(user.emailMfaEnabled);
    const biometricEnabled = Boolean(user.biometricEnabled);
    const securityScore = computeSecurityScore({
      mfaEnabled: emailMfaEnabled || biometricEnabled,
      passwordStrong: Boolean(user.passwordStrong),
    });

    return NextResponse.json({
      message: "Security preferences updated.",
      emailMfaEnabled,
      biometricEnabled,
      securityScore,
    });
  } catch (error) {
    console.error("PUT /api/user/security/mfa error:", error);
    return NextResponse.json(
      { message: "Failed to update MFA settings." },
      { status: 500 }
    );
  }
}
