import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";

type UserStatus = "active" | "suspended";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

function normalizeStatus(status: unknown): UserStatus | null {
  const normalized = String(status ?? "").trim().toLowerCase();

  if (normalized === "active" || normalized === "suspended") {
    return normalized;
  }

  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Valid user id is required." },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      status?: unknown;
    };
    const status = normalizeStatus(body.status);

    if (!status) {
      return NextResponse.json(
        { message: "status must be either 'active' or 'suspended'." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).select("_id email status");

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    await logActivity({
      actionType: status === "suspended" ? "USER_SUSPENDED" : "USER_ACTIVATED",
      message:
        status === "suspended"
          ? `Admin suspended user ${user.email}`
          : `Admin activated user ${user.email}`,
      targetId: String(user._id),
    });

    return NextResponse.json({
      success: true,
      message:
        status === "suspended"
          ? "User suspended successfully."
          : "User activated successfully.",
      user: {
        id: String(user._id),
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Update admin user status error:", error);
    return NextResponse.json(
      { message: "Failed to update user status." },
      { status: 500 }
    );
  }
}
