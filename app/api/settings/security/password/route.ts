import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import { hashPassword, verifyPassword } from "@/lib/password";
import User from "@/models/User";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    const current = String(currentPassword || "");
    const next = String(newPassword || "");

    if (next.length < 8 || next.length > 128) {
      return NextResponse.json(
        { message: "Password must be between 8 and 128 characters." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        { message: "Password updates are unavailable for Google sign-in accounts." },
        { status: 400 }
      );
    }

    const isCurrentPasswordValid = await verifyPassword(current, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { message: "Current password is incorrect." },
        { status: 400 }
      );
    }

    user.password = await hashPassword(next);
    await user.save();

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json(
      { message: "Failed to update password." },
      { status: 500 }
    );
  }
}
