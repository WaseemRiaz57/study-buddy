import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

export async function DELETE(
  _request: Request,
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

    if (String(session.user.id) === id) {
      return NextResponse.json(
        { message: "You cannot delete your own admin account." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const user = await User.findByIdAndDelete(id).select("_id email");

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    await logActivity({
      actionType: "USER_DELETED",
      message: `Admin deleted user ${user.email}`,
      targetId: String(user._id),
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
      user: {
        id: String(user._id),
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Delete admin user error:", error);
    return NextResponse.json(
      { message: "Failed to delete user." },
      { status: 500 }
    );
  }
}


