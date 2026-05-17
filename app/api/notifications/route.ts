import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import NotificationModel from "@/models/Notification";

/**
 * GET /api/notifications — Fetch all notifications for the current user.
 * Query params: ?unreadOnly=true&limit=20
 */
export async function GET(req: NextRequest) {
  const { error, session } = await requireRole("student", "mentor", "admin");
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100);

    await connectMongoDB();

    const filter: Record<string, unknown> = {
      recipientId: session!.user.id,
    };
    if (unreadOnly) filter.read = false;

    const notifications = await NotificationModel.find(filter)
      .populate("senderId", "name image")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await NotificationModel.countDocuments({
      recipientId: session!.user.id,
      read: false,
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("Notifications GET Error:", err);
    return NextResponse.json(
      { message: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications — Mark notifications as read.
 * Body: { notificationIds: string[] } or { markAllRead: true }
 */
export async function PATCH(req: NextRequest) {
  const { error, session } = await requireRole("student", "mentor", "admin");
  if (error) return error;

  try {
    const { notificationIds, markAllRead } = await req.json();

    await connectMongoDB();

    if (markAllRead) {
      await NotificationModel.updateMany(
        { recipientId: session!.user.id, read: false },
        { read: true }
      );
      return NextResponse.json({ message: "All notifications marked as read." });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { message: "Provide notificationIds array or markAllRead: true." },
        { status: 400 }
      );
    }

    await NotificationModel.updateMany(
      {
        _id: { $in: notificationIds },
        recipientId: session!.user.id,
      },
      { read: true }
    );

    return NextResponse.json({ message: "Notifications marked as read." });
  } catch (err) {
    console.error("Notifications PATCH Error:", err);
    return NextResponse.json(
      { message: "Failed to update notifications." },
      { status: 500 }
    );
  }
}


