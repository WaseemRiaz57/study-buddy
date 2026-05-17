import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import BroadcastLog from "@/models/BroadcastLog";

export const dynamic = "force-dynamic";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

function serializeBroadcastLog(log: any) {
  return {
    id: String(log._id),
    title: log.title || "Untitled broadcast",
    message: log.message || "",
    deliveryMethods: Array.isArray(log.deliveryMethods)
      ? log.deliveryMethods
      : [],
    audience: log.audience || "All Users",
    targetCount: Number(log.targetCount || 0),
    emailSuccessCount: Number(log.emailSuccessCount || 0),
    emailFailureCount: Number(log.emailFailureCount || 0),
    createdAt: log.createdAt,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectMongoDB();

    const logs = await BroadcastLog.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      history: logs.map(serializeBroadcastLog),
    });
  } catch (error) {
    console.error("Fetch broadcast history error:", error);
    return NextResponse.json(
      { message: "Failed to fetch broadcast history." },
      { status: 500 }
    );
  }
}


