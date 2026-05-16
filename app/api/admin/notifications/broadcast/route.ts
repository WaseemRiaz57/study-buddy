import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";

export const dynamic = "force-dynamic";

type Audience = "all" | "free" | "pro";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

function normalizeAudience(value: unknown): Audience | null {
  const audience = String(value || "").trim().toLowerCase();

  if (audience === "all" || audience === "free" || audience === "pro") {
    return audience;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || "").trim().slice(0, 140);
    const message = String(body.message || "").trim().slice(0, 800);
    const audience = normalizeAudience(body.audience);

    if (!title || !message || !audience) {
      return NextResponse.json(
        { message: "title, message, and audience ('all' | 'free' | 'pro') are required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const userQuery =
      audience === "all"
        ? {}
        : audience === "free"
          ? { $or: [{ plan: "Free" }, { plan: { $exists: false } }] }
          : { plan: { $in: ["Pro", "Elite"] } };
    const audienceLabel =
      audience === "all"
        ? "All Users"
        : audience === "free"
          ? "Free"
          : "Pro";

    const users = await User.find(userQuery).select("_id").lean();
    const senderId = mongoose.Types.ObjectId.isValid(session.user.id)
      ? new mongoose.Types.ObjectId(session.user.id)
      : null;

    if (users.length > 0) {
      await Notification.insertMany(
        users.map((user) => ({
          userId: user._id,
          recipientId: user._id,
          senderId,
          type: "system",
          title,
          message,
          audience: audienceLabel,
          read: false,
          isGlobal: true,
          metadata: {
            audience,
            broadcastTitle: title,
          },
        }))
      );
    }

    await logActivity({
      actionType: "GLOBAL_NOTIFICATION_SENT",
      message: `Admin sent a global notification: ${title}`,
    });

    return NextResponse.json({
      success: true,
      message: "Global notification sent.",
      sentCount: users.length,
      audience,
    });
  } catch (error) {
    console.error("Broadcast notification error:", error);
    return NextResponse.json(
      { message: "Failed to send global notification." },
      { status: 500 }
    );
  }
}
