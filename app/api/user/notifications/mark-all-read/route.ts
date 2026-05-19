import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
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

export async function PATCH() {
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

    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Invalid user session." }, { status: 400 });
    }

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);
    const audienceCandidates = getAudienceCandidates(user);
    const sharedConditions: Record<string, unknown>[] = [
      { isGlobal: true },
      { audience: "All Users" },
    ];

    if (audienceCandidates.length > 0) {
      sharedConditions.push({ audience: { $in: audienceCandidates } });
    }

    await Promise.all([
      Notification.updateMany(
        {
          $or: [
            { userId: session.user.id },
            { recipientId: session.user.id },
          ],
        },
        { $set: { read: true } }
      ),
      Notification.updateMany(
        {
          $or: sharedConditions,
        },
        { $addToSet: { readBy: userObjectId } }
      ),
    ]);

    return NextResponse.json({
      success: true,
      unreadCount: 0,
      message: "Notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return NextResponse.json(
      { message: "Failed to mark notifications as read." },
      { status: 500 }
    );
  }
}
