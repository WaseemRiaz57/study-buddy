import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import ModerationLog from "@/models/ModerationLog";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await connectMongoDB();

  const [user, logs] = await Promise.all([
    User.findById(session.user.id, "accountStatus status activeStrikes").lean(),
    ModerationLog.find({ userId: session.user.id, isActive: true })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return NextResponse.json({
    status: {
      accountStatus: user?.accountStatus || user?.status || "active",
      activeStrikes: Number(user?.activeStrikes || 0),
    },
    logs: logs.map((log) => ({
      id: log._id.toString(),
      actionType: log.actionType,
      reason: log.reason,
      expiresAt: log.expiresAt || null,
      createdAt: log.createdAt,
    })),
  });
}
