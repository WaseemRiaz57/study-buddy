import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function getAudienceCandidates(user: any) {
  const role = String(user?.role || "").trim();
  const plan = String(user?.plan || "").trim();
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
      .select("role plan")
      .lean();

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const conditions: Record<string, unknown>[] = [
      { userId: session.user.id },
      { recipientId: session.user.id },
      { isGlobal: true },
      { audience: "All Users" },
    ];
    const audienceCandidates = getAudienceCandidates(user);

    if (audienceCandidates.length > 0) {
      conditions.push({ audience: { $in: audienceCandidates } });
    }

    const notifications = await Notification.find({
      $or: conditions,
    })
      .populate("senderId", "name image")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const unreadCount = notifications.filter((notification) => !notification.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("User notifications error:", error);
    return NextResponse.json(
      { message: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}


