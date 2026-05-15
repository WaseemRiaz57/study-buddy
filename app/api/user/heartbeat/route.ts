import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = String(session?.user?.id || "").trim();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const user = await User.findByIdAndUpdate(
      currentUserId,
      { $set: { lastActive: new Date() } },
      { new: true }
    ).select("_id lastActive");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      lastActive: user.lastActive,
    });
  } catch (error) {
    console.error("User Heartbeat Error:", error);
    return NextResponse.json(
      { message: "Internal server error while updating heartbeat." },
      { status: 500 }
    );
  }
}
