import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword, verifyPassword } from "@/lib/password";
import { computeSecurityScore, isStrongPassword } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUT /api/user/security/password
 * Verifies the current password (scrypt, via lib/password) and stores a new
 * strong password. OAuth-only accounts with no existing password may set one
 * without a current password.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = String(session?.user?.id || "").trim();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const currentPassword = String(body?.currentPassword || "");
    const newPassword = String(body?.newPassword || "");

    if (!isStrongPassword(newPassword)) {
      return NextResponse.json(
        {
          message:
            "New password must be at least 8 characters and include a letter and a number.",
        },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const user = await User.findById(userId).select(
      "password emailMfaEnabled biometricEnabled"
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const hasExistingPassword = Boolean(user.password);

    if (hasExistingPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: "Current password is required." },
          { status: 400 }
        );
      }

      const valid = await verifyPassword(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json(
          { message: "Current password is incorrect." },
          { status: 400 }
        );
      }

      if (await verifyPassword(newPassword, user.password)) {
        return NextResponse.json(
          { message: "New password must be different from the current one." },
          { status: 400 }
        );
      }
    }

    user.password = await hashPassword(newPassword);
    user.passwordStrong = true;
    user.passwordUpdatedAt = new Date();
    await user.save();

    const securityScore = computeSecurityScore({
      mfaEnabled: Boolean(user.emailMfaEnabled) || Boolean(user.biometricEnabled),
      passwordStrong: true,
    });

    return NextResponse.json({
      message: "Password updated successfully.",
      securityScore,
    });
  } catch (error) {
    console.error("PUT /api/user/security/password error:", error);
    return NextResponse.json(
      { message: "Failed to update password." },
      { status: 500 }
    );
  }
}
