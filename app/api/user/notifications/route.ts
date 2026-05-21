import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function getAudienceCandidates(user: any) {
  const role = String(user?.role || "").trim();
  const plan = String(user?.plan || user?.subscriptionPlan || "").trim();
  const candidates = new Set<string>();

  if (role) {
    candidates.add(role);
    candidates.add(role.toLowerCase());
    candidates.add(`${role.charAt(0).toUpperCase()}${role.slice(1)}s`);
  }

  if (plan) {
    candidates.add(plan);
    candidates.add(plan.toLowerCase());
    candidates.add(`${plan} Users`);
    if (plan === "Pro" || plan === "Elite") {
      candidates.add("Pro");
      candidates.add("pro");
      candidates.add("Pro / Elite Users");
      candidates.add("Pro / Elite Users Only");
    }
  }

  return Array.from(candidates);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const user = await User.findById(session.user.id)
      .select("role plan subscriptionPlan createdAt")
      .lean();

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const userObjectId = session.user.id;
    const userCreatedAt = user.createdAt || new Date(0);
    const broadcastScope = { createdAt: { $gte: userCreatedAt } };
    const conditions: Record<string, unknown>[] = [
      { userId: session.user.id },
      { recipientId: session.user.id },
      { isGlobal: true, ...broadcastScope },
      { audience: "All Users", ...broadcastScope },
    ];
    const audienceCandidates = getAudienceCandidates(user);

    if (audienceCandidates.length > 0) {
      conditions.push({ audience: { $in: audienceCandidates }, ...broadcastScope });
    }

    const notifications = await Notification.find({
      $or: conditions,
      hiddenBy: { $ne: userObjectId },
    })
      .populate("senderId", "name image")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const userId = String(session.user.id);
    const normalizedNotifications = notifications.map((notification: any) => {
      const readBy = Array.isArray(notification.readBy)
        ? notification.readBy.map((id: unknown) => String(id))
        : [];

      return {
        ...notification,
        read: Boolean(notification.read) || readBy.includes(userId),
      };
    });

    const unreadCount = normalizedNotifications.filter(
      (notification) => !notification.read
    ).length;

    return NextResponse.json({
      notifications: normalizedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error("User notifications error:", error);
    return NextResponse.json(
      { message: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}


