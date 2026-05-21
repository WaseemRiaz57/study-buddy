import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Valid notification id is required." }, { status: 400 });
    }

    await connectMongoDB();

    const notification = await Notification.findById(id);

    if (!notification) {
      return NextResponse.json({ success: true, message: "Notification removed." });
    }

    const currentUserId = String(session.user.id);
    const isPersonal =
      String(notification.userId || "") === currentUserId ||
      String(notification.recipientId || "") === currentUserId;

    if (isPersonal && !notification.isGlobal && !notification.audience) {
      await Notification.findByIdAndDelete(id);
    } else {
      notification.hiddenBy = [
        ...new Set([
          ...(Array.isArray(notification.hiddenBy)
            ? notification.hiddenBy.map((userId: unknown) => String(userId))
            : []),
          currentUserId,
        ]),
      ].map((userId) => new mongoose.Types.ObjectId(userId));
      notification.readBy = [
        ...new Set([
          ...(Array.isArray(notification.readBy)
            ? notification.readBy.map((userId: unknown) => String(userId))
            : []),
          currentUserId,
        ]),
      ].map((userId) => new mongoose.Types.ObjectId(userId));
      await notification.save();
    }

    return NextResponse.json({ success: true, message: "Notification removed." });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json({ message: "Failed to remove notification." }, { status: 500 });
  }
}
